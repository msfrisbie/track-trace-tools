import {
  IIndexedPackageData,
  ILicenseFormFilters,
  IPackageFilter,
  IPluginState,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
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
  testTypeQuery: string;
}

export const labResultsReportFormFiltersFactory: () => ILabResultsReportFormFilters = () => ({
  packagedDateGt: todayIsodate(),
  packagedDateLt: todayIsodate(),
  shouldFilterPackagedDateGt: false,
  shouldFilterPackagedDateLt: false,
  includeActive: true,
  includeIntransit: false,
  includeInactive: false,
  testTypeQuery: "",
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
    testTypeQuery: labResultsReportFormFilters.testTypeQuery,
    ...extractLicenseFields(labResultsReportFormFilters),
    fields: null,
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
      if (pkg.LabTestingStateName !== "TestPassed") {
        return false;
      }

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
      statusMessage: {
        text: `Loading lab results matching "${labResultsReportConfig.testTypeQuery}"...`,
        level: "success",
      },
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

  const testResultNames: string[] = reportConfig[ReportType.LAB_RESULTS]!.testTypeQuery.split(
    ","
  ).map((x) => x.trim());

  const headers = [
    "License",
    "Package Status",
    "Package Tag",
    "Item",
    "Quantity",
    "Unit of Measure",
    "Test Type Name",
    "Test Result",
    "Test Result Date",
  ];

  matrix.push(headers);

  for (const pkg of reportData[ReportType.LAB_RESULTS]!.packages) {
    for (const labResult of pkg.testResults!) {
      if (!testResultNames.includes(labResult.TestTypeName)) {
        continue;
      }

      const row: any[] = [
        pkg.LicenseNumber,
        pkg.PackageState,
        pkg.Label,
        pkg.Item.Name,
        pkg.Quantity,
        pkg.UnitOfMeasureAbbreviation,
        labResult.TestTypeName,
        labResult.TestResultLevel,
        labResult.TestPerformedDate,
      ];

      matrix.push(row);
    }
  }

  return matrix;
}
