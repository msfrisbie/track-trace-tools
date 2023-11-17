import { IIndexedPackageData, ILicenseFormFilters, IPackageFilter, IPluginState } from '@/interfaces';
import { DataLoader, getDataLoaderByLicense } from '@/modules/data-loader/data-loader.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import { todayIsodate } from '../date';
import { extractInitialPackageQuantityAndUnitFromHistoryOrError, extractParentPackageTagQuantityUnitItemSetsFromHistory } from '../history';
import { extractLicenseFields, licenseFilterFactory } from './reports-shared';

export interface IPackageReportFormFilters extends ILicenseFormFilters {
  packagedDateGt: string;
  packagedDateLt: string;
  shouldFilterPackagedDateGt: boolean;
  shouldFilterPackagedDateLt: boolean;
  includeActive: boolean;
  includeIntransit: boolean;
  includeInactive: boolean;
  includeTransferHub: boolean;
  onlyProductionBatches: boolean;
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
  onlyProductionBatches: false,
  ...licenseFilterFactory()
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
    onlyProductionBatches: packagesFormFilters.onlyProductionBatches,
    ...extractLicenseFields(packagesFormFilters),
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

    for (const license of packageConfig.licenses) {
      const dataLoader = await getDataLoaderByLicense(license);

    if (packageConfig.packageFilter.includeActive) {
      try {
        packages = [...packages, ...(await dataLoader.activePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load active packages.', level: 'warning' },
        });
      }
    }

    if (packageConfig.packageFilter.includeInactive) {
      try {
        packages = [...packages, ...(await dataLoader.inactivePackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load inactive packages.', level: 'warning' },
        });
      }
    }

    if (packageConfig.packageFilter.includeIntransit) {
      try {
        packages = [...packages, ...(await dataLoader.inTransitPackages())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load in transit packages.', level: 'warning' },
        });
      }
    }
    // if (packageConfig.packageFilter.includeTransferHub) {
    //   try {
    //     packages = [...packages, ...(await dataLoader.transferHubPackages())];
    //   } catch (e) {
    //     ctx.commit(ReportsMutations.SET_STATUS, {
    //       statusMessage: { text: "Failed to load transfer hub packages.", level: "warning" },
    //     });
    //   }
    // }
  }

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

      if (packageConfig.onlyProductionBatches) {
        if (pkg.ProductionBatchNumber.length === 0) {
          return false;
        }
      }

      return true;
    });

    if (packageConfig.fields.find((x) => [
      'initialQuantity',
      'initialQuantityUnitOfMeasure',
      'totalInputQuantity',
      'totalInputQuantityUnitOfMeasure',
    ].includes(x.value))) {
      const promises: Promise<any>[] = [];

      let dataLoader: DataLoader;

      for (const pkg of packages) {
        dataLoader = await getDataLoaderByLicense(pkg.LicenseNumber);

        promises.push(dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => { pkg.history = history; }));

        if (promises.length % 100 === 0) {
          await Promise.allSettled(promises);
        }
      }

      await Promise.allSettled(promises);

      for (const pkg of packages) {
        try {
          const [initialQuantity, unitOfMeasure] = extractInitialPackageQuantityAndUnitFromHistoryOrError(pkg.history!);

          pkg.initialQuantity = initialQuantity;
          pkg.initialQuantityUnitOfMeasure = unitOfMeasure;

          const inputQuantitySet = extractParentPackageTagQuantityUnitItemSetsFromHistory(pkg.history!);

          const unitsOfMeasure = new Set(inputQuantitySet.map(([tag, quantity, unit, itemName]) => unit));

          if (unitsOfMeasure.size === 1) {
            pkg.totalInputQuantity = inputQuantitySet.map(([tag, quantity, unit, itemName]) => quantity).reduce((a, b) => a + b, 0);
            pkg.totalInputQuantityUnitOfMeasure = [...unitsOfMeasure][0];
          }
        } catch {
          console.error(`Could not extract initial/total quantity from pkg ${pkg.Label}`);
        }
      }
    }

    reportData[ReportType.PACKAGES] = {
      packages,
    };
  }
}
