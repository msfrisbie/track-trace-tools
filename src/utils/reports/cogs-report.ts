import { PackageState } from "@/consts";
import {
  IIndexedRichOutgoingTransferData,
  IPackageFilter,
  IPluginState,
  ISimpleCogsPackageData,
  ITransferFilter,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { getIsoDateFromOffset, todayIsodate } from "../date";
import {
  extractParentPackageLabelsFromHistory,
  extractTagQuantityPairsFromHistory,
} from "../history";
import { getId, getItemName, getLabel, getParentPackageLabels } from "../package";

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
}: {
  reportConfig: IReportConfig;
  cogsFormFilters: ICogsReportFormFilters;
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

  const { packageFilter, transferFilter } = reportConfig[ReportType.COGS]!;

  const globalPackageMap: Map<string, ISimpleCogsPackageData> = new Map();

  let dataLoader: DataLoader | null = null;

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);

    try {
      (await dataLoader.activePackages(24 * 60 * 60 * 1000)).map((pkg) =>
        globalPackageMap.set(getLabel(pkg), {
          LicenseNumber: pkg.LicenseNumber,
          Id: getId(pkg),
          PackageState: pkg.PackageState,
          Label: getLabel(pkg),
          ItemName: getItemName(pkg),
          manifest: false,
          manifestGraph: false,
          SourcePackageLabels: pkg.SourcePackageLabels,
          ProductionBatchNumber: pkg.ProductionBatchNumber,
          childLabels: [],
          fractionalCostData: [],
          errors: [],
        })
      );
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load active packages. (${license})`, level: "warning" },
      });
    }

    try {
      (await dataLoader.inactivePackages(24 * 60 * 60 * 1000)).map((pkg) =>
        globalPackageMap.set(getLabel(pkg), {
          LicenseNumber: pkg.LicenseNumber,
          Id: getId(pkg),
          PackageState: pkg.PackageState,
          Label: getLabel(pkg),
          ItemName: getItemName(pkg),
          manifest: false,
          manifestGraph: false,
          SourcePackageLabels: pkg.SourcePackageLabels,
          ProductionBatchNumber: pkg.ProductionBatchNumber,
          childLabels: [],
          fractionalCostData: [],
          errors: [],
        })
      );
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load inactive packages. (${license})`, level: "warning" },
      });
    }

    try {
      (await dataLoader.inTransitPackages()).map((pkg) =>
        globalPackageMap.set(getLabel(pkg), {
          LicenseNumber: pkg.LicenseNumber,
          Id: getId(pkg),
          PackageState: pkg.PackageState,
          Label: getLabel(pkg),
          ItemName: getItemName(pkg),
          manifest: false,
          manifestGraph: false,
          SourcePackageLabels: pkg.SourcePackageLabels,
          ProductionBatchNumber: pkg.ProductionBatchNumber,
          childLabels: [],
          fractionalCostData: [],
          errors: [],
        })
      );
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: {
          text: `Failed to load in transit packages. (${license})`,
          level: "warning",
        },
      });
    }
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

  // console.log(`Transfers before loose filter: ${richOutgoingTransfers.length}`);

  // richOutgoingTransfers = richOutgoingTransfers.filter((richOutgoingTransfer) => {
  //   if (richOutgoingTransfer.CreatedDateTime > departureDateLt!) {
  //     return false;
  //   }

  //   if (richOutgoingTransfer.LastModified < departureDateGt!) {
  //     return false;
  //   }
  //   return true;
  // });

  // console.log(`Transfers after loose filter: ${richOutgoingTransfers.length}`);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading destinations....", level: "success" },
  });

  let inflightCount = 0;

  const richOutgoingTransferDestinationRequests: Promise<any>[] = [];

  for (const transfer of richOutgoingTransfers) {
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

  const destinationResults = await Promise.allSettled(richOutgoingTransferDestinationRequests);

  debugger;

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

  const eligibleTransfers: IIndexedRichOutgoingTransferData[] = [];
  const wholesaleTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations || []) {
      const isWholesaleTransfer: boolean = destination.ShipmentTypeName.includes("Wholesale");

      const isEligibleTransfer: boolean =
        destination.EstimatedDepartureDateTime > departureDateGt &&
        destination.EstimatedDepartureDateTime < departureDateLt;

      if (isEligibleTransfer) {
        eligibleTransfers.push(transfer);
        if (isWholesaleTransfer) {
          wholesaleTransfers.push(transfer);
        }
      }

      packageRequests.push(
        getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
          dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
            destination.packages = destinationPackages;

            destinationPackages.map((pkg) =>
              globalPackageMap.set(getLabel(pkg), {
                LicenseNumber: pkg.LicenseNumber,
                Id: getId(pkg),
                PackageState: pkg.PackageState,
                Label: getLabel(pkg),
                ItemName: getItemName(pkg),
                manifest: isWholesaleTransfer && isEligibleTransfer,
                manifestGraph: isWholesaleTransfer && isEligibleTransfer,
                SourcePackageLabels: pkg.SourcePackageLabels,
                ProductionBatchNumber: pkg.ProductionBatchNumber,
                childLabels: [],
                fractionalCostData: [],
                errors: [],
              })
            );
          })
        )
      );

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

  debugger;

  console.log(
    `Failed package requests: ${packageResults.filter((x) => x.status !== "fulfilled").length}`
  );

  console.log(
    `Manifest packages: ${[...globalPackageMap.values()].filter((pkg) => pkg.manifest).length}`
  );

  const totalTransfersWithMultiDestinations = richOutgoingTransfers
    .map((x) => x.outgoingDestinations!.length)
    .filter((x) => x > 1)
    .reduce((a, b) => a + b, 0);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Building package history...", level: "success" },
  });

  const touchedPackageTags: Set<string> = new Set();

  const packageTagStack: string[] = [...globalPackageMap.values()]
    .filter((pkg) => pkg.manifest)
    .map((pkg) => pkg.Label);

  console.log(`Initial package tag stack: ${packageTagStack.length}`);

  while (packageTagStack.length > 0) {
    const label = packageTagStack.pop();
    if (!label) {
      throw new Error("Couldn't pop next package tag");
    }

    touchedPackageTags.add(label);

    const pkg = globalPackageMap.get(label);

    if (!pkg) {
      //console.error(`Couldn't match tag to package: ${label}`);
      continue;
    }

    globalPackageMap.set(pkg.Label, {
      ...pkg,
      manifestGraph: true,
    });

    const parentPackageLabels = await getParentPackageLabels(pkg);

    // Overwrite source package labels with full list
    if (pkg.SourcePackageLabels.endsWith("...")) {
      pkg.SourcePackageLabels = parentPackageLabels.join(", ");
    }

    parentPackageLabels
      .filter((x) => x.length > 0)
      .filter((x) => !touchedPackageTags.has(x))
      .map((x) => packageTagStack.push(x));
  }

  // At this point, we're done with all packages that are not in the manifest graph.
  // Remove them
  const globalPackageMapCount = globalPackageMap.size;
  [...globalPackageMap.keys()].map((packageTag) => {
    const pkg = globalPackageMap.get(packageTag);

    if (!pkg!.manifestGraph) {
      globalPackageMap.delete(packageTag);
    }
  });

  // Create a new identifier that is just a reference
  const manifestGraphPackageMap = globalPackageMap;

  // Perform eager optimizations:
  // - Assess child counts
  // - Determine if a history lookup is required
  for (const manifestGraphPackage of manifestGraphPackageMap.values()) {
    for (const parentPackageLabel of manifestGraphPackage.SourcePackageLabels.split(",").map((x) =>
      x.trim()
    )) {
      const parentPkg = manifestGraphPackageMap.get(parentPackageLabel);

      if (!parentPkg) {
        continue;
      }

      parentPkg!.childLabels.push(manifestGraphPackage.Label);
    }
  }

  for (const manifestGraphPackage of manifestGraphPackageMap.values()) {
    if (
      manifestGraphPackage.childLabels.length === 1 &&
      !manifestGraphPackage.SourcePackageLabels.endsWith("...")
    ) {
      const [childLabel] = manifestGraphPackage.childLabels;

      // Spoof the history extracts, eliminating the need for a history lookup
      manifestGraphPackage.historyExtracts = {
        parentPackageLabels: manifestGraphPackage.SourcePackageLabels.split(",").map((x) =>
          x.trim()
        ),
        tagQuantityPairs: [{ tag: childLabel, quantity: 1 }],
      };
    }
  }

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

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading package split data...", level: "success" },
  });

  // Load all history objects into map
  const packageHistoryRequests: Promise<any>[] = [];

  for (const pkg of manifestGraphPackageMap.values()) {
    if (pkg.historyExtracts) {
      // Already generated history data
      continue;
    }

    packageHistoryRequests.push(
      getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
          pkg.historyExtracts = {
            parentPackageLabels: extractParentPackageLabelsFromHistory(history),
            tagQuantityPairs: extractTagQuantityPairsFromHistory(history),
          };
        })
      )
    );

    if (packageHistoryRequests.length % 250 === 0) {
      await Promise.allSettled(packageHistoryRequests);
    }
  }

  const packageHistoryResults = await Promise.allSettled(packageHistoryRequests);

  console.log(
    `Failed package history requests: ${
      packageHistoryResults.filter((x) => x.status !== "fulfilled").length
    }`
  );

  for (const pkg of manifestGraphPackageMap.values()) {
    if (!pkg.historyExtracts) {
      pkg.errors.push("No history");
      continue;
    }

    if (pkg.historyExtracts.parentPackageLabels.length === 0) {
      pkg.errors.push("Extracted 0 parent package labels");
      continue;
    }

    const parentPackages = pkg.historyExtracts.parentPackageLabels.map((pkg) =>
      manifestGraphPackageMap.get(pkg)
    );
    const matchedParentPackages = parentPackages.filter(
      (x) => x !== undefined
    ) as ISimpleCogsPackageData[];
    const unmatchedParentPackages = parentPackages.filter((x) => x === undefined);
    const noHistoryParentPackages = matchedParentPackages.filter((x) => !x.historyExtracts);
    const validParentPackages = matchedParentPackages.filter((x) => !!x.historyExtracts);

    if (parentPackages.length > 0 && matchedParentPackages.length === 0) {
      pkg.errors.push("No parents matched");
      // TODO this might be OK
    }

    if (unmatchedParentPackages.length > 0) {
      pkg.errors.push(`${unmatchedParentPackages.length}/${parentPackages.length} parents matched`);
    }

    if (noHistoryParentPackages.length > 0) {
      pkg.errors.push(
        `${noHistoryParentPackages.length}/${parentPackages.length} parent packages have no history`
      );
    }

    for (const parentPkg of validParentPackages) {
      const totalParentQuantity = parentPkg!
        .historyExtracts!.tagQuantityPairs.map((x) => x.quantity)
        .reduce((a, b) => a + b, 0);

      const matchingPackagePair = parentPkg!.historyExtracts!.tagQuantityPairs.find(
        (x) => x.tag === pkg.Label
      );
      if (!matchingPackagePair) {
        pkg.errors.push(`No parent history pair match: ${parentPkg!.Label}`);
        continue;
      }

      pkg.fractionalCostData.push({
        parentLabel: parentPkg!.Label,
        totalParentQuantity,
        fractionalQuantity: matchingPackagePair.quantity / totalParentQuantity,
      });
    }
  }

  const manifestGraphPackages = [...manifestGraphPackageMap.values()];

  reportData[ReportType.COGS] = {
    packages: manifestGraphPackages,
    richOutgoingTransfers,
    auditData: [
      {
        text: "Eligible Date Range",
        value: `${transferFilter.estimatedDepartureDateGt}  -  ${transferFilter.estimatedDepartureDateLt}`,
      },
      {
        text: "Total Eligible Transfers (All Transfer Types)",
        value: eligibleTransfers.length,
      },
      {
        text: "Total Eligible Transfers (Wholesale Only)",
        value: wholesaleTransfers.length,
      },
      {
        text: "Total Eligible Multi-Destionation Transfers",
        value: totalTransfersWithMultiDestinations,
      },
      {
        text: "Total Eligible Manifest Packages (All Transfer Types)",
        value: [...manifestGraphPackageMap.values()].filter((pkg) => {
          return (
            pkg.PackageState === PackageState.DEPARTED_FACILITY ||
            pkg.PackageState === PackageState.IN_TRANSIT
          );
        }).length,
      },
      {
        text: "Total Eligible Manifest Packages (Wholesale Only)",
        value: manifestGraphPackages.filter((pkg) => pkg.manifest).length,
      },
      {
        text: "Total Packages in History Graph",
        value: manifestGraphPackages.length,
      },
      {
        text: "Total Production Batch Packages",
        value: manifestGraphPackages.filter((pkg) => !!pkg.ProductionBatchNumber).length,
      },
      {
        text: "Total Packages in Dataset",
        value: globalPackageMapCount,
      },
      {
        text: "Transfer License Set",
        value: (() => {
          const allTransferLicenses = eligibleTransfers.map((x) => x.LicenseNumber);
          const uniqueTransferLicenses = new Set(allTransferLicenses);
          return [...uniqueTransferLicenses].join(", ");
        })(),
      },
      {
        text: "Package License Set",
        value: (() => {
          const allPackageLicenses = [...manifestGraphPackageMap.values()].map(
            (x) => x.LicenseNumber
          );
          const uniqueLicenses = new Set(allPackageLicenses);
          return [...uniqueLicenses].join(", ");
        })(),
      },
    ],
  };
}
