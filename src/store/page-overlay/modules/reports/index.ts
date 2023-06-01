import { MessageType } from "@/consts";
import { IPluginState, ISpreadsheet } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { maybeLoadCogsReportData } from "@/utils/reports/cogs-report";
import { maybeLoadHarvestsReportData } from "@/utils/reports/harvests-report";
import { maybeLoadImmaturePlantsReportData } from "@/utils/reports/immature-plants-report";
import { maybeLoadIncomingTransfersReportData } from "@/utils/reports/incoming-transfers-report";
import { maybeLoadMaturePlantsReportData } from "@/utils/reports/mature-plants-report";
import { maybeLoadOutgoingTransferManifestsReportData } from "@/utils/reports/outgoing-transfer-manifests-report";
import { maybeLoadOutgoingTransfersReportData } from "@/utils/reports/outgoing-transfers-report";
import { maybeLoadPackageReportData } from "@/utils/reports/package-report";
import { maybeLoadStragglerPackageReportData } from "@/utils/reports/straggler-package-report";
import { maybeLoadTagsReportData } from "@/utils/reports/tags-report";
import { getSimpleSpreadsheet } from "@/utils/sheets";
import { createSpreadsheetOrError } from "@/utils/sheets-export";
import { v4 as uuidv4 } from "uuid";
import { ActionContext } from "vuex";
import {
  IStatusMessage,
  ReportsActions,
  ReportsGetters,
  ReportsMutations,
  ReportStatus,
} from "./consts";
import { IReportConfig, IReportData, IReportsState } from "./interfaces";

const inMemoryState = {
  status: ReportStatus.INITIAL,
  statusMessage: null,
  statusMessageHistory: [],
  generatedSpreadsheet: null,
};

const persistedState = {
  generatedSpreadsheetHistory: [],
};

const defaultState: IReportsState = {
  ...inMemoryState,
  ...persistedState,
};

export const reportsModule = {
  state: () => defaultState,
  mutations: {
    [ReportsMutations.SET_STATUS](
      state: IReportsState,
      {
        status,
        statusMessage,
        prependMessage = true,
      }: { status?: ReportStatus; statusMessage?: IStatusMessage; prependMessage?: boolean }
    ) {
      if (status) {
        state.status = status;

        if (status === ReportStatus.INITIAL) {
          state.statusMessageHistory = [];
        }
      }

      if (statusMessage) {
        if (state.statusMessage && prependMessage) {
          state.statusMessageHistory = [state.statusMessage, ...state.statusMessageHistory];
        }

        state.statusMessage = statusMessage;
      }
    },
    [ReportsMutations.SET_GENERATED_SPREADSHEET](
      state: IReportsState,
      { spreadsheet }: { spreadsheet: ISpreadsheet | null }
    ) {
      state.generatedSpreadsheet = spreadsheet;

      if (spreadsheet) {
        state.generatedSpreadsheetHistory = [
          {
            uuid: uuidv4(),
            timestamp: new Date().toISOString(),
            spreadsheet: getSimpleSpreadsheet(spreadsheet),
          },
          ...state.generatedSpreadsheetHistory,
        ];
      }
    },
  },
  getters: {
    [ReportsGetters.EXAMPLE_GETTER]: (
      state: IReportsState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [ReportsActions.EXAMPLE_ACTION]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      data: any
    ) => {
      ctx.commit(ReportsMutations.EXAMPLE_MUTATION, data);
    },
    [ReportsActions.RESET]: async (ctx: ActionContext<IReportsState, IPluginState>, data: any) => {
      ctx.commit(ReportsMutations.SET_STATUS, {
        status: ReportStatus.INITIAL,
        statusMessage: null,
      });
      ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet: null });
    },
    [ReportsActions.GENERATE_SPREADSHEET]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      { reportConfig }: { reportConfig: IReportConfig }
    ) => {
      analyticsManager.track(MessageType.GENERATED_SPREADSHEET, reportConfig);

      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INFLIGHT });

      try {
        let reportData: IReportData = {};

        await maybeLoadPackageReportData({ ctx, reportData, reportConfig });
        await maybeLoadCogsReportData({ ctx, reportData, reportConfig });
        await maybeLoadStragglerPackageReportData({ ctx, reportData, reportConfig });
        await maybeLoadImmaturePlantsReportData({ ctx, reportData, reportConfig });
        await maybeLoadHarvestsReportData({ ctx, reportData, reportConfig });
        await maybeLoadTagsReportData({ ctx, reportData, reportConfig });
        await maybeLoadMaturePlantsReportData({ ctx, reportData, reportConfig });
        await maybeLoadIncomingTransfersReportData({ ctx, reportData, reportConfig });
        await maybeLoadOutgoingTransfersReportData({ ctx, reportData, reportConfig });
        await maybeLoadOutgoingTransferManifestsReportData({ ctx, reportData, reportConfig });

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Generating spreadsheet...", level: "success" },
        });

        console.log({ reportData, reportConfig });

        const spreadsheet: ISpreadsheet = await createSpreadsheetOrError({
          reportData,
          reportConfig,
        });

        ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet });

        window.open(spreadsheet.spreadsheetUrl, "_blank");

        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.SUCCESS,
          statusMessage: null,
        });
        analyticsManager.track(MessageType.GENERATED_SPREADSHEET_SUCCESS);
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.ERROR,
          // @ts-ignore
          statusMessage: e.toString(),
        });

        // @ts-ignore
        analyticsManager.track(MessageType.GENERATED_SPREADSHEET_ERROR, { error: e.toString() });
      }
    },
  },
};

export const reportsReducer = (state: IReportsState): IReportsState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
