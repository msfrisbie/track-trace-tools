import {
  IIndexedPackageData,
  IIndexedTransferData,
  IPackageFilter,
  IPluginState,
  ITransferFilter,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";

interface IEmployeeAuditReportFormFilters {
  lastModifiedDateGt: string;
  lastModifiedDateLt: string;
  employeeQuery: string;
  shouldFilterLastModifiedDateGt: boolean;
  shouldFilterLastModifiedDateLt: boolean;
  licenseOptions: string[];
  licenses: string[];
}

export const employeeAuditFormFiltersFactory: () => IEmployeeAuditReportFormFilters = () => ({
  lastModifiedDateGt: todayIsodate(),
  lastModifiedDateLt: todayIsodate(),
  employeeQuery: "",
  shouldFilterLastModifiedDateGt: true,
  shouldFilterLastModifiedDateLt: true,
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
});

export function addEmployeeAuditReport({
  reportConfig,
  employeeAuditFormFilters,
}: {
  reportConfig: IReportConfig;
  employeeAuditFormFilters: IEmployeeAuditReportFormFilters;
}) {
  const packageFilter: IPackageFilter = {};
  const transferFilter: ITransferFilter = {};

  const licenses: string[] = employeeAuditFormFilters.licenses;

  packageFilter.lastModifiedDateGt = employeeAuditFormFilters.shouldFilterLastModifiedDateGt
    ? employeeAuditFormFilters.lastModifiedDateGt
    : null;
  transferFilter.lastModifiedDateGt = employeeAuditFormFilters.shouldFilterLastModifiedDateGt
    ? employeeAuditFormFilters.lastModifiedDateGt
    : null;

  packageFilter.lastModifiedDateLt = employeeAuditFormFilters.shouldFilterLastModifiedDateLt
    ? employeeAuditFormFilters.lastModifiedDateLt
    : null;
  transferFilter.lastModifiedDateLt = employeeAuditFormFilters.shouldFilterLastModifiedDateLt
    ? employeeAuditFormFilters.lastModifiedDateLt
    : null;

  reportConfig[ReportType.EMPLOYEE_AUDIT] = {
    packageFilter,
    transferFilter,
    employeeQuery: employeeAuditFormFilters.employeeQuery,
    licenses,
    fields: null,
  };
}

export async function maybeLoadEmployeeAuditReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const config = reportConfig[ReportType.EMPLOYEE_AUDIT];

  if (config) {
    let dataLoader: DataLoader | null = null;

    let packages: IIndexedPackageData[] = [];
    let transfers: IIndexedTransferData[] = [];

    for (const license of config.licenses) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Loading ${license} packages...`, level: "success" },
      });

      dataLoader = await getDataLoaderByLicense(license);

      try {
        packages = [...packages, ...(await dataLoader.activePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load active packages.", level: "warning" },
        });
      }

      try {
        packages = [...packages, ...(await dataLoader.onHoldPackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load onhold packages.", level: "warning" },
        });
      }

      try {
        packages = [...packages, ...(await dataLoader.inTransitPackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load intransit packages.", level: "warning" },
        });
      }

      try {
        packages = [...packages, ...(await dataLoader.inactivePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load inactive packages.", level: "warning" },
        });
      }

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Loading ${license} transfers...`, level: "success" },
      });

      // Incoming transfers do not have history

      try {
        transfers = [...transfers, ...(await dataLoader.outgoingTransfers())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load outgoing transfers.", level: "warning" },
        });
      }

      try {
        transfers = [...transfers, ...(await dataLoader.outgoingInactiveTransfers())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load outgoing inactive transfers.", level: "warning" },
        });
      }

      try {
        transfers = [...transfers, ...(await dataLoader.rejectedTransfers())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load rejected transfers.", level: "warning" },
        });
      }
    }

    packages = packages.filter((pkg) => {
      if (config.packageFilter.lastModifiedDateGt) {
        if (pkg.LastModified < config.packageFilter.lastModifiedDateGt) {
          return false;
        }
      }

      if (config.packageFilter.lastModifiedDateLt) {
        if (pkg.LastModified > config.packageFilter.lastModifiedDateLt) {
          return false;
        }
      }

      return true;
    });

    transfers = transfers.filter((transfer) => {
      if (config.transferFilter.lastModifiedDateGt) {
        if (transfer.LastModified < config.transferFilter.lastModifiedDateGt) {
          return false;
        }
      }

      if (config.transferFilter.lastModifiedDateLt) {
        if (transfer.LastModified > config.transferFilter.lastModifiedDateLt) {
          return false;
        }
      }

      return true;
    });

    const employeeAuditMatrix: any[][] = [];

    const historyPromises: Promise<any>[] = [];

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loading history...`, level: "success" },
    });

    packages.map((pkg) => {
      historyPromises.push(
        getDataLoaderByLicense(pkg.LicenseNumber)
          .then((dataLoader) => dataLoader.packageHistoryByPackageId(pkg.Id))
          .then((response) => {
            pkg.history = response;
          })
      );
    });

    transfers.map((transfer) => {
      historyPromises.push(
        getDataLoaderByLicense(transfer.LicenseNumber)
          .then((dataLoader) => dataLoader.transferHistoryByOutGoingTransferId(transfer.Id))
          .then((response) => {
            transfer.history = response;
          })
      );
    });

    const settledHistoryPromises = await Promise.allSettled(historyPromises);

    if (settledHistoryPromises.find((x) => x.status === "rejected")) {
      throw new Error("History request failed");
    }

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Analyzing history...`, level: "success" },
    });

    const employeeMatcher = config.employeeQuery.toLocaleLowerCase().slice(0, -3);

    for (const pkg of packages) {
      for (const history of pkg.history!) {
        if (history.UserName.toLocaleLowerCase().includes(employeeMatcher)) {
          employeeAuditMatrix.push([
            `${pkg.PackageState} Package`,
            pkg.Label,
            history.RecordedDateTime,
            history.UserName,
            history.Descriptions.join(" / "),
          ]);
        }
      }
    }

    for (const transfer of transfers) {
      for (const history of transfer.history!) {
        if (history.UserName.toLocaleLowerCase().includes(employeeMatcher)) {
          employeeAuditMatrix.push([
            `${transfer.TransferState} Transfer`,
            transfer.ManifestNumber,
            history.RecordedDateTime,
            history.UserName,
            history.Descriptions.join(" /"),
          ]);
        }
      }
    }

    // Sort by date
    const sortIndex = 2;

    employeeAuditMatrix.sort((a, b) => {
      const stringA = a[sortIndex].toLowerCase();
      const stringB = b[sortIndex].toLowerCase();
      if (stringA < stringB) {
        return -1;
      }
      if (stringA > stringB) {
        return 1;
      }
      return 0;
    });

    employeeAuditMatrix.unshift(["Object Type", "Object ID", "Timestamp", "Employee", "Activity"]);

    reportData[ReportType.EMPLOYEE_AUDIT] = {
      employeeAuditMatrix,
    };
  }
}

export function extractExmployeeAuditData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  return reportData[ReportType.EMPLOYEE_AUDIT]!.employeeAuditMatrix;
}

export async function createEmployeeAuditReportOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<any> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.EMPLOYEE_AUDIT]) {
    throw new Error("Missing harvest packages data");
  }
}
