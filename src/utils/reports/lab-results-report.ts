import {
  IIndexedPackageData,
  ILicenseFormFilters,
  IPackageFilter,
  IPluginState,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";
import { extractLicenseFields, licenseFilterFactory } from "./reports-shared";

export interface ILabResultsReportFormFilters extends ILicenseFormFilters {
  packagedDateGt: string;
  packagedDateLt: string;
  shouldFilterPackagedDateGt: boolean;
  shouldFilterPackagedDateLt: boolean;
  includeActive: boolean;
  includeIntransit: boolean;
  includeInactive: boolean;
  testTypeNames: string[]
}

export const labResultsReportFormFiltersFactory: () => ILabResultsReportFormFilters = () => ({
  packagedDateGt: todayIsodate(),
  packagedDateLt: todayIsodate(),
  shouldFilterPackagedDateGt: false,
  shouldFilterPackagedDateLt: false,
  includeActive: true,
  includeIntransit: false,
  includeInactive: false,
  testTypeNames: [],
  ...licenseFilterFactory(),
});

export function addLabResultsReport({
  reportConfig,
  labResultsReportFormFilters,
}: {
  reportConfig: IReportConfig;
  labResultsReportFormFilters: ILabResultsReportFormFilters;
}) {
  const packageFilter: IPackageFilter = {};

  packageFilter.includeActive = labResultsReportFormFilters.includeActive;
  packageFilter.includeIntransit = labResultsReportFormFilters.includeIntransit;
  packageFilter.includeInactive = labResultsReportFormFilters.includeInactive;
  // packageFilter.includeTransferHub = packagesFormFilters.includeTransferHub;

  packageFilter.packagedDateGt = labResultsReportFormFilters.shouldFilterPackagedDateGt
    ? labResultsReportFormFilters.packagedDateGt
    : null;

  packageFilter.packagedDateLt = labResultsReportFormFilters.shouldFilterPackagedDateLt
    ? labResultsReportFormFilters.packagedDateLt
    : null;

  reportConfig[ReportType.LAB_RESULTS] = {
    packageFilter,
    testTypeNames: labResultsReportFormFilters.testTypeNames,
    ...extractLicenseFields(labResultsReportFormFilters),
    fields: null
  };
}

export async function maybeLoadLabResultsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const labResultsReportConfig = reportConfig[ReportType.LAB_RESULTS];

  if (labResultsReportConfig?.packageFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading packages...", level: "success" },
    });

    let packages: IIndexedPackageData[] = [];

    for (const license of labResultsReportConfig.licenses) {
      const dataLoader = await getDataLoaderByLicense(license);

      if (labResultsReportConfig.packageFilter.includeActive) {
        try {
          packages = [...packages, ...(await dataLoader.activePackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load active packages.", level: "warning" },
          });
        }
      }

      if (labResultsReportConfig.packageFilter.includeInactive) {
        try {
          packages = [...packages, ...(await dataLoader.inactivePackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load inactive packages.", level: "warning" },
          });
        }
      }

      if (labResultsReportConfig.packageFilter.includeIntransit) {
        try {
          packages = [...packages, ...(await dataLoader.inTransitPackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: "Failed to load in transit packages.", level: "warning" },
          });
        }
      }
    }

    packages = packages.filter((pkg) => {
      if (labResultsReportConfig.packageFilter.packagedDateLt) {
        if (pkg.PackagedDate > labResultsReportConfig.packageFilter.packagedDateLt) {
          return false;
        }
      }

      if (labResultsReportConfig.packageFilter.packagedDateEq) {
        if (!pkg.PackagedDate.startsWith(labResultsReportConfig.packageFilter.packagedDateEq)) {
          return false;
        }
      }

      if (labResultsReportConfig.packageFilter.packagedDateGt) {
        if (pkg.PackagedDate < labResultsReportConfig.packageFilter.packagedDateGt) {
          return false;
        }
      }

      return true;
    });

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading lab results...", level: "success" },
    });

    // Load all lab data for each package
    const promises: Promise<any>[] = [];

    let dataLoader: DataLoader;

    for (const pkg of packages) {
      dataLoader = await getDataLoaderByLicense(pkg.LicenseNumber);

      promises.push(
        dataLoader.testResultsByPackageId(pkg.Id).then((testResults) => {
          pkg.testResults = testResults;
        })
      );

      if (promises.length % 100 === 0) {
        await Promise.allSettled(promises);
      }

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Loaded ${promises.length} lab results...`, level: "success" },
        prependMessage: false,
      });
    }

    await Promise.allSettled(promises);

    reportData[ReportType.LAB_RESULTS] = {
      packages,
    };
  }
}

export function extractLabResultsReportData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  const matrix: any[][] = [];

  const headers = [
    "Current License",
    "Tag",
    "Item",
    "Quantity (estimated)",
    "Unit of Measure",
    "Note",
  ];

  if (reportConfig[ReportType.LAB_RESULTS]!.showDebugColumns) {
    headers.push(
      "Debug Message",
      "Incoming Manifests",
      "Outgoing Manifests",
      "Tag Used Date",
      "Packaged Date",
      "Archived Date",
      "Finished Date",
      "Received Date",
      "Arrival Dates",
      "Departure Dates",
      "Eligible?",
      "Has Package",
      "Incomging Package Count",
      "Outgoing Package Count"
    );
  }

  matrix.push(headers);

  const pairs = reportData[ReportType.LAB_RESULTS]!.packageMetadataPairs;

  for (const [label, metadata] of pairs) {
    if (metadata.eligible) {
      const row: any[] = [
        metadata.pkg?.LicenseNumber,
        label,
        metadata.itemName,
        metadata.quantity,
        metadata.unitOfMeasure,
        metadata.message,
      ];

      if (reportConfig[ReportType.LAB_RESULTS]!.showDebugColumns) {
        row.push(
          metadata.debugMessage,
          metadata.incomingManifests.join("|"),
          metadata.outgoingManifests.join("|"),
          metadata.tagUsedDate,
          metadata.packagedDate,
          metadata.archivedDate,
          metadata.finishedDate,
          metadata.receivedDate,
          metadata.arrivalDatetimes.join("|"),
          metadata.departureDatetimes.join("|"),
          metadata.eligible,
          !!metadata.pkg,
          metadata.incomingTransferPackages.length,
          metadata.outgoingDestinationPackages.length
        );
      }

      matrix.push(row);
    }
  }

  return matrix;
}
