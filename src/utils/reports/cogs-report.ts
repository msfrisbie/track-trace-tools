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
import { downloadCsvFile } from "../csv";
import { getIsoDateFromOffset, todayIsodate } from "../date";
import {
  extractParentPackageLabelsFromHistory,
  extractTagQuantityPairsFromHistory,
} from "../history";
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
      (await dataLoader.activePackages()).map((pkg) => {
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
      (await dataLoader.inactivePackages()).map((pkg) => {
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

  // Load manifest packages for all transfers
  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations || []) {
      // Existing transfer means the packages are already in the archive
      if (transferWrapper.index.has(transfer.ManifestNumber)) {
        continue;
      }

      packageRequests.push(
        getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
          dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
            destinationPackages.map((pkg) =>
              transferPackageWrapper.add(simpleTransferPackageConverter(transfer, destination, pkg))
            );
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

  // Packages for the final manifest output page
  const eligibleWholesaleTransferPackageWrapper =
    new CompressedDataWrapper<ISimpleTransferPackageData>(
      "Eligible Wholesale Transfer Packages",
      [],
      transferPackageWrapper.indexedKey,
      transferPackageWrapper.keys
    );

  // Find eligible packages that should be included in this report
  for (const transferPkg of transferPackageWrapper) {
    if (transferPkg.ETD < departureDateGt) {
      continue;
    }

    if (transferPkg.ETD > departureDateLt) {
      continue;
    }

    if (!transferPkg.Type.includes("Wholesale")) {
      continue;
    }

    eligibleWholesaleTransferPackageWrapper.add(transferPkg);
  }

  const stack: string[] = [...eligibleWholesaleTransferPackageWrapper].map((x) => x.Label);

  // The "manifest tree" is all packages that are upstream of a wholesale transfer package
  const eligibleWholesaleManifestTreeLabels = new Set<string>();
  // let roundCount = 0;

  // let labelBuffer: string[] = [];

  console.log(`Eligible package count: ${stack.length}`);
  console.log(`Unique package count: ${new Set(stack).size}`);

  while (true) {
    // if (stack.length === 0) {
    //   console.log(
    //     `Stack size after ${roundCount++} rounds: ${eligibleWholesaleManifestTreeLabels.size}`
    //   );
    //   console.log(`Buffer size: ${labelBuffer.length}`);

    //   // Flush label buffer
    //   labelBuffer.map((label) => stack.push(label));
    //   labelBuffer = [];

    if (stack.length === 0) {
      break;
    }
    // }

    const nextLabel = stack.pop()!;

    // if (eligibleWholesaleManifestTreeLabels.has(nextLabel)) {
    //   continue;
    // }

    let parentLabels: string[] | null = null;

    // Package might appear in both lists,
    // Prefer package lookup over transfer package
    const matchedPkg = packageWrapper.findAndUnpackOrNull(nextLabel);
    if (matchedPkg) {
      parentLabels = await getParentPackageLabels(matchedPkg);
    }

    if (!parentLabels) {
      const matchedTransferPkg = transferPackageWrapper.findAndUnpackOrNull(nextLabel);
      if (matchedTransferPkg) {
        parentLabels = await getParentPackageLabels(matchedTransferPkg);
      }
    }

    if (parentLabels) {
      parentLabels.map((parentLabel) => {
        if (!eligibleWholesaleManifestTreeLabels.has(parentLabel)) {
          stack.push(parentLabel);
        }
      });
    }

    // Sanity check to ensure there are no orphaned packages
    // if (!parentLabels && roundCount < 2) {
    //   console.error(`No parent labels found for ${nextLabel} in round ${roundCount}`);
    // }

    eligibleWholesaleManifestTreeLabels.add(nextLabel);
  }

  console.log(`# labels in tree: ${eligibleWholesaleManifestTreeLabels.size}`);

  const treePackageWrapper = new CompressedDataWrapper<ISimplePackageData>(
    "Tree Packages",
    [],
    packageWrapper.indexedKey,
    packageWrapper.keys
  );

  for (const label of eligibleWholesaleManifestTreeLabels) {
    const pkg = packageWrapper.findAndUnpackOrNull(label);
    if (pkg) {
      treePackageWrapper.add(pkg);
    }
  }

  const packageHistoryRequests: Promise<any>[] = [];

  // Non-transfer packages need history loaded to build fractional cost data
  for (const pkg of treePackageWrapper) {
    if (pkg.childPackageLabelQuantityPairs || pkg.parentPackageLabels) {
      // History has already been parsed
      continue;
    }

    packageHistoryRequests.push(
      getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
          treePackageWrapper.update(
            pkg.Label,
            "parentPackageLabels",
            extractParentPackageLabelsFromHistory(history)
          );

          treePackageWrapper.update(
            pkg.Label,
            "childPackageLabelQuantityPairs",
            extractTagQuantityPairsFromHistory(history)
          );
        })
      )
    );

    if (packageHistoryRequests.length % 100 === 0) {
      await Promise.allSettled(packageHistoryRequests);
    }
  }

  await Promise.allSettled(packageHistoryRequests);

  const treeTransferPackageWrapper = new CompressedDataWrapper<ISimpleTransferPackageData>(
    "Tree Transfer Packages",
    [],
    transferPackageWrapper.indexedKey,
    transferPackageWrapper.keys
  );

  debugger;

  for (const label of eligibleWholesaleManifestTreeLabels) {
    const pkg = transferPackageWrapper.findAndUnpackOrNull(label);

    if (pkg) {
      if (pkg.Label === "1A4050300005C96000546890") {
        debugger;
      }
      treeTransferPackageWrapper.add(pkg);
    }
  }

  debugger;

  // Build a list of children for each package, this is used as the backup when
  // history is not available for a package
  const childMap = new Map<string, Set<string>>();

  const FRACTIONAL_COST_KEY = "fractionalCostMultiplierPairs";

  interface IMetadataSimplePackageData extends ISimpleTransferPackageData {
    fractionalCostMultiplierPairs: [string, number][] | undefined;
  }

  // Merge the two package types to prepare for fractional cost calculation
  const unifiedPackageWrapper = new CompressedDataWrapper<IMetadataSimplePackageData>(
    "Unified Wrapper",
    [],
    treeTransferPackageWrapper.indexedKey,
    [...treeTransferPackageWrapper.keys, FRACTIONAL_COST_KEY]
  );

  for (const pkg of treePackageWrapper) {
    unifiedPackageWrapper.add({
      ...pkg,
      Type: "",
      ETD: "",
      ManifestNumber: "",
      fractionalCostMultiplierPairs: undefined,
    });
  }

  for (const transferPkg of treeTransferPackageWrapper) {
    unifiedPackageWrapper.add({ ...transferPkg, fractionalCostMultiplierPairs: undefined });
  }

  for (const treePkg of unifiedPackageWrapper) {
    const parentPackageLabels = await getParentPackageLabels(treePkg);

    unifiedPackageWrapper.update(treePkg.Label, "parentPackageLabels", parentPackageLabels);

    for (const parentLabel of parentPackageLabels) {
      if (childMap.has(parentLabel)) {
        childMap.get(parentLabel)!.add(treePkg.Label);
      } else {
        childMap.set(parentLabel, new Set([treePkg.Label]));
      }
    }
  }

  let unmatchedParentCount = 0;
  let unmatchedChildLabelCount = 0;
  let unmatchedChildSetCount = 0;
  let fatalChildMismatchCount = 0;
  let usedBackupAlgorithmCount = 0;
  let successfulMatchCount = 0;
  let fullInheritanceBackupCount = 0;
  let inexactInheritanceBackupCount = 0;
  let duplicateLabelCount = 0;
  let unmatchedChildPackages: ISimplePackageData[] = [];
  let inexactInheritanceBackupLabels: string[] = [];

  // [childLabel, [parentLabel, fractionalCostMultiplier][]]
  // const labelCostFunctionPairs: Map<string, [string, number][]> = new Map();

  for (const pkg of unifiedPackageWrapper) {
    const pairs: [string, number][] = [];

    for (const parentLabel of pkg.parentPackageLabels!) {
      const parentPkg = unifiedPackageWrapper.findAndUnpackOrNull(parentLabel);

      if (!parentPkg) {
        // Parent package is not loaded. This can happend for packages that were
        // transferred into an owned facility from an unowned facility.
        ++unmatchedParentCount;
        continue;
      }

      if (parentPkg.childPackageLabelQuantityPairs) {
        // Calculate the sum of all child package material
        const total = parentPkg.childPackageLabelQuantityPairs.reduce((a, b) => a + b[1], 0);

        const matchingPair = parentPkg.childPackageLabelQuantityPairs.find(
          (x) => x[0] === pkg.Label
        );

        if (!matchingPair) {
          // Child package indicated it came from a parent, but the parent's
          // contribution to the child could not be extracted. TODO investigate
          unmatchedChildLabelCount++;
          unmatchedChildPackages.push(pkg);
          continue;
        }

        ++successfulMatchCount;

        pairs.push([parentPkg.Label, matchingPair[1] / total]);
      } else {
        // Packages that have left the facilitty have no history. If they are a parent package,
        // the a fallback calculation is needed to estimate fractional cost.
        ++usedBackupAlgorithmCount;
        const childLabels = childMap.get(parentPkg.Label);

        if (!childLabels) {
          ++unmatchedChildSetCount;
          continue;
        } else {
          if (!childLabels.has(pkg.Label)) {
            fatalChildMismatchCount++;
            continue;
          }

          if (childLabels.size === 1) {
            // 100% goes to the child. Accuracy is preserved.
            ++fullInheritanceBackupCount;
            pairs.push([parentLabel, 1]);
          } else {
            // This will be inexact.
            ++inexactInheritanceBackupCount;
            inexactInheritanceBackupLabels.push(parentLabel);
            pairs.push([parentLabel, 1 / childLabels.size]);
          }
        }
      }
    }

    unifiedPackageWrapper.update(pkg.Label, FRACTIONAL_COST_KEY, pairs);
  }

  console.log({
    unmatchedParentCount,
    unmatchedChildLabelCount,
    unmatchedChildSetCount,
    fatalChildMismatchCount,
    usedBackupAlgorithmCount,
    successfulMatchCount,
    duplicateLabelCount,
    fullInheritanceBackupCount,
    inexactInheritanceBackupLabels,
    inexactInheritanceBackupCount,
    unmatchedChildPackages,
  });

  const sheetMatrix: any[][] = [
    ["Label", "PB #", "Manifest", "# Parents", "# Children", "PB Cost", "Computed Cost"],
  ];

  // off-by-one index plus header row
  const OFFSET = 2;

  for (const [idx, pkg] of [...unifiedPackageWrapper].entries()) {
    if (!pkg.fractionalCostMultiplierPairs) {
      console.error(`Empty fractional pairs: ${pkg}`);
    }

    const expr: string = pkg
      .fractionalCostMultiplierPairs!.map(([parentLabel, multiplier]) => {
        return `(G${unifiedPackageWrapper.index.get(parentLabel)! + OFFSET} * ${multiplier})`;
      })
      .join("+");

    sheetMatrix.push([
      pkg.Label,
      pkg.ProductionBatchNumber,
      pkg.ManifestNumber,
      pkg.parentPackageLabels?.length || 0,
      childMap.get(pkg.Label)?.size || 0,
      ``,
      `=F${idx + OFFSET}+(${expr || 0})`,
    ]);
  }

  await downloadCsvFile({
    csvFile: {
      filename: "Cost",
      data: sheetMatrix,
    },
  });

  await createDebugSheetOrError({
    spreadsheetName: "Cost Sheet",
    sheetTitles: ["Cost"],
    sheetDataMatrixes: [sheetMatrix],
  });

  debugger;

  reportData[ReportType.COGS] = {
    packages: packageWrapper,
    transferredPackages: transferPackageWrapper,
  };
}
