import { IPluginState } from '@/interfaces';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';

interface IScanSheetReportFormFilters {
  // plantedDateGt: string;
  // plantedDateLt: string;
  // includeVegetative: boolean;
  // includeFlowering: boolean;
  // includeInactive: boolean;
  // shouldFilterPlantedDateGt: boolean;
  // shouldFilterPlantedDateLt: boolean;
}

export const scanSheetFormFiltersFactory: () => IScanSheetReportFormFilters = () => ({
  // plantedDateGt: todayIsodate(),
  // plantedDateLt: todayIsodate(),
  // includeVegetative: true,
  // includeFlowering: true,
  // includeInactive: false,
  // shouldFilterPlantedDateGt: false,
  // shouldFilterPlantedDateLt: false,
});

export function addScanSheetReport({
  reportConfig,
  scanSheetFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  scanSheetFormFilters: IScanSheetReportFormFilters;
  fields: IFieldData[];
}) {
  const scanSheetFilter = {};
  // const plantFilter: IPlantFilter = {};

  // plantFilter.includeVegetative = scanSheetFormFilters.includeVegetative;

  // plantFilter.plantedDateGt = scanSheetFormFilters.shouldFilterPlantedDateGt
  //   ? scanSheetFormFilters.plantedDateGt
  //   : null;

  reportConfig[ReportType.SCAN_SHEET] = {
    scanSheetFilter,
    fields: null,
  };
}

export async function maybeLoadScanSheetReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const scanSheetConfig = reportConfig[ReportType.SCAN_SHEET];
  if (scanSheetConfig?.scanSheetFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Loading scanSheet data...', level: 'success' },
    });

    const scanSheetData: {
        richOutgoingTransfers?: IIndexedRichOutgoingTransferData[];
        richIncomingTransfers?: IIndexedRichIncomingTransferData[];
    } = {};

    // if (scanSheetConfig.plantFilter.includeVegetative) {
    //   try {
    //     scanSheet = [...scanSheet, ...(await primaryDataLoader.vegetativePlants())];
    //   } catch (e) {
    //     ctx.commit(ReportsMutations.SET_STATUS, {
    //       statusMessage: { text: "Failed to load vegetative plants.", level: "warning" },
    //     });
    //   }
    // }

    // scanSheetData = scanSheetData.filter((x) => {
    //   // if (scanSheetConfig.plantFilter.plantedDateGt) {
    //   //   if (plant.PlantedDate < scanSheetConfig.plantFilter.plantedDateGt) {
    //   //     return false;
    //   //   }
    //   // }
    //   // return true;
    // });

    reportData[ReportType.SCAN_SHEET] = {
      scanSheetData,
    };
  }
}
