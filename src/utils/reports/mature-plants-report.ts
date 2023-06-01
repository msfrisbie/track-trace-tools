import { IIndexedPlantData, IPlantFilter, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";

interface IMaturePlantsReportFormFilters {
  plantedDateGt: string;
  plantedDateLt: string;
  includeVegetative: boolean;
  includeFlowering: boolean;
  includeInactive: boolean;
  shouldFilterPlantedDateGt: boolean;
  shouldFilterPlantedDateLt: boolean;
}

export const maturePlantsFormFiltersFactory: () => IMaturePlantsReportFormFilters = () => ({
  plantedDateGt: todayIsodate(),
  plantedDateLt: todayIsodate(),
  includeVegetative: true,
  includeFlowering: true,
  includeInactive: false,
  shouldFilterPlantedDateGt: false,
  shouldFilterPlantedDateLt: false,
});

export function addMaturePlantsReport({
  reportConfig,
  maturePlantsFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  maturePlantsFormFilters: IMaturePlantsReportFormFilters;
  fields: IFieldData[];
}) {
  const plantFilter: IPlantFilter = {};

  plantFilter.includeVegetative = maturePlantsFormFilters.includeVegetative;
  plantFilter.includeFlowering = maturePlantsFormFilters.includeFlowering;
  plantFilter.includeInactive = maturePlantsFormFilters.includeInactive;

  plantFilter.plantedDateGt = maturePlantsFormFilters.shouldFilterPlantedDateGt
    ? maturePlantsFormFilters.plantedDateGt
    : null;

  plantFilter.plantedDateLt = maturePlantsFormFilters.shouldFilterPlantedDateLt
    ? maturePlantsFormFilters.plantedDateLt
    : null;

  reportConfig[ReportType.MATURE_PLANTS] = {
    plantFilter,
    fields,
  };
}

export async function maybeLoadMaturePlantsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const maturePlantConfig = reportConfig[ReportType.MATURE_PLANTS];
  if (maturePlantConfig?.plantFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading plants...", level: "success" },
    });

    let maturePlants: IIndexedPlantData[] = [];

    if (maturePlantConfig.plantFilter.includeVegetative) {
      try {
        maturePlants = [...maturePlants, ...(await primaryDataLoader.vegetativePlants())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load vegetative plants.", level: "warning" },
        });
      }
    }

    if (maturePlantConfig.plantFilter.includeFlowering) {
      try {
        maturePlants = [...maturePlants, ...(await primaryDataLoader.floweringPlants())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load flowering plants.", level: "warning" },
        });
      }
    }

    if (maturePlantConfig.plantFilter.includeInactive) {
      try {
        maturePlants = [...maturePlants, ...(await primaryDataLoader.inactivePlants({}))];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load inactive plants.", level: "warning" },
        });
      }
    }

    maturePlants = maturePlants.filter((plant) => {
      if (maturePlantConfig.plantFilter.plantedDateLt) {
        if (plant.PlantedDate > maturePlantConfig.plantFilter.plantedDateLt) {
          return false;
        }
      }

      if (maturePlantConfig.plantFilter.plantedDateGt) {
        if (plant.PlantedDate < maturePlantConfig.plantFilter.plantedDateGt) {
          return false;
        }
      }

      return true;
    });

    reportData[ReportType.MATURE_PLANTS] = {
      maturePlants,
    };
  }
}
