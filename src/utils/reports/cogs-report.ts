import {
  IDestinationData,
  IIndexedDestinationPackageData,
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  IIndexedTransferData,
  IPackageFilter,
  IPluginState,
  ISimpleOutgoingTransferData,
  ISimplePackageData,
  ISimpleTransferPackageData,
  ITransferFilter,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  ICogsArchive,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { CompressedDataWrapper } from "../compression";
import { getIsoDateFromOffset, todayIsodate } from "../date";
import { getId, getItemName, getLabel, getParentPackageLabels } from "../package";
import { createDebugSheetOrError } from "../sheets-export";

interface ICogsReportFormFilters {
  cogsDateGt: string;
  cogsDateLt: string;
}

export const cogsFormFiltersFactory: () => ICogsReportFormFilters = () => ({
  cogsDateGt: todayIsodate(),
  cogsDateLt: todayIsodate(),
});

export function addCogsReport({
  reportConfig,
  cogsFormFilters,
  mutableArchiveData,
}: {
  reportConfig: IReportConfig;
  cogsFormFilters: ICogsReportFormFilters;
  mutableArchiveData: ICogsArchive;
}) {
  const packageFilter: IPackageFilter = {};
  const transferFilter: ITransferFilter = {};

  packageFilter.packagedDateGt = cogsFormFilters.cogsDateGt;
  packageFilter.packagedDateLt = cogsFormFilters.cogsDateLt;

  transferFilter.estimatedDepartureDateGt = cogsFormFilters.cogsDateGt;
  transferFilter.estimatedDepartureDateLt = cogsFormFilters.cogsDateLt;

  reportConfig[ReportType.COGS] = {
    packageFilter,
    transferFilter,
    fields: null,
    mutableArchiveData,
  };
}

function simplePackageConverter(pkg: IIndexedPackageData): ISimplePackageData {
  return {
    LicenseNumber: pkg.LicenseNumber,
    Id: getId(pkg),
    PackageState: pkg.PackageState,
    Label: getLabel(pkg),
    ItemName: getItemName(pkg),
    SourcePackageLabels: pkg.SourcePackageLabels,
    ProductionBatchNumber: pkg.ProductionBatchNumber,
    parentPackageLabels: null,
    childPackageLabelQuantityPairs: null,
  };
}

function simpleTransferPackageConverter(
  transfer: IIndexedTransferData,
  destination: IDestinationData,
  pkg: IIndexedDestinationPackageData
): ISimpleTransferPackageData {
  return {
    ETD: destination.EstimatedDepartureDateTime,
    Type: destination.ShipmentTypeName,
    ManifestNumber: transfer.ManifestNumber,
    LicenseNumber: transfer.LicenseNumber,
    Id: getId(pkg),
    PackageState: pkg.PackageState,
    Label: getLabel(pkg),
    ItemName: getItemName(pkg),
    SourcePackageLabels: pkg.SourcePackageLabels,
    ProductionBatchNumber: pkg.ProductionBatchNumber,
    parentPackageLabels: null,
    childPackageLabelQuantityPairs: null,
  };
}

export async function maybeLoadCogsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!reportConfig[ReportType.COGS]) {
    return;
  }

  // packageFilter and transferFilter will have identical dates
  const { transferFilter } = reportConfig[ReportType.COGS]!;

  // const globalPackageMap: Map<string, ISimpleCogsPackageData> = new Map();

  const mutableArchiveData = reportConfig[ReportType.COGS]!.mutableArchiveData;

  const packageWrapper = new CompressedDataWrapper<ISimplePackageData>(
    "Package",
    mutableArchiveData.packages,
    "Label",
    mutableArchiveData.packagesKeys
  );
  const transferWrapper = new CompressedDataWrapper<ISimpleOutgoingTransferData>(
    "Transfers",
    mutableArchiveData.transfers,
    "ManifestNumber",
    mutableArchiveData.transfersKeys
  );
  const transferPackageWrapper = new CompressedDataWrapper<ISimpleTransferPackageData>(
    "Transfer Package",
    mutableArchiveData.transfersPackages,
    "Label",
    mutableArchiveData.transfersPackagesKeys
  );

  let dataLoader: DataLoader | null = null;

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);

    try {
      (await dataLoader.activePackages(24 * 60 * 60 * 1000)).map((pkg) => {
        packageWrapper.add(simplePackageConverter(pkg));
      });
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load active packages. (${license})`, level: "warning" },
      });
    }

    packageWrapper.flushCounter();

    try {
      (await dataLoader.onHoldPackages()).map(simplePackageConverter);
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load on hold packages. (${license})`, level: "warning" },
      });
    }

    packageWrapper.flushCounter();

    try {
      (await dataLoader.inactivePackages(24 * 60 * 60 * 1000)).map((pkg) => {
        packageWrapper.add(simplePackageConverter(pkg));
      });
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load inactive packages. (${license})`, level: "warning" },
      });
    }

    packageWrapper.flushCounter();

    try {
      (await dataLoader.inTransitPackages()).map((pkg) => {
        packageWrapper.add(simplePackageConverter(pkg));
      });
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Failed to load in transit packages. (${license})`,
          level: "warning",
        },
      });
    }

    packageWrapper.flushCounter();
  }

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} transfers...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);
    try {
      const outgoingTransfers = await dataLoader.outgoingTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...outgoingTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load outgoing transfers.", level: "warning" },
      });
    }

    try {
      const rejectedTransfers = await dataLoader.rejectedTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...rejectedTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load rejected transfers.", level: "warning" },
      });
    }

    try {
      const outgoingInactiveTransfers = await dataLoader.outgoingInactiveTransfers();
      richOutgoingTransfers = [...richOutgoingTransfers, ...outgoingInactiveTransfers];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load outgoing inactive transfers.", level: "warning" },
      });
    }
  }

  const [departureDateGt] = transferFilter.estimatedDepartureDateGt!.split("T");
  const [departureDateLt] = getIsoDateFromOffset(1, transferFilter.estimatedDepartureDateLt!).split(
    "T"
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading destinations....", level: "success" },
  });

  let inflightCount = 0;

  const richOutgoingTransferDestinationRequests: Promise<any>[] = [];

  for (const transfer of richOutgoingTransfers) {
    if (transferWrapper.index.has(transfer.ManifestNumber)) {
      continue;
    }

    inflightCount++;
    richOutgoingTransferDestinationRequests.push(
      getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
        dataLoader
          .transferDestinations(transfer.Id)
          .then((destinations) => {
            transfer.outgoingDestinations = destinations;
          })
          .finally(() => inflightCount--)
      )
    );

    if (richOutgoingTransferDestinationRequests.length % 250 === 0) {
      await Promise.allSettled(richOutgoingTransferDestinationRequests);

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Loaded ${richOutgoingTransferDestinationRequests.length} destinations....`,
          level: "success",
        },
        prependMessage: false,
      });
    }

    while (inflightCount > 10) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Waiting for ${inflightCount} requests to finish....`,
          level: "success",
        },
        prependMessage: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await Promise.allSettled(richOutgoingTransferDestinationRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Loaded ${richOutgoingTransferDestinationRequests.length} destinations`,
      level: "success",
    },
    prependMessage: false,
  });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading manifest packages...", level: "success" },
  });

  const packageRequests: Promise<any>[] = [];

  // const eligibleTransfers: IIndexedRichOutgoingTransferData[] = [];
  // const wholesaleTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations || []) {
      if (transferWrapper.index.has(transfer.ManifestNumber)) {
        continue;
      }
      // const isWholesaleTransfer: boolean = destination.ShipmentTypeName.includes("Wholesale");

      // const isEligibleTransfer: boolean =
      //   destination.EstimatedDepartureDateTime > departureDateGt &&
      //   destination.EstimatedDepartureDateTime < departureDateLt;

      // if (isEligibleTransfer) {
      //   eligibleTransfers.push(transfer);
      //   if (isWholesaleTransfer) {
      //     wholesaleTransfers.push(transfer);
      //   }
      // }

      packageRequests.push(
        getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
          dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
            destinationPackages.map((pkg) =>
              transferPackageWrapper.add(simpleTransferPackageConverter(transfer, destination, pkg))
            );
            // destination.packages = destinationPackages;
            // destinationPackages.map((pkg) =>
            //   globalPackageMap.set(getLabel(pkg), {
            //     LicenseNumber: pkg.LicenseNumber,
            //     Id: getId(pkg),
            //     PackageState: pkg.PackageState,
            //     Label: getLabel(pkg),
            //     ItemName: getItemName(pkg),
            //     manifest: isWholesaleTransfer && isEligibleTransfer,
            //     manifestGraph: isWholesaleTransfer && isEligibleTransfer,
            //     SourcePackageLabels: pkg.SourcePackageLabels,
            //     ProductionBatchNumber: pkg.ProductionBatchNumber,
            //     parentPackageLabels: null,
            //     childPackageLabelQuantityPairs: null,
            //     childLabels: [],
            //     fractionalCostData: [],
            //     errors: [],
            //   })
            // );
          })
        )
      );

      transferPackageWrapper.flushCounter();

      if (packageRequests.length % 50 === 0) {
        await Promise.allSettled(packageRequests);

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: {
            text: `Loaded ${packageRequests.length} manifests....`,
            level: "success",
          },
          prependMessage: false,
        });
      }
    }
  }

  // console.log(`Total eligible transfers: ${eligibleTransfers.length}`);
  // console.log(`Total wholesale transfers: ${wholesaleTransfers.length}`);

  const packageResults = await Promise.allSettled(packageRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: `Loaded ${packageRequests.length} manifests`,
      level: "success",
    },
  });

  console.log(
    `Failed package requests: ${packageResults.filter((x) => x.status !== "fulfilled").length}`
  );

  const eligibleWholesaleTransferPackages: any[][] = [];

  const etdRowIndex = transferPackageWrapper.keys.indexOf("ETD");
  const typeIndex = transferPackageWrapper.keys.indexOf("Type");

  for (const row of transferPackageWrapper.data) {
    if (row[etdRowIndex] < departureDateGt) {
      continue;
    }

    if (row[etdRowIndex] > departureDateLt) {
      continue;
    }

    if (!row[typeIndex].includes("Wholesale")) {
      continue;
    }

    eligibleWholesaleTransferPackages.push(row);
  }

  await createDebugSheetOrError({
    spreadsheetName: "Manifest Packages",
    sheetTitles: ["Manifest Pkgs"],
    sheetDataMatrixes: [eligibleWholesaleTransferPackages],
  });

  const eligibleWholesaleTransferPackageWrapper =
    new CompressedDataWrapper<ISimpleTransferPackageData>(
      "Eligible Wholesale Transfer Packages",
      eligibleWholesaleTransferPackages,
      transferPackageWrapper.indexedKey,
      transferPackageWrapper.keys
    );

  const stack: string[] = [...eligibleWholesaleTransferPackageWrapper].map((x) => x.Label);

  let roundCount = 0;
  const eligibleWholesaleManifestUptreeLabels = new Set<string>();

  let labelBuffer: string[] = [];

  console.log(`Eligible package count: ${stack.length}`);
  console.log(`Unique package count: ${new Set(stack).size}`);

  while (true) {
    if (stack.length === 0) {
      console.log(
        `Stack size after ${roundCount++} rounds: ${eligibleWholesaleManifestUptreeLabels.size}`
      );
      console.log(`Buffer size: ${labelBuffer.length}`);

      // Flush label buffer
      labelBuffer.map((label) => stack.push(label));
      labelBuffer = [];

      if (stack.length === 0) {
        break;
      }
    }

    const nextLabel = stack.pop()!;

    if (eligibleWholesaleManifestUptreeLabels.has(nextLabel)) {
      continue;
    }

    let parentLabels: string[] | null = null;

    // Prefer package lookup over transfer package
    const matchedPkg = packageWrapper.findOrNull(nextLabel);
    if (matchedPkg) {
      parentLabels = await getParentPackageLabels(matchedPkg);
    }

    if (!parentLabels) {
      const matchedTransferPkg = transferPackageWrapper.findOrNull(nextLabel);
      if (matchedTransferPkg) {
        parentLabels = await getParentPackageLabels(matchedTransferPkg);
      }
    }

    if (parentLabels) {
      parentLabels.map((parentLabel) => {
        if (!eligibleWholesaleManifestUptreeLabels.has(parentLabel)) {
          labelBuffer.push(parentLabel);
        }
      });
    }

    if (!parentLabels && roundCount < 2) {
      console.error(`No parent labels found for ${nextLabel} in round ${roundCount}`);
    }

    eligibleWholesaleManifestUptreeLabels.add(nextLabel);
  }

  console.log(`Touched labels: ${eligibleWholesaleManifestUptreeLabels.size}`);

  debugger;

  // console.log(
  //   `Manifest packages: ${[...globalPackageMap.values()].filter((pkg) => pkg.manifest).length}`
  // );

  // const totalTransfersWithMultiDestinations = richOutgoingTransfers
  //   .map((x) => x.outgoingDestinations!.length)
  //   .filter((x) => x > 1)
  //   .reduce((a, b) => a + b, 0);

  // ctx.commit(ReportsMutations.SET_STATUS, {
  //   statusMessage: { text: "Building package history...", level: "success" },
  // });

  // const touchedPackageTags: Set<string> = new Set();

  // const packageTagStack: string[] = [...globalPackageMap.values()]
  //   .filter((pkg) => pkg.manifest)
  //   .map((pkg) => pkg.Label);

  // console.log(`Initial package tag stack: ${packageTagStack.length}`);

  // while (packageTagStack.length > 0) {
  //   const label = packageTagStack.pop();
  //   if (!label) {
  //     throw new Error("Couldn't pop next package tag");
  //   }

  //   touchedPackageTags.add(label);

  //   const pkg = globalPackageMap.get(label);

  //   if (!pkg) {
  //     //console.error(`Couldn't match tag to package: ${label}`);
  //     continue;
  //   }

  //   globalPackageMap.set(pkg.Label, {
  //     ...pkg,
  //     manifestGraph: true,
  //   });

  //   const parentPackageLabels = await getParentPackageLabelsDeprecated(pkg);

  //   // Overwrite source package labels with full list
  //   if (pkg.SourcePackageLabels.endsWith("...")) {
  //     pkg.SourcePackageLabels = parentPackageLabels.join(", ");
  //   }

  //   parentPackageLabels
  //     .filter((x) => x.length > 0)
  //     .filter((x) => !touchedPackageTags.has(x))
  //     .map((x) => packageTagStack.push(x));
  // }

  // At this point, we're done with all packages that are not in the manifest graph.
  // Remove them
  // const globalPackageMapCount = globalPackageMap.size;
  // [...globalPackageMap.keys()].map((packageTag) => {
  //   const pkg = globalPackageMap.get(packageTag);

  //   if (!pkg!.manifestGraph) {
  //     globalPackageMap.delete(packageTag);
  //   }
  // });

  // Create a new identifier that is just a reference
  // const manifestGraphPackageMap = globalPackageMap;

  // Perform eager optimizations:
  // - Assess child counts
  // - Determine if a history lookup is required
  // for (const manifestGraphPackage of manifestGraphPackageMap.values()) {
  //   for (const parentPackageLabel of manifestGraphPackage.SourcePackageLabels.split(",").map((x) =>
  //     x.trim()
  //   )) {
  //     const parentPkg = manifestGraphPackageMap.get(parentPackageLabel);

  //     if (!parentPkg) {
  //       continue;
  //     }

  //     parentPkg!.childLabels.push(manifestGraphPackage.Label);
  //   }
  // }

  // for (const manifestGraphPackage of manifestGraphPackageMap.values()) {
  //   if (
  //     manifestGraphPackage.childLabels.length === 1 &&
  //     !manifestGraphPackage.SourcePackageLabels.endsWith("...")
  //   ) {
  //     const [childLabel] = manifestGraphPackage.childLabels;

  //     // Spoof the history extracts, eliminating the need for a history lookup
  //     manifestGraphPackage.parentPackageLabels = manifestGraphPackage.SourcePackageLabels.split(
  //       ","
  //     ).map((x) => x.trim());
  //     manifestGraphPackage.childPackageLabelQuantityPairs = [[childLabel, 1]];
  //   }
  // }

  // const tmpManifestGraphPackages = [...manifestGraphPackageMap.values()];

  // console.log({
  //   manifestGraph: tmpManifestGraphPackages.length,
  // });

  // const removableManifestGraphMembers = tmpManifestGraphPackages.filter(
  //   (pkg) =>
  //     !pkg.ProductionBatchNumber &&
  //     pkg.SourcePackageLabels.length === 24 &&
  //     pkg.childLabels.length === 1
  // );

  // console.log({
  //   removableManifestGraphMembers: removableManifestGraphMembers.length,
  // });

  // ctx.commit(ReportsMutations.SET_STATUS, {
  //   statusMessage: { text: "Loading package split data...", level: "success" },
  // });

  // // Load all history objects into map
  // const packageHistoryRequests: Promise<any>[] = [];

  // for (const pkg of manifestGraphPackageMap.values()) {
  //   if (pkg.parentPackageLabels) {
  //     // Already generated history data
  //     continue;
  //   }

  //   packageHistoryRequests.push(
  //     getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
  //       dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
  //         pkg.parentPackageLabels = extractParentPackageLabelsFromHistory(history);
  //         pkg.childPackageLabelQuantityPairs = extractTagQuantityPairsFromHistory(history);
  //       })
  //     )
  //   );

  //   if (packageHistoryRequests.length % 250 === 0) {
  //     await Promise.allSettled(packageHistoryRequests);
  //   }
  // }

  // const packageHistoryResults = await Promise.allSettled(packageHistoryRequests);

  // console.log(
  //   `Failed package history requests: ${
  //     packageHistoryResults.filter((x) => x.status !== "fulfilled").length
  //   }`
  // );

  // for (const pkg of manifestGraphPackageMap.values()) {
  //   if (!pkg.parentPackageLabels) {
  //     pkg.errors.push("No history");
  //     continue;
  //   }

  //   if (pkg.parentPackageLabels.length === 0) {
  //     pkg.errors.push("Extracted 0 parent package labels");
  //     continue;
  //   }

  //   const parentPackages = pkg.parentPackageLabels.map((pkg) => manifestGraphPackageMap.get(pkg));
  //   const matchedParentPackages = parentPackages.filter(
  //     (x) => x !== undefined
  //   ) as ISimpleCogsPackageData[];
  //   const unmatchedParentPackages = parentPackages.filter((x) => x === undefined);
  //   const noHistoryParentPackages = matchedParentPackages.filter((x) => !x.parentPackageLabels);
  //   const validParentPackages = matchedParentPackages.filter((x) => !!x.parentPackageLabels);

  //   if (parentPackages.length > 0 && matchedParentPackages.length === 0) {
  //     pkg.errors.push("No parents matched");
  //     // TODO this might be OK
  //   }

  //   if (unmatchedParentPackages.length > 0) {
  //     pkg.errors.push(`${unmatchedParentPackages.length}/${parentPackages.length} parents matched`);
  //   }

  //   if (noHistoryParentPackages.length > 0) {
  //     pkg.errors.push(
  //       `${noHistoryParentPackages.length}/${parentPackages.length} parent packages have no history`
  //     );
  //   }

  //   for (const parentPkg of validParentPackages) {
  //     const totalParentQuantity = parentPkg!
  //       .childPackageLabelQuantityPairs!.map(([label, quantity]) => quantity)
  //       .reduce((a, b) => a + b, 0);

  //     const matchingPackagePair = parentPkg!.childPackageLabelQuantityPairs!.find(
  //       ([label, quantity]) => label === pkg.Label
  //     );
  //     if (!matchingPackagePair) {
  //       pkg.errors.push(`No parent history pair match: ${parentPkg!.Label}`);
  //       continue;
  //     }

  //     pkg.fractionalCostData.push({
  //       parentLabel: parentPkg!.Label,
  //       totalParentQuantity,
  //       fractionalQuantity: matchingPackagePair[1] / totalParentQuantity,
  //     });
  //   }
  // }

  // const manifestGraphPackages = [...manifestGraphPackageMap.values()];

  reportData[ReportType.COGS] = {
    packages: packageWrapper,
    transferredPackages: transferPackageWrapper,
    // packages: manifestGraphPackages,
    // richOutgoingTransfers,
  };
}
