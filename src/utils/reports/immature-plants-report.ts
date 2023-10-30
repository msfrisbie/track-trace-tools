import { IIndexedPlantBatchData, IPlantBatchFilter, IPluginState } from '@/interfaces';
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

export interface IImmaturePlantsReportFormFilters {
  plantedDateGt: string;
  plantedDateLt: string;
  shouldFilterPlantedDateGt: boolean;
  shouldFilterPlantedDateLt: boolean;
  includeActive: boolean;
  includeInactive: boolean;
}

export const immaturePlantsFormFiltersFactory: () => IImmaturePlantsReportFormFilters = () => ({
  plantedDateGt: todayIsodate(),
  plantedDateLt: todayIsodate(),
  shouldFilterPlantedDateGt: false,
  shouldFilterPlantedDateLt: false,
  includeActive: true,
  includeInactive: false,
});

export function addImmaturePlantsReport({
  reportConfig,
  immaturePlantsFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  immaturePlantsFormFilters: IImmaturePlantsReportFormFilters;
  fields: IFieldData[];
}) {
  const immaturePlantFilter: IPlantBatchFilter = {};

  immaturePlantFilter.includeActive = immaturePlantsFormFilters.includeActive;
  immaturePlantFilter.includeInactive = immaturePlantsFormFilters.includeInactive;

  immaturePlantFilter.plantedDateGt = immaturePlantsFormFilters.shouldFilterPlantedDateGt
    ? immaturePlantsFormFilters.plantedDateGt
    : null;

  immaturePlantFilter.plantedDateLt = immaturePlantsFormFilters.shouldFilterPlantedDateLt
    ? immaturePlantsFormFilters.plantedDateLt
    : null;

  reportConfig[ReportType.IMMATURE_PLANTS] = {
    immaturePlantFilter,
    fields,
  };
}

export async function maybeLoadImmaturePlantsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const immaturePlantConfig = reportConfig[ReportType.IMMATURE_PLANTS];
  if (immaturePlantConfig?.immaturePlantFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Loading plant batches...', level: 'success' },
    });

    let immaturePlants: IIndexedPlantBatchData[] = [];

    if (immaturePlantConfig.immaturePlantFilter.includeActive) {
      try {
        immaturePlants = [...immaturePlants, ...(await primaryDataLoader.plantBatches({}))];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load active plant batches.', level: 'warning' },
        });
      }
    }

    if (immaturePlantConfig.immaturePlantFilter.includeInactive) {
      try {
        immaturePlants = [...immaturePlants, ...(await primaryDataLoader.inactivePlantBatches())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Failed to load inactive plant batches.', level: 'warning' },
        });
      }
    }

    immaturePlants = immaturePlants.filter((plantBatch) => {
      if (immaturePlantConfig.immaturePlantFilter.plantedDateLt) {
        if (plantBatch.PlantedDate > immaturePlantConfig.immaturePlantFilter.plantedDateLt) {
          return false;
        }
      }

      if (immaturePlantConfig.immaturePlantFilter.plantedDateGt) {
        if (plantBatch.PlantedDate < immaturePlantConfig.immaturePlantFilter.plantedDateGt) {
          return false;
        }
      }

      return true;
    });

    reportData[ReportType.IMMATURE_PLANTS] = {
      immaturePlants,
    };
  }
}
