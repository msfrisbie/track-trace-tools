import { IIndexedPlantData, IPlantFilter, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import {
  IMaturePlantsReportFormFilters,
  maturePlantsFormFiltersFactory,
} from "./mature-plants-report";

const REPORT_TYPE = ReportType.MATURE_PLANTS_QUICKVIEW;

export enum MaturePlantQuickviewDimension {
  STRAIN = "Strain",
  GROWTH_PHASE = "Growth Phase",
  LOCATION = "Location",
  PLANTED_DATE = "Planted Date",
  VEGETATIVE_DATE = "Vegetative Date",
  FLOWERING_DATE = "Flowering Date",
}

export const MATURE_PLANT_QUICKVIEW_DIMENSIONS: MaturePlantQuickviewDimension[] = [
  MaturePlantQuickviewDimension.STRAIN,
  MaturePlantQuickviewDimension.GROWTH_PHASE,
  MaturePlantQuickviewDimension.LOCATION,
  MaturePlantQuickviewDimension.PLANTED_DATE,
  MaturePlantQuickviewDimension.VEGETATIVE_DATE,
  MaturePlantQuickviewDimension.FLOWERING_DATE,
];

export function extractMaturePlantPropertyFromDimension(
  plant: IIndexedPlantData,
  dimension: MaturePlantQuickviewDimension
) {
  switch (dimension) {
    case MaturePlantQuickviewDimension.STRAIN:
      return plant.StrainName;
    case MaturePlantQuickviewDimension.GROWTH_PHASE:
      return plant.GrowthPhaseName;
    case MaturePlantQuickviewDimension.LOCATION:
      return plant.LocationName;
    case MaturePlantQuickviewDimension.PLANTED_DATE:
      return plant.PlantedDate;
    case MaturePlantQuickviewDimension.VEGETATIVE_DATE:
      return plant.VegetativeDate;
    case MaturePlantQuickviewDimension.FLOWERING_DATE:
      return plant.FloweringDate;
    default:
      throw new Error("Bad dimension");
  }
}

interface IMaturePlantsQuickviewReportFormFilters extends IMaturePlantsReportFormFilters {
  primaryDimension: MaturePlantQuickviewDimension;
  secondaryDimension: MaturePlantQuickviewDimension | null;
}

export const maturePlantsQuickviewFormFiltersFactory: () => IMaturePlantsQuickviewReportFormFilters =
  () => ({
    // @ts-ignore
    primaryDimension: MaturePlantQuickviewDimension.STRAIN,
    // @ts-ignore
    secondaryDimension: MaturePlantQuickviewDimension.LOCATION,
    ...maturePlantsFormFiltersFactory(),
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

  reportConfig[REPORT_TYPE] = {
    plantFilter,
    ...maturePlantsQuickviewFormFilters,
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
  const maturePlantQuickviewConfig = reportConfig[REPORT_TYPE]!;

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading plants...", level: "success" },
  });

  let maturePlants: IIndexedPlantData[] = [];
  if (maturePlantQuickviewConfig?.plantFilter) {
    if (maturePlantQuickviewConfig?.plantFilter.includeVegetative) {
      try {
        maturePlants = [...maturePlants, ...(await primaryDataLoader.vegetativePlants())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load vegetative plants.", level: "warning" },
        });
      }
    }

    if (maturePlantQuickviewConfig.plantFilter.includeFlowering) {
      try {
        maturePlants = [...maturePlants, ...(await primaryDataLoader.floweringPlants())];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load flowering plants.", level: "warning" },
        });
      }
    }

    if (maturePlantQuickviewConfig.plantFilter.includeInactive) {
      try {
        maturePlants = [...maturePlants, ...(await primaryDataLoader.inactivePlants({}))];
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Failed to load inactive plants.", level: "warning" },
        });
      }
    }
  }

  maturePlants = maturePlants.filter((plant) => {
    if (maturePlantQuickviewConfig.plantFilter.plantedDateLt) {
      if (plant.PlantedDate > maturePlantQuickviewConfig.plantFilter.plantedDateLt) {
        return false;
      }
    }

    if (maturePlantQuickviewConfig.plantFilter.plantedDateGt) {
      if (plant.PlantedDate < maturePlantQuickviewConfig.plantFilter.plantedDateGt) {
        return false;
      }
    }

    return true;
  });

  reportData[REPORT_TYPE] = {
    maturePlants,
  };
}
