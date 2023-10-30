import { IIndexedPackageData, IPackageFilter, IPluginState } from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import { todayIsodate } from '../date';

export interface IPackageReportFormFilters {
  packagedDateGt: string;
  packagedDateLt: string;
  shouldFilterPackagedDateGt: boolean;
  shouldFilterPackagedDateLt: boolean;
  includeActive: boolean;
  includeIntransit: boolean;
  includeInactive: boolean;
  includeTransferHub: boolean;
}

export const packageFormFiltersFactory: () => IPackageReportFormFilters = () => ({
  packagedDateGt: todayIsodate(),
  packagedDateLt: todayIsodate(),
  shouldFilterPackagedDateGt: false,
  shouldFilterPackagedDateLt: false,
  includeActive: true,
  includeIntransit: false,
  includeInactive: false,
  includeTransferHub: false,
});

export function addPackageReport({
  reportConfig,
  packagesFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  packagesFormFilters: IPackageReportFormFilters;
  fields: IFieldData[];
}) {
  const packageFilter: IPackageFilter = {};

  packageFilter.includeActive = packagesFormFilters.includeActive;
  packageFilter.includeIntransit = packagesFormFilters.includeIntransit;
  packageFilter.includeInactive = packagesFormFilters.includeInactive;
  // packageFilter.includeTransferHub = packagesFormFilters.includeTransferHub;

  packageFilter.packagedDateGt = packagesFormFilters.shouldFilterPackagedDateGt
    ? packagesFormFilters.packagedDateGt
    : null;

  packageFilter.packagedDateLt = packagesFormFilters.shouldFilterPackagedDateLt
    ? packagesFormFilters.packagedDateLt
    : null;

  reportConfig[ReportType.PACKAGES] = {
    packageFilter,
    fields,
  };
}

export async function maybeLoadPackageReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const packageConfig = reportConfig[ReportType.PACKAGES];
  if (packageConfig?.packageFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Loading packages...', level: 'success' },
    });

    let packages: IIndexedPackageData[] = [];

    if (packageConfig.packageFilter.includeActive) {
      try {
        packages = [...packages, ...(await primaryDataLoader.activePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
        });
      }
    }

    if (packageConfig.packageFilter.includeInactive) {
      try {
        packages = [...packages, ...(await primaryDataLoader.inactivePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load inactive packages.', level: 'warning' },
        });
      }
    }

    if (packageConfig.packageFilter.includeIntransit) {
      try {
        packages = [...packages, ...(await primaryDataLoader.inTransitPackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load in transit packages.', level: 'warning' },
        });
      }
    }

    // if (packageConfig.packageFilter.includeTransferHub) {
    //   try {
    //     packages = [...packages, ...(await primaryDataLoader.transferHubPackages())];
    //   } catch (e) {
    //     ctx.commit(ReportsMutations.SET_STATUS, {
    //       statusMessage: { text: "Failed to load transfer hub packages.", level: "warning" },
    //     });
    //   }
    // }

    packages = packages.filter((pkg) => {
      if (packageConfig.packageFilter.packagedDateLt) {
        if (pkg.PackagedDate > packageConfig.packageFilter.packagedDateLt) {
          return false;
        }
      }

      if (packageConfig.packageFilter.packagedDateEq) {
        if (!pkg.PackagedDate.startsWith(packageConfig.packageFilter.packagedDateEq)) {
          return false;
        }
      }

      if (packageConfig.packageFilter.packagedDateGt) {
        if (pkg.PackagedDate < packageConfig.packageFilter.packagedDateGt) {
          return false;
        }
      }

      return true;
    });

    reportData[ReportType.PACKAGES] = {
      packages,
    };
  }
}
