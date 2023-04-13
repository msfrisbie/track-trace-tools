import {
  IIndexedDestinationPackageData,
  IIndexedRichOutgoingTransferData,
  IPackageFilter,
  IPluginState,
  ITransferFilter,
  IUnionIndexedPackageData,
  IUnionRichIndexedPackageData,
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
import { getId, getLabel, getParentPackageLabels } from "../package";

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

  let packages: IUnionIndexedPackageData[] = [];

  let dataLoader: DataLoader | null = null;

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} packages...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);

    try {
      packages = [...packages, ...(await dataLoader.activePackages(24 * 60 * 60 * 1000))];
    } catch (e) {
      console.log(e);
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load active packages. (${license})`, level: "warning" },
      });
    }

    try {
      packages = [...packages, ...(await dataLoader.inactivePackages(24 * 60 * 60 * 1000))];
    } catch (e) {
      console.log(e);
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Failed to load inactive packages. (${license})`, level: "warning" },
      });
    }
  }

  const globalPackageMap: Map<string, IUnionIndexedPackageData> = new Map(
    packages.map((pkg) => [getLabel(pkg), pkg])
  );

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading ${license} transfers...`, level: "success" },
    });

    dataLoader = await getDataLoaderByLicense(license);
    try {
      richOutgoingTransfers = [...richOutgoingTransfers, ...(await dataLoader.outgoingTransfers())];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load outgoing transfers.", level: "warning" },
      });
    }

    try {
      richOutgoingTransfers = [
        ...richOutgoingTransfers,
        ...(await dataLoader.outgoingInactiveTransfers()),
      ];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load outgoing inactive transfers.", level: "warning" },
      });
    }
  }

  // Assumption: a transfer will not sit around for 90 days
  const createdDateBufferGt = getIsoDateFromOffset(-90, transferFilter.estimatedDepartureDateGt!);
  const createdDateBufferLt = getIsoDateFromOffset(90, transferFilter.estimatedDepartureDateLt!);

  const [departureDateBufferGt] = transferFilter.estimatedDepartureDateGt!.split("T");
  const [departureDateBufferLt] = getIsoDateFromOffset(
    1,
    transferFilter.estimatedDepartureDateLt!
  ).split("T");

  richOutgoingTransfers = richOutgoingTransfers.filter((richOutgoingTransfer) => {
    if (richOutgoingTransfer.CreatedDateTime < createdDateBufferGt) {
      return false;
    }

    if (richOutgoingTransfer.CreatedDateTime > createdDateBufferLt) {
      return false;
    }
    return true;
  });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading destinations....", level: "success" },
  });

  const richOutgoingTransferDestinationRequests: Promise<any>[] = [];

  richOutgoingTransfers.map((transfer) =>
    richOutgoingTransferDestinationRequests.push(
      getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
        dataLoader.transferDestinations(transfer.Id).then((destinations) => {
          transfer.outgoingDestinations = destinations.map((x) => ({ ...x, packages: [] }));
        })
      )
    )
  );

  await Promise.allSettled(richOutgoingTransferDestinationRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading manifest packages...", level: "success" },
  });

  const packageRequests: Promise<any>[] = [];

  richOutgoingTransfers.map((transfer) =>
    transfer.outgoingDestinations?.map((destination) =>
      packageRequests.push(
        getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
          dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
            destination.packages = destinationPackages;
            packages = [...packages, ...destinationPackages];
          })
        )
      )
    )
  );

  const totalTransfersWithMultiDestinations = richOutgoingTransfers
    .map((x) => x.outgoingDestinations!.length)
    .filter((x) => x > 1)
    .reduce((a, b) => a + b, 0);

  await Promise.allSettled(packageRequests);

  // Register all outgoing manifest packages
  const manifestPackages: IIndexedDestinationPackageData[] = [];
  const allTransferredPackages: IIndexedDestinationPackageData[] = [];
  const allTransfers: IIndexedRichOutgoingTransferData[] = [];
  const wholesaleTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations ?? []) {
      const isWholesaleTransfer: boolean = destination.ShipmentTypeName.includes("Wholesale");

      const isEligibleTransfer: boolean =
        destination.EstimatedDepartureDateTime > departureDateBufferGt &&
        destination.EstimatedDepartureDateTime < departureDateBufferLt;

      if (isEligibleTransfer) {
        allTransfers.push(transfer);
      }

      if (!wholesaleTransfers.includes(transfer)) {
        wholesaleTransfers.push(transfer);
      }

      for (const pkg of destination.packages ?? []) {
        allTransferredPackages.push(pkg);
        if (isEligibleTransfer && isWholesaleTransfer) {
          manifestPackages.push(pkg);
        }
      }
    }
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Building package history...", level: "success" },
  });

  // Also add manifest packages to global pkg map
  allTransferredPackages.map((pkg) => globalPackageMap.set(pkg.PackageLabel, pkg));

  // Mark all packages that need to have history loaded
  // Initialize to contain manifest packages
  const historyTreeMap = new Map<string, IUnionRichIndexedPackageData>(
    manifestPackages.map((pkg) => [pkg.PackageLabel, pkg])
  );

  const touchedPackageTags: Set<string> = new Set();

  const packageTagStack: string[] = [...manifestPackages].map((pkg) => pkg.PackageLabel);

  console.log(`Initial package tag stack: ${packageTagStack.length}`);

  while (packageTagStack.length > 0) {
    const label = packageTagStack.pop();
    if (!label) {
      throw new Error("Couldn't pop next package tag");
    }

    touchedPackageTags.add(label);

    const pkg = globalPackageMap.get(label);

    if (!pkg) {
      console.error(`Couldn't match tag to package: ${label}`);
      continue;
    }

    historyTreeMap.set(label, pkg);

    (await getParentPackageLabels(pkg))
      .filter((x) => x.length > 0)
      .filter((x) => !touchedPackageTags.has(x))
      .map((x) => packageTagStack.push(x));
  }

  console.log({ historyTreeMap });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading package split data...", level: "success" },
  });

  // Load all history objects into map
  const packageHistoryRequests: Promise<any>[] = [];

  let counter = 0;
  for (const pkg of historyTreeMap.values()) {
    packageHistoryRequests.push(
      getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(getId(pkg)).then((history) => {
          pkg.history = history;
        })
      )
    );

    if (counter++ > 250) {
      await Promise.allSettled(packageHistoryRequests);
      counter = 0;
    }
  }

  await Promise.allSettled(packageHistoryRequests);

  // for (const [label, pkg] of historyTreeMap.entries()) {
  //   if (!pkg.history || !pkg.history.length) {
  //     console.error(`${label} has no history, stripping out`);

  //     historyTreeMap.delete(label);
  //   }
  // }

  // At this point, all packages in map should have history

  // Validate that all packages have parents that are either
  // - All missing from the history tree
  // - All present in the history tree
  // for (const [label, pkg] of historyTreeMap.entries()) {
  //   const parentLabels = extractParentPackageLabelsFromHistory(pkg.history!);

  //   const missing = parentLabels.filter((x) => !historyTreeMap.has(x));
  //   const included = parentLabels.filter((x) => historyTreeMap.has(x));

  //   if (missing.length === 0 && included.length === 0) {
  //     console.error(`${label} has both counts === 0`);
  //   }

  //   if (missing.length > 0 && included.length > 0) {
  //     console.error(`${label} has both counts > 0`);
  //     console.log(pkg.SourcePackageLabels);
  //     console.groupCollapsed("missing");
  //     missing.map(console.log);
  //     console.groupEnd();
  //     console.groupCollapsed("included");
  //     included.map(console.log);
  //     console.groupEnd();
  //   }
  // }

  for (const [label, pkg] of historyTreeMap.entries()) {
    pkg.errors = [];
    pkg.fractionalCostData = [];

    if (!pkg.history) {
      pkg.errors.push("No history");
      continue;
    }

    const parentPackageLabels = extractParentPackageLabelsFromHistory(pkg.history!);

    if (!parentPackageLabels.length) {
      pkg.errors.push("Extracted 0 parent package labels");
      continue;
    }

    const parentPackages = parentPackageLabels.map((pkg) => historyTreeMap.get(pkg));
    const matchedParentPackages = parentPackages.filter((x) => x !== undefined);
    const unmatchedParentPackages = parentPackages.filter((x) => x === undefined);
    const noHistoryParentPackages = matchedParentPackages.filter((x) => !pkg.history);

    if (matchedParentPackages.length === 0) {
      pkg.errors.push("No parents matched");
      // TODO this might be OK
      continue;
    }

    if (unmatchedParentPackages.length > 0) {
      pkg.errors.push(`${unmatchedParentPackages.length}/${parentPackages.length} parents matched`);
      continue;
    }

    if (noHistoryParentPackages.length > 0) {
      pkg.errors.push(
        `${noHistoryParentPackages.length}/${parentPackages.length} parent packages have no history`
      );
      continue;
    }

    for (const parentPkg of matchedParentPackages) {
      const tagQuantityPairs = extractTagQuantityPairsFromHistory(parentPkg!.history!);

      const totalParentQuantity = tagQuantityPairs
        .map((x) => x.quantity)
        .reduce((a, b) => a + b, 0);

      const matchingPackagePair = tagQuantityPairs.find((x) => x.tag === label);
      if (!matchingPackagePair) {
        pkg.errors.push(`No parent history match: ${getLabel(parentPkg!)}`);
        continue;
      }

      pkg.fractionalCostData.push({
        parentLabel: getLabel(parentPkg!),
        totalParentQuantity,
        fractionalQuantity: matchingPackagePair.quantity / totalParentQuantity,
      });

      // sourceCostData.push({
      //   parentTag,
      //   costFractionMultiplier: matchingPackagePair.quantity / totalParentQuantity,
      // });
    }
  }

  // const packageCostCalculationData: IPackageCostCalculationData[] = [];

  //   const pkgStack: (IUnionIndexedPackageData)[] = [
  //     ...historyTreeMap.values(),
  //   ];
  // TODO shouldnt the history tree just be iterated?
  //   while (pkgStack.length > 0) {
  //     const pkg = pkgStack.pop();
  // for (const [label, pkg] of historyTreeMap.entries()) {
  //   // if (!pkg) {
  //   //   throw new Error("Bad package pop");
  //   // }

  //   const sourceCostData: { parentTag: string; costFractionMultiplier: number }[] = [];
  //   const errors: string[] = [];

  //   for (const parentTag of extractParentPackageLabelsFromHistory(pkg.history!)) {
  //     const parentPkg = historyTreeMap.get(parentTag);

  //     if (!parentPkg) {
  //       //console.log(`Couldn't look up package: ${parentTag}`);
  //       continue;
  //     }

  //     if (!parentPkg.history || parentPkg.history.length === 0) {
  //       throw new Error("FATAL: Parent pkg does not have a history loaded");
  //       // continue;
  //     }

  //     //   pkgStack.push(parentPkg);

  //     const tagQuantityPairs = extractTagQuantityPairsFromHistory(parentPkg.history);

  //     const totalParentQuantity = tagQuantityPairs
  //       .map((x) => x.quantity)
  //       .reduce((a, b) => a + b, 0);

  //     const matchingPackagePair = tagQuantityPairs.find((x) => x.tag === label);
  //     if (!matchingPackagePair) {
  //       errors.push(
  //         `Could not match a tag when pairing quantities: label:${label}, parent: ${parentTag}, pairLen: ${tagQuantityPairs.length}`
  //       );
  //       console.error({ tagQuantityPairs, label, parentPkg });
  //       continue;
  //       // throw new Error("Could not match a tag when pairing quantities");
  //     }

  //     sourceCostData.push({
  //       parentTag,
  //       costFractionMultiplier: matchingPackagePair.quantity / totalParentQuantity,
  //     });
  //   }

  //   if (sourceCostData.length > 0) {
  //     packageCostCalculationData.push({
  //       tag: label,
  //       sourceCostData,
  //       errors,
  //     });
  //   }
  // }

  reportData[ReportType.COGS] = {
    packages: [...historyTreeMap.values()],
    // packageCostCalculationData,
    richOutgoingTransfers,
    auditData: [
      {
        text: "Eligible Date Range",
        value: `${transferFilter.estimatedDepartureDateGt}  -  ${transferFilter.estimatedDepartureDateLt}`,
      },
      {
        text: "Total Eligible Transfers (All Transfer Types)",
        value: allTransfers.length,
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
        value: allTransferredPackages.length,
      },
      {
        text: "Total Eligible Manifest Packages (Wholesale Only)",
        value: manifestPackages.length,
      },
      {
        text: "Total Packages in History Graph",
        value: historyTreeMap.size,
      },
      {
        text: "Total Production Batch Packages",
        value: [...historyTreeMap.values()].filter((pkg) => !!pkg.ProductionBatchNumber).length,
      },
      {
        text: "Total Packages in Dataset",
        value: globalPackageMap.size,
      },
      {
        text: "Transfer License Set",
        value: (() => {
          const allTransferLicenses = allTransfers.map((x) => x.LicenseNumber);
          console.log({ allTransferLicenses });
          const uniqueTransferLicenses = new Set(allTransferLicenses);
          console.log({ uniqueTransferLicenses });
          return [...uniqueTransferLicenses].join(", ");
        })(),
      },
      {
        text: "Package License Set",
        value: (() => {
          const allPackageLicenses = [...globalPackageMap.values()].map((x) => x.LicenseNumber);
          console.log({ allPackageLicenses });
          const uniqueLicenses = new Set(allPackageLicenses);
          console.log({ uniqueLicenses });
          return [...uniqueLicenses].join(", ");
        })(),
      },
    ],
  };
}
