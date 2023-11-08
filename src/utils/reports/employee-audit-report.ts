import {
  IIndexedPackageData,
  IIndexedTransferData,
  IPackageFilter,
  IPluginState,
  ITransferFilter,
} from '@/interfaces';
import { DataLoader, getDataLoaderByLicense } from '@/modules/data-loader/data-loader.module';
import { facilityManager } from '@/modules/facility-manager.module';
import store from '@/store/page-overlay/index';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import { todayIsodate } from '../date';

interface IEmployeeAuditReportFormFilters {
  activityDateGt: string;
  activityDateLt: string;
  employeeQuery: string;
  shouldFilterActivityDateGt: boolean;
  shouldFilterActivityDateLt: boolean;
  includePackages: boolean;
  includeTransfers: boolean;
  licenseOptions: string[];
  licenses: string[];
}

export const employeeAuditFormFiltersFactory: () => IEmployeeAuditReportFormFilters = () => ({
  activityDateGt: todayIsodate(),
  activityDateLt: todayIsodate(),
  employeeQuery: '',
  shouldFilterActivityDateGt: true,
  shouldFilterActivityDateLt: true,
  includePackages: true,
  includeTransfers: true,
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

  const activityDateGt = employeeAuditFormFilters.shouldFilterActivityDateGt
    ? employeeAuditFormFilters.activityDateGt
    : null;

  const activityDateLt = employeeAuditFormFilters.shouldFilterActivityDateLt
    ? employeeAuditFormFilters.activityDateLt
    : null;

  // If created after end time, it cannot contain relevant events
  packageFilter.packagedDateLt = activityDateLt;
  transferFilter.createdDateLt = activityDateLt;

  // If last modified before start time, it cannot contain relevant events
  packageFilter.lastModifiedDateGt = activityDateGt;
  transferFilter.lastModifiedDateGt = activityDateGt;

  reportConfig[ReportType.EMPLOYEE_AUDIT] = {
    activityDateGt,
    activityDateLt,
    packageFilter,
    transferFilter,
    includePackages: employeeAuditFormFilters.includePackages,
    includeTransfers: employeeAuditFormFilters.includeTransfers,
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
      dataLoader = await getDataLoaderByLicense(license);

      if (config.includePackages) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: `Loading ${license} packages...`, level: 'success' },
        });

        try {
          packages = [...packages, ...(await dataLoader.activePackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
          });
        }

        try {
          packages = [...packages, ...(await dataLoader.onHoldPackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load onhold packages.', level: 'warning' },
          });
        }

        try {
          packages = [...packages, ...(await dataLoader.inTransitPackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load intransit packages.', level: 'warning' },
          });
        }

        try {
          packages = [...packages, ...(await dataLoader.inactivePackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load inactive packages.', level: 'warning' },
          });
        }
      }

      if (config.includeTransfers) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: `Loading ${license} transfers...`, level: 'success' },
        });

        // Incoming transfers do not have history

        try {
          transfers = [...transfers, ...(await dataLoader.outgoingTransfers())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load outgoing transfers.', level: 'warning' },
          });
        }

        try {
          transfers = [...transfers, ...(await dataLoader.outgoingInactiveTransfers())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load outgoing inactive transfers.', level: 'warning' },
          });
        }

        try {
          transfers = [...transfers, ...(await dataLoader.rejectedTransfers())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load rejected transfers.', level: 'warning' },
          });
        }
      }
    }

    packages = packages.filter((pkg) => {
      if (config.packageFilter.packagedDateLt) {
        if (pkg.PackagedDate > config.packageFilter.packagedDateLt) {
          return false;
        }
      }

      if (config.packageFilter.lastModifiedDateGt) {
        if (pkg.LastModified < config.packageFilter.lastModifiedDateGt) {
          return false;
        }
      }

      return true;
    });

    transfers = transfers.filter((transfer) => {
      if (config.transferFilter.createdDateLt) {
        if (transfer.CreatedDateTime > config.transferFilter.createdDateLt) {
          return false;
        }
      }

      if (config.transferFilter.lastModifiedDateGt) {
        if (transfer.LastModified < config.transferFilter.lastModifiedDateGt) {
          return false;
        }
      }

      return true;
    });

    const employeeAuditMatrix: any[][] = [];

    const historyPromises: Promise<any>[] = [];

    // ctx.commit(ReportsMutations.SET_STATUS, {
    //   statusMessage: { text: `Loading history for ${packages.length} packages...`, level: 'success' },
    // });

    let pageSize = 32;
    const MAX_PAGE_SIZE = 256;
    const MIN_PAGE_SIZE = 1;
    const FAST_RESPONSE_THRESHOLD_MS = 1000;
    const SLOW_REPONSE_THRESHOLD_MS = 10000;

    for (const pkg of packages) {
      historyPromises.push(
        getDataLoaderByLicense(pkg.LicenseNumber)
          .then((dataLoader) => dataLoader.packageHistoryByPackageId(pkg.Id))
          .then((response) => {
            pkg.history = response;
          }),
      );
      if (historyPromises.length % pageSize === 0) {
        const t0 = performance.now();
        await Promise.allSettled(historyPromises);
        const t1 = performance.now();

        if ((t1 - t0) < FAST_RESPONSE_THRESHOLD_MS) {
          pageSize = Math.min(MAX_PAGE_SIZE, pageSize + 4);
        }

        if ((t1 - t0) > SLOW_REPONSE_THRESHOLD_MS) {
          pageSize = Math.max(MIN_PAGE_SIZE, pageSize / 2);
        }

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: `${historyPromises.length}/${packages.length} packages loaded...`, level: 'success' }, prependMessage: false,
        });
      }
    }
    await Promise.allSettled(historyPromises);

    // ctx.commit(ReportsMutations.SET_STATUS, {
    //   statusMessage: { text: `Loading history for ${transfers.length} transfers...`, level: 'success' },
    // });

    for (const transfer of transfers) {
      historyPromises.push(
        getDataLoaderByLicense(transfer.LicenseNumber)
          .then((dataLoader) => dataLoader.transferHistoryByOutGoingTransferId(transfer.Id))
          .then((response) => {
            transfer.history = response;
          }),
      );

      if (historyPromises.length % pageSize === 0) {
        const t0 = performance.now();
        await Promise.allSettled(historyPromises);
        const t1 = performance.now();

        if ((t1 - t0) < FAST_RESPONSE_THRESHOLD_MS) {
          pageSize = Math.min(MAX_PAGE_SIZE, pageSize + 4);
        }

        if ((t1 - t0) > SLOW_REPONSE_THRESHOLD_MS) {
          pageSize = Math.max(MIN_PAGE_SIZE, pageSize / 2);
        }

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: `${historyPromises.length - packages.length}/${transfers.length} transfers loaded...`, level: 'success' }, prependMessage: false,
        });
      }
    }

    const settledHistoryPromises = await Promise.allSettled(historyPromises);

    if (settledHistoryPromises.find((x) => x.status === 'rejected')) {
      throw new Error('History request failed');
    }

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Analyzing history...', level: 'success' },
    });

    // TODO: IDs only partially show. how to resolve?
    // TODO regex
    for (const substring of config.employeeQuery.split(',').map((x) => x.trim())) {
      // Employee IDs
      const employeeMatcher = substring.toLocaleLowerCase(); // .slice(0, -3);

      for (const pkg of packages) {
        for (const history of pkg.history!) {
          if (config.activityDateGt && history.RecordedDateTime < config.activityDateGt) {
            continue;
          }

          if (config.activityDateLt && history.RecordedDateTime > config.activityDateLt) {
            continue;
          }

          if (history.UserName.toLocaleLowerCase().includes(employeeMatcher)) {
            employeeAuditMatrix.push([
              pkg.LicenseNumber,
              `${pkg.PackageState} Package`,
              pkg.Label,
              history.RecordedDateTime,
              history.UserName,
              history.Descriptions.join(' / '),
            ]);
          }
        }
      }

      for (const transfer of transfers) {
        for (const history of transfer.history!) {
          if (config.activityDateGt && history.RecordedDateTime < config.activityDateGt) {
            continue;
          }

          if (config.activityDateLt && history.RecordedDateTime > config.activityDateLt) {
            continue;
          }

          if (history.UserName.toLocaleLowerCase().includes(employeeMatcher)) {
            employeeAuditMatrix.push([
              transfer.LicenseNumber,
              `${transfer.TransferState} Transfer`,
              transfer.ManifestNumber,
              history.RecordedDateTime,
              history.UserName,
              history.Descriptions.join(' /'),
            ]);
          }
        }
      }
    }

    // Sort by date
    const sortIndex = 3;

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

    employeeAuditMatrix.unshift(['License', 'Object Type', 'Object ID', 'Timestamp', 'Employee', 'Activity']);

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
    throw new Error('Invalid authState');
  }

  if (!reportData[ReportType.EMPLOYEE_AUDIT]) {
    throw new Error('Missing harvest packages data');
  }
}
