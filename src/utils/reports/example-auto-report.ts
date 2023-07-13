import { IPluginState } from "@/interfaces";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";

interface IExampleReportFormFilters {
  // plantedDateGt: string;
  // plantedDateLt: string;
  // includeVegetative: boolean;
  // includeFlowering: boolean;
  // includeInactive: boolean;
  // shouldFilterPlantedDateGt: boolean;
  // shouldFilterPlantedDateLt: boolean;
}

export const exampleFormFiltersFactory: () => IExampleReportFormFilters = () => ({
  // plantedDateGt: todayIsodate(),
  // plantedDateLt: todayIsodate(),
  // includeVegetative: true,
  // includeFlowering: true,
  // includeInactive: false,
  // shouldFilterPlantedDateGt: false,
  // shouldFilterPlantedDateLt: false,
});

export function addExampleReport({
  reportConfig,
  exampleFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  exampleFormFilters: IExampleReportFormFilters;
  fields: IFieldData[];
}) {
  const exampleFilter = {};
  // const plantFilter: IPlantFilter = {};

  // plantFilter.includeVegetative = exampleFormFilters.includeVegetative;

  // plantFilter.plantedDateGt = exampleFormFilters.shouldFilterPlantedDateGt
  //   ? exampleFormFilters.plantedDateGt
  //   : null;

  reportConfig[ReportType.TEST] = {
    exampleFilter,
    fields,
  };
}

export async function maybeLoadExampleReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const exampleConfig = reportConfig[ReportType.TEST];
  if (exampleConfig?.exampleFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading example data...", level: "success" },
    });

    let exampleData: any[] = [];

    // if (exampleConfig.plantFilter.includeVegetative) {
    //   try {
    //     example = [...example, ...(await primaryDataLoader.vegetativePlants())];
    //   } catch (e) {
    //     ctx.commit(ReportsMutations.SET_STATUS, {
    //       statusMessage: { text: "Failed to load vegetative plants.", level: "warning" },
    //     });
    //   }
    // }

    exampleData = exampleData.filter((x) => {
      // if (exampleConfig.plantFilter.plantedDateGt) {
      //   if (plant.PlantedDate < exampleConfig.plantFilter.plantedDateGt) {
      //     return false;
      //   }
      // }
      // return true;
    });

    reportData[ReportType.TEST] = {
      exampleData,
    };
  }
}
