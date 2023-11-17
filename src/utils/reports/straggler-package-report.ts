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

interface IStragglerPackageReportFormFilters {
  packagedDateGt: string;
  packagedDateLt: string;
  shouldFilterPackagedDateGt: boolean;
  shouldFilterPackagedDateLt: boolean;
  includeNearlyEmpty: boolean;
  quantityLt: number;
  lastModifiedDateGt: string;
  lastModifiedDateLt: string;
  shouldFilterLastModifiedDateGt: boolean;
  shouldFilterLastModifiedDateLt: boolean;
}

export const stragglerPackagesFormFiltersFactory: () => IStragglerPackageReportFormFilters = () => ({
  packagedDateGt: todayIsodate(),
  packagedDateLt: todayIsodate(),
  shouldFilterPackagedDateGt: false,
  shouldFilterPackagedDateLt: false,
  includeNearlyEmpty: false,
  quantityLt: 5,
  lastModifiedDateGt: todayIsodate(),
  lastModifiedDateLt: todayIsodate(),
  shouldFilterLastModifiedDateGt: false,
  shouldFilterLastModifiedDateLt: false,
});

export function addStragglerPackagesReport({
  reportConfig,
  stragglerPackagesFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  stragglerPackagesFormFilters: IStragglerPackageReportFormFilters;
  fields: IFieldData[];
}) {
  const stragglerPackageFilter: IPackageFilter = {};

  stragglerPackageFilter.includeActive = true;

  stragglerPackageFilter.quantityLt = stragglerPackagesFormFilters.includeNearlyEmpty
    ? stragglerPackagesFormFilters.quantityLt
    : null;

  stragglerPackageFilter.packagedDateGt = stragglerPackagesFormFilters.shouldFilterPackagedDateGt
    ? stragglerPackagesFormFilters.packagedDateGt
    : null;

  stragglerPackageFilter.packagedDateLt = stragglerPackagesFormFilters.shouldFilterPackagedDateLt
    ? stragglerPackagesFormFilters.packagedDateLt
    : null;

  stragglerPackageFilter.lastModifiedDateGt = stragglerPackagesFormFilters.shouldFilterLastModifiedDateGt
    ? stragglerPackagesFormFilters.lastModifiedDateGt
    : null;

  stragglerPackageFilter.lastModifiedDateLt = stragglerPackagesFormFilters.shouldFilterLastModifiedDateLt
    ? stragglerPackagesFormFilters.lastModifiedDateLt
    : null;

  reportConfig[ReportType.STRAGGLER_PACKAGES] = {
    stragglerPackageFilter,
    fields,
  };
}

export async function maybeLoadStragglerPackageReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const stragglerPackageConfig = reportConfig[ReportType.STRAGGLER_PACKAGES];
  if (stragglerPackageConfig?.stragglerPackageFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Loading straggler packages...', level: 'success' },
    });

    let stragglerPackages: IIndexedPackageData[] = [];

    try {
      stragglerPackages = [...stragglerPackages, ...(await primaryDataLoader.activePackages())];
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
      });
    }

    stragglerPackages = stragglerPackages.filter((pkg) => {
      if (stragglerPackageConfig.stragglerPackageFilter.isEmpty) {
        if (pkg.Quantity > 0) {
          return false;
        }
      } else if (stragglerPackageConfig.stragglerPackageFilter.quantityLt) {
        if (pkg.Quantity > stragglerPackageConfig.stragglerPackageFilter.quantityLt) {
          return false;
        }
      }

      if (stragglerPackageConfig.stragglerPackageFilter.packagedDateLt) {
        if (pkg.PackagedDate > stragglerPackageConfig.stragglerPackageFilter.packagedDateLt) {
          return false;
        }
      }

      if (stragglerPackageConfig.stragglerPackageFilter.packagedDateEq) {
        if (
          !pkg.PackagedDate.startsWith(stragglerPackageConfig.stragglerPackageFilter.packagedDateEq)
        ) {
          return false;
        }
      }

      if (stragglerPackageConfig.stragglerPackageFilter.packagedDateGt) {
        if (pkg.PackagedDate < stragglerPackageConfig.stragglerPackageFilter.packagedDateGt) {
          return false;
        }
      }

      if (stragglerPackageConfig.stragglerPackageFilter.lastModifiedDateLt) {
        if (pkg.LastModified > stragglerPackageConfig.stragglerPackageFilter.lastModifiedDateLt) {
          return false;
        }
      }

      if (stragglerPackageConfig.stragglerPackageFilter.lastModifiedDateGt) {
        if (pkg.LastModified < stragglerPackageConfig.stragglerPackageFilter.lastModifiedDateGt) {
          return false;
        }
      }

      return true;
    });

    reportData[ReportType.STRAGGLER_PACKAGES] = {
      stragglerPackages,
    };
  }
}
