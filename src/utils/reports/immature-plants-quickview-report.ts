import { IIndexedPlantBatchData, IPlantBatchFilter, IPluginState } from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import {
  IImmaturePlantsReportFormFilters,
  immaturePlantsFormFiltersFactory,
} from './immature-plants-report';

const REPORT_TYPE = ReportType.IMMATURE_PLANTS_QUICKVIEW;

export enum ImmaturePlantQuickviewDimension {
  STRAIN = 'Strain',
  LOCATION = 'Location',
  PLANTED_DATE = 'Planted Date',
}

export const IMMATURE_PLANT_QUICKVIEW_DIMENSIONS: ImmaturePlantQuickviewDimension[] = [
  ImmaturePlantQuickviewDimension.STRAIN,
  ImmaturePlantQuickviewDimension.LOCATION,
  ImmaturePlantQuickviewDimension.PLANTED_DATE,
];

export function extractImmaturePlantPropertyFromDimension(
  plantBatch: IIndexedPlantBatchData,
  dimension: ImmaturePlantQuickviewDimension
) {
  switch (dimension) {
    case ImmaturePlantQuickviewDimension.STRAIN:
      return plantBatch.StrainName;
    case ImmaturePlantQuickviewDimension.LOCATION:
      return plantBatch.LocationName;
    case ImmaturePlantQuickviewDimension.PLANTED_DATE:
      return plantBatch.PlantedDate;
    default:
      throw new Error('Bad dimension');
  }
}

interface IImmaturePlantsQuickviewReportFormFilters extends IImmaturePlantsReportFormFilters {
  primaryDimension: ImmaturePlantQuickviewDimension;
  secondaryDimension: ImmaturePlantQuickviewDimension | null;
}

export const immaturePlantsQuickviewFormFiltersFactory: () => IImmaturePlantsQuickviewReportFormFilters = () => ({
  // @ts-ignore
  primaryDimension: ImmaturePlantQuickviewDimension.STRAIN,
  // @ts-ignore
  secondaryDimension: ImmaturePlantQuickviewDimension.LOCATION,
  ...immaturePlantsFormFiltersFactory(),
});

export function addImmaturePlantsQuickviewReport({
  reportConfig,
  immaturePlantsQuickviewFormFilters,
}: {
  reportConfig: IReportConfig;
  immaturePlantsQuickviewFormFilters: IImmaturePlantsQuickviewReportFormFilters;
}) {
  const plantBatchFilter: IPlantBatchFilter = {};

  plantBatchFilter.includeActive = immaturePlantsQuickviewFormFilters.includeActive;
  plantBatchFilter.includeInactive = immaturePlantsQuickviewFormFilters.includeInactive;

  plantBatchFilter.plantedDateGt = immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt
    ? immaturePlantsQuickviewFormFilters.plantedDateGt
    : null;

  plantBatchFilter.plantedDateLt = immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt
    ? immaturePlantsQuickviewFormFilters.plantedDateLt
    : null;

  reportConfig[REPORT_TYPE] = {
    plantBatchFilter,
    ...immaturePlantsQuickviewFormFilters,
    fields: null,
  };
}

export async function maybeLoadImmaturePlantsQuickviewReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const immaturePlantQuickviewConfig = reportConfig[REPORT_TYPE]!;

  if (immaturePlantQuickviewConfig) {
    let plantBatches: IIndexedPlantBatchData[] = [];
    if (immaturePlantQuickviewConfig?.plantBatchFilter) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Loading plant batches...', level: 'success' },
      });

      if (immaturePlantQuickviewConfig?.plantBatchFilter.includeActive) {
        try {
          plantBatches = [...plantBatches, ...(await primaryDataLoader.plantBatches())];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load active plant batches.', level: 'warning' },
          });
        }
      }

      if (immaturePlantQuickviewConfig.plantBatchFilter.includeInactive) {
        try {
          plantBatches = [...plantBatches, ...(await primaryDataLoader.inactivePlantBatches({}))];
        } catch (e) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: { text: 'Failed to load inactive plant batches.', level: 'warning' },
          });
        }
      }
    }

    plantBatches = plantBatches.filter((plantBatch) => {
      if (immaturePlantQuickviewConfig.plantBatchFilter.plantedDateLt) {
        if (plantBatch.PlantedDate > immaturePlantQuickviewConfig.plantBatchFilter.plantedDateLt) {
          return false;
        }
      }

      if (immaturePlantQuickviewConfig.plantBatchFilter.plantedDateGt) {
        if (plantBatch.PlantedDate < immaturePlantQuickviewConfig.plantBatchFilter.plantedDateGt) {
          return false;
        }
      }

      return true;
    });

    reportData[REPORT_TYPE] = {
      plantBatches,
    };
  }
}
