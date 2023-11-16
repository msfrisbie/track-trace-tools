import { IIndexedPackageData, ILicenseFormFilters, IPackageFilter, IPluginState } from '@/interfaces';
import { getDataLoaderByLicense } from '@/modules/data-loader/data-loader.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IReportConfig,
  IReportData,
  IReportsState
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import {
  IPackageReportFormFilters,
  packageFormFiltersFactory
} from './package-report';
import { extractLicenseFields } from './reports-shared';

const REPORT_TYPE = ReportType.PACKAGES_QUICKVIEW;

export enum PackageQuickviewDimension {
  LICENSE = 'License',
  ITEM_NAME = 'Item',
  LOCATION = 'Location',
  PACKAGED_DATE = 'Packaged Date',
}

export const PACKAGES_QUICKVIEW_DIMENSIONS: PackageQuickviewDimension[] = [
  PackageQuickviewDimension.LICENSE,
  PackageQuickviewDimension.ITEM_NAME,
  PackageQuickviewDimension.LOCATION,
  PackageQuickviewDimension.PACKAGED_DATE,
];

export function extractPackagePropertyFromDimension(
  pkg: IIndexedPackageData,
  dimension: PackageQuickviewDimension,
) {
  switch (dimension) {
    case PackageQuickviewDimension.LICENSE:
      return pkg.LicenseNumber;
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

interface IPackagesQuickviewReportFormFilters extends IPackageReportFormFilters, ILicenseFormFilters {
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
    ...extractLicenseFields(packagesQuickviewFormFilters),
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

      for (const license of packageQuickviewConfig.licenses) {
        const dataLoader = await getDataLoaderByLicense(license);

        if (packageQuickviewConfig?.packageFilter.includeActive) {
          try {
            packages = [...packages, ...(await dataLoader.activePackages())];
          } catch (e) {
            ctx.commit(ReportsMutations.SET_STATUS, {
              statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
            });
          }
        }

        if (packageQuickviewConfig.packageFilter.includeIntransit) {
          try {
            packages = [...packages, ...(await dataLoader.inTransitPackages())];
          } catch (e) {
            ctx.commit(ReportsMutations.SET_STATUS, {
              statusMessage: { text: 'Failed to load in transit packages.', level: 'warning' },
            });
          }
        }

        if (packageQuickviewConfig.packageFilter.includeInactive) {
          try {
            packages = [...packages, ...(await dataLoader.inactivePackages())];
          } catch (e) {
            ctx.commit(ReportsMutations.SET_STATUS, {
              statusMessage: { text: 'Failed to load inactive packages.', level: 'warning' },
            });
          }
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
