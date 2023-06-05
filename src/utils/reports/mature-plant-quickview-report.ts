import { IIndexedPlantData, IPlantFilter, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";

interface IMaturePlantsQuickviewReportFormFilters {
  plantedDateGt: string;
  plantedDateLt: string;
  includeVegetative: boolean;
  includeFlowering: boolean;
  includeInactive: boolean;
  shouldFilterPlantedDateGt: boolean;
  shouldFilterPlantedDateLt: boolean;
  primaryDimension: string | null;
  secondaryDimension: string | null;
}

export const maturePlantsQuickviewFormFiltersFactory: () => IMaturePlantsQuickviewReportFormFilters =
  () => ({
    plantedDateGt: todayIsodate(),
    plantedDateLt: todayIsodate(),
    includeVegetative: true,
    includeFlowering: true,
    includeInactive: false,
    shouldFilterPlantedDateGt: false,
    shouldFilterPlantedDateLt: false,
    primaryDimension: null,
    secondaryDimension: null,
  });

export function addMaturePlantsQuickviewReport({
  reportConfig,
  maturePlantsQuickviewFormFilters,
}: {
  reportConfig: IReportConfig;
  maturePlantsQuickviewFormFilters: IMaturePlantsQuickviewReportFormFilters;
}) {
  const plantFilter: IPlantFilter = {};

  plantFilter.includeVegetative = maturePlantsQuickviewFormFilters.includeVegetative;
  plantFilter.includeFlowering = maturePlantsQuickviewFormFilters.includeFlowering;
  plantFilter.includeInactive = maturePlantsQuickviewFormFilters.includeInactive;

  plantFilter.plantedDateGt = maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt
    ? maturePlantsQuickviewFormFilters.plantedDateGt
    : null;

  plantFilter.plantedDateLt = maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt
    ? maturePlantsQuickviewFormFilters.plantedDateLt
    : null;

  const { primaryDimension, secondaryDimension } = maturePlantsQuickviewFormFilters;

  if (!primaryDimension) {
    throw new Error("Must provide primary dimension");
  }

  reportConfig[ReportType.MATURE_PLANTS_QUICKVIEW] = {
    plantFilter,
    primaryDimension,
    secondaryDimension,
    fields: null,
  };
}

export async function maybeLoadMaturePlantsQuickviewReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const maturePlantConfig = reportConfig[ReportType.MATURE_PLANTS_QUICKVIEW];
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

    reportData[ReportType.MATURE_PLANTS_QUICKVIEW] = {
      maturePlants,
    };
  }
}
