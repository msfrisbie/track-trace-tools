import {
  IIndexedDestinationPackageData,
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  IPackageFilter,
  IPluginState,
  ITransferFilter,
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
import { extractTagQuantityPairsFromHistory } from "../history";
import { getId, getLabel } from "../package";

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
    throw new Error("Bad config");
  }

  const { packageFilter, transferFilter } = reportConfig[ReportType.COGS] as {
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
  };

  ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading packages..." });

  let packages: IIndexedPackageData[] = [];

  let dataLoader: DataLoader | null = null;

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    dataLoader = await getDataLoaderByLicense(license);

    try {
      packages = [...packages, ...(await dataLoader.activePackages())];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: `Failed to load active packages. (${license})`,
      });
    }

    try {
      packages = [...packages, ...(await dataLoader.inactivePackages())];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: `Failed to load inactive packages. (${license})`,
      });
    }
  }

  const globalPackageMap: Map<string, IIndexedPackageData | IIndexedDestinationPackageData> =
    new Map(packages.map((pkg) => [pkg.Label, pkg]));

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  for (const license of await (
    await facilityManager.ownedFacilitiesOrError()
  ).map((x) => x.licenseNumber)) {
    dataLoader = await getDataLoaderByLicense(license);
    try {
      richOutgoingTransfers = [...richOutgoingTransfers, ...(await dataLoader.outgoingTransfers())];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: "Failed to load outgoing transfers.",
      });
    }

    try {
      richOutgoingTransfers = [
        ...richOutgoingTransfers,
        ...(await dataLoader.outgoingInactiveTransfers()),
      ];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: "Failed to load outgoing inactive transfers.",
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

  const departureDateBufferGt = (transferFilter.estimatedDepartureDateGt as string).split("T")[0];
  const departureDateBufferLt = getIsoDateFromOffset(
    1,
    transferFilter.estimatedDepartureDateLt as string
  ).split("T")[0];

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
    statusMessage: "Loading destinations....",
  });

  const richOutgoingTransferDestinationRequests: Promise<any>[] = [];

  richOutgoingTransfers.map((transfer) =>
    richOutgoingTransferDestinationRequests.push(
      getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
        dataLoader.transferDestinations(transfer.Id).then((destinations) => {
          transfer.outgoingDestinations = destinations
            .map((x) => ({ ...x, packages: [] }))
            .filter((destination) => {
              if (!destination.ShipmentTypeName.includes("Wholesale")) {
                return false;
              }

              if (destination.EstimatedDepartureDateTime < departureDateBufferGt) {
                return false;
              }

              if (destination.EstimatedDepartureDateTime > departureDateBufferLt) {
                return false;
              }

              return true;
            });
        })
      )
    )
  );

  await Promise.allSettled(richOutgoingTransferDestinationRequests);

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: "Loading manifest packages...",
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

  for (const transfer of richOutgoingTransfers) {
    for (const destination of transfer.outgoingDestinations ?? []) {
      for (const pkg of destination.packages ?? []) {
        manifestPackages.push(pkg);
      }
    }
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: "Building package history...",
  });

  // Also add manifest packages to global pkg map
  manifestPackages.map((pkg) => globalPackageMap.set(pkg.PackageLabel, pkg));

  // Mark all packages that need to have history loaded
  // Initialize to manifest packages
  const historyTreeMap = new Map<string, IIndexedPackageData | IIndexedDestinationPackageData>(
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

    // if (historyTreeMap.has(label)) {
    //   continue;
    // }

    const pkg = globalPackageMap.get(label);

    if (!pkg) {
      // TODO this might be OK
      //   console.error(`Couldn't match tag to package: ${label}`);
      continue;
    }

    historyTreeMap.set(label, pkg);

    pkg.SourcePackageLabels.split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .filter((x) => !touchedPackageTags.has(x))
      .map((x) => packageTagStack.push(x));
  }

  console.log({ historyTreeMap });

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: "Loading package split data...",
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

  const packageCostCalculationData: IPackageCostCalculationData[] = [];

  const pkgStack: (IIndexedPackageData | IIndexedDestinationPackageData)[] = [
    ...historyTreeMap.values(),
  ];
  while (pkgStack.length > 0) {
    const pkg = pkgStack.pop();

    if (!pkg) {
      throw new Error("Bad package pop");
    }

    const parentTags: string[] = pkg.SourcePackageLabels.split(",").map((x) => x.trim());

    const sourceCostData: { parentTag: string; costFractionMultiplier: number }[] = [];

    for (const parentTag of parentTags) {
      const parentPkg = historyTreeMap.get(parentTag);

      if (!parentPkg) {
        console.log(`Couldn't look up package: ${parentTag}`);
        continue;
      }

      if (!parentPkg.history || parentPkg.history.length === 0) {
        console.log("Parent pkg does not have a history loaded");
        continue;
      }

      pkgStack.push(parentPkg);

      const tagQuantityPairs = extractTagQuantityPairsFromHistory(parentPkg.history);

      const totalParentQuantity = tagQuantityPairs
        .map((x) => x.quantity)
        .reduce((a, b) => a + b, 0);

      const currentPackagePair = tagQuantityPairs.find((x) => x.tag === getLabel(pkg));
      if (!currentPackagePair) {
        throw new Error("Could not match a tag when pairing quantities");
      }

      sourceCostData.push({
        parentTag,
        costFractionMultiplier: currentPackagePair.quantity / totalParentQuantity,
      });
    }

    packageCostCalculationData.push({
      tag: getLabel(pkg),
      sourceCostData,
    });
  }

  reportData[ReportType.COGS] = {
    packages: [...historyTreeMap.values()],
    packageCostCalculationData,
    richOutgoingTransfers,
  };

  console.log(reportData);
}
