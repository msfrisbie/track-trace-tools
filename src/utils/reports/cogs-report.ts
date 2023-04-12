import {
  IIndexedDestinationPackageData,
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  IPackageFilter,
  IPackageHistoryData,
  IPluginState,
  ITransferFilter,
  IUnionIndexedPackageData,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IPackageCostCalculationData,
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
import { getId, getParentPackageLabels } from "../package";

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

  const { packageFilter, transferFilter } = reportConfig[ReportType.COGS] as {
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
  };

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading packages...", level: "success" },
  });

  let packages: IIndexedPackageData[] = [];

  let dataLoader: DataLoader | null = null;

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
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
    packages.map((pkg) => [pkg.Label, pkg])
  );

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading transfers...", level: "success" },
  });

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
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
  const createdDateBufferGt = getIsoDateFromOffset(
    -90,
    transferFilter.estimatedDepartureDateGt as string
  );
  const createdDateBufferLt = getIsoDateFromOffset(
    90,
    transferFilter.estimatedDepartureDateLt as string
  );

  const [departureDateBufferGt] = (transferFilter.estimatedDepartureDateGt as string).split("T");
  const [departureDateBufferLt] = getIsoDateFromOffset(
    1,
    transferFilter.estimatedDepartureDateLt as string
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
          // .filter((destination) => {
          //   return true;
          // });
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
          dataLoader.destinationPackages(destination.Id).then((packages) => {
            destination.packages = packages;
          })
        )
      )
    )
  );

  await Promise.allSettled(packageRequests);

  // Register all outgoing manifest packages
  const manifestPackages: IIndexedDestinationPackageData[] = [];
  const allTransferredPackages: IIndexedDestinationPackageData[] = [];

  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations ?? []) {
      const isEligibleWholesaleTransfer: boolean =
        destination.ShipmentTypeName.includes("Wholesale") &&
        destination.EstimatedDepartureDateTime > departureDateBufferGt &&
        destination.EstimatedDepartureDateTime < departureDateBufferLt;

      for (const pkg of destination.packages ?? []) {
        allTransferredPackages.push(pkg);
        if (isEligibleWholesaleTransfer) {
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
  const historyTreeMap = new Map<string, IUnionIndexedPackageData>(
    manifestPackages.map((pkg) => [pkg.PackageLabel, pkg])
  );

  const touchedPackageTags: Set<string> = new Set();

  const packageTagStack: string[] = [...manifestPackages].map((pkg) => pkg.PackageLabel);
  while (packageTagStack.length > 0) {
    const label = packageTagStack.pop();
    if (!label) {
      throw new Error("Couldn't pop next package tag");
    }

    touchedPackageTags.add(label);

    const pkg = globalPackageMap.get(label);

    if (!pkg) {
      //   console.error(`Couldn't match tag to package: ${label}`);
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

  for (const [label, pkg] of historyTreeMap.entries()) {
    if (!pkg.history || !pkg.history.length) {
      console.error(`${label} has no history, stripping out`);

      historyTreeMap.delete(label);
    }
  }

  // At this point, all packages in map should have history

  // Validate that all packages have parents that are either
  // - All missing from the history tree
  // - All present in the history tree
  for (const [label, pkg] of historyTreeMap.entries()) {
    const parentLabels = extractParentPackageLabelsFromHistory(
      pkg.history as IPackageHistoryData[]
    );

    const missing = parentLabels.filter((x) => !historyTreeMap.has(x));
    const included = parentLabels.filter((x) => historyTreeMap.has(x));

    if (missing.length === 0 && included.length === 0) {
      console.error(`${label} has both counts === 0`);
    }

    if (missing.length > 0 && included.length > 0) {
      console.error(`${label} has both counts > 0`);
      console.log(pkg.SourcePackageLabels);
      console.groupCollapsed("missing");
      missing.map(console.log);
      console.groupEnd();
      console.groupCollapsed("included");
      included.map(console.log);
      console.groupEnd();
    }
  }

  const packageCostCalculationData: IPackageCostCalculationData[] = [];

  //   const pkgStack: (IUnionIndexedPackageData)[] = [
  //     ...historyTreeMap.values(),
  //   ];
  // TODO shouldnt the history tree just be iterated?
  //   while (pkgStack.length > 0) {
  //     const pkg = pkgStack.pop();
  for (const [label, pkg] of historyTreeMap.entries()) {
    // if (!pkg) {
    //   throw new Error("Bad package pop");
    // }

    const sourceCostData: { parentTag: string; costFractionMultiplier: number }[] = [];
    const errors: string[] = [];

    for (const parentTag of extractParentPackageLabelsFromHistory(
      pkg.history as IPackageHistoryData[]
    )) {
      const parentPkg = historyTreeMap.get(parentTag);

      if (!parentPkg) {
        //console.log(`Couldn't look up package: ${parentTag}`);
        continue;
      }

      if (!parentPkg.history || parentPkg.history.length === 0) {
        throw new Error("FATAL: Parent pkg does not have a history loaded");
        // continue;
      }

      //   pkgStack.push(parentPkg);

      const tagQuantityPairs = extractTagQuantityPairsFromHistory(parentPkg.history);

      const totalParentQuantity = tagQuantityPairs
        .map((x) => x.quantity)
        .reduce((a, b) => a + b, 0);

      const currentPackagePair = tagQuantityPairs.find((x) => x.tag === label);
      if (!currentPackagePair) {
        errors.push(
          `Could not match a tag when pairing quantities: label:${label}, parent: ${parentTag}, pairLen: ${tagQuantityPairs.length}`
        );
        console.error({ tagQuantityPairs, label, parentPkg });
        continue;
        // throw new Error("Could not match a tag when pairing quantities");
      }

      sourceCostData.push({
        parentTag,
        costFractionMultiplier: currentPackagePair.quantity / totalParentQuantity,
      });
    }

    if (sourceCostData.length > 0) {
      packageCostCalculationData.push({
        tag: label,
        sourceCostData,
        errors,
      });
    }
  }

  reportData[ReportType.COGS] = {
    packages: [...historyTreeMap.values()],
    packageCostCalculationData,
    richOutgoingTransfers,
  };
}
