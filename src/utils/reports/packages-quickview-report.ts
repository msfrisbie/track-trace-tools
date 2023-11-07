import { IIndexedPackageData, IPackageFilter, IPluginState } from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import {
  IPackageReportFormFilters,
  packageFormFiltersFactory,
} from './package-report';

const REPORT_TYPE = ReportType.PACKAGES_QUICKVIEW;

export enum PackageQuickviewDimension {
  ITEM_NAME = 'Item',
  LOCATION = 'Location',
  PACKAGED_DATE = 'Packaged Date',
}

export const PACKAGES_QUICKVIEW_DIMENSIONS: PackageQuickviewDimension[] = [
  PackageQuickviewDimension.ITEM_NAME,
  PackageQuickviewDimension.LOCATION,
  PackageQuickviewDimension.PACKAGED_DATE,
];

export function extractPackagePropertyFromDimension(
  pkg: IIndexedPackageData,
  dimension: PackageQuickviewDimension,
) {
  switch (dimension) {
    case PackageQuickviewDimension.ITEM_NAME:
      return pkg.Item.Name;
    case PackageQuickviewDimension.LOCATION:
      return pkg.LocationName;
    case PackageQuickviewDimension.PACKAGED_DATE:
      return pkg.PackagedDate;
    default:
      throw new Error('Bad dimension');
  }
}

interface IPackagesQuickviewReportFormFilters extends IPackageReportFormFilters {
  primaryDimension: PackageQuickviewDimension;
  secondaryDimension: PackageQuickviewDimension | null;
}

export const packagesQuickviewFormFiltersFactory: () => IPackagesQuickviewReportFormFilters = () => ({
  // @ts-ignore
  primaryDimension: PackageQuickviewDimension.ITEM_NAME,
  // @ts-ignore
  secondaryDimension: PackageQuickviewDimension.LOCATION,
  ...packageFormFiltersFactory(),
});

export function addPackagesQuickviewReport({
  reportConfig,
  packagesQuickviewFormFilters,
}: {
  reportConfig: IReportConfig;
  packagesQuickviewFormFilters: IPackagesQuickviewReportFormFilters;
}) {
  const packageFilter: IPackageFilter = {};

  packageFilter.includeActive = packagesQuickviewFormFilters.includeActive;
  packageFilter.includeInactive = packagesQuickviewFormFilters.includeInactive;

  packageFilter.packagedDateGt = packagesQuickviewFormFilters.shouldFilterPackagedDateGt
    ? packagesQuickviewFormFilters.packagedDateGt
    : null;

  packageFilter.packagedDateLt = packagesQuickviewFormFilters.shouldFilterPackagedDateLt
    ? packagesQuickviewFormFilters.packagedDateLt
    : null;

  reportConfig[REPORT_TYPE] = {
    packageFilter,
    ...packagesQuickviewFormFilters,
    fields: null,
  };
}

export async function maybeLoadPackagesQuickviewReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const packageQuickviewConfig = reportConfig[REPORT_TYPE]!;

  if (packageQuickviewConfig) {
    let packages: IIndexedPackageData[] = [];
    if (packageQuickviewConfig?.packageFilter) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Loading packages...', level: 'success' },
      });

      if (packageQuickviewConfig?.packageFilter.includeActive) {
        try {
          packages = [...packages, ...(await primaryDataLoader.activePackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
          });
        }
      }

      if (packageQuickviewConfig.packageFilter.includeIntransit) {
        try {
          packages = [...packages, ...(await primaryDataLoader.inTransitPackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load in transit packages.', level: 'warning' },
          });
        }
      }

      if (packageQuickviewConfig.packageFilter.includeInactive) {
        try {
          packages = [...packages, ...(await primaryDataLoader.inactivePackages())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load inactive packages.', level: 'warning' },
          });
        }
      }
    }

    packages = packages.filter((pkg) => {
      if (packageQuickviewConfig.packageFilter.packagedDateLt) {
        if (pkg.PackagedDate > packageQuickviewConfig.packageFilter.packagedDateLt) {
          return false;
        }
      }

      if (packageQuickviewConfig.packageFilter.packagedDateGt) {
        if (pkg.PackagedDate < packageQuickviewConfig.packageFilter.packagedDateGt) {
          return false;
        }
      }

      return true;
    });

    reportData[REPORT_TYPE] = {
      packages,
    };
  }
}
