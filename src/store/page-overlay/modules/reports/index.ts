import { MessageType } from '@/consts';
import { IPluginState, ISpreadsheet } from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { maybeLoadCogsReportData } from '@/utils/reports/cogs-report';
import { maybeLoadCogsTrackerReportData } from '@/utils/reports/cogs-tracker-report';
import {
  maybeLoadCogsV2ReportData,
  updateCogsV2MasterCostSheet
} from '@/utils/reports/cogs-v2-report';
import { maybeLoadEmployeeAuditReportData } from '@/utils/reports/employee-audit-report';
import { maybeLoadEmployeeSamplesReportData } from '@/utils/reports/employee-samples-report';
import { maybeLoadHarvestPackagesReportData } from '@/utils/reports/harvest-packages-report';
import { maybeLoadHarvestsReportData } from '@/utils/reports/harvests-report';
import { maybeLoadImmaturePlantsQuickviewReportData } from '@/utils/reports/immature-plants-quickview-report';
import { maybeLoadImmaturePlantsReportData } from '@/utils/reports/immature-plants-report';
import { maybeLoadIncomingTransfersReportData } from '@/utils/reports/incoming-transfers-report';
import { maybeLoadMaturePlantsQuickviewReportData } from '@/utils/reports/mature-plants-quickview-report';
import { maybeLoadMaturePlantsReportData } from '@/utils/reports/mature-plants-report';
import { maybeLoadOutgoingTransferManifestsReportData } from '@/utils/reports/outgoing-transfer-manifests-report';
import { maybeLoadOutgoingTransfersReportData } from '@/utils/reports/outgoing-transfers-report';
import { maybeLoadPackageReportData } from '@/utils/reports/package-report';
import { maybeLoadPackagesQuickviewReportData } from '@/utils/reports/packages-quickview-report';
import { maybeLoadPointInTimeInventoryReportData } from '@/utils/reports/point-in-time-inventory-report';
import { maybeLoadSingleTransferReportData } from '@/utils/reports/single-transfer-report';
import { maybeLoadStragglerPackageReportData } from '@/utils/reports/straggler-package-report';
import { maybeLoadTagsReportData } from '@/utils/reports/tags-report';
import { maybeLoadTransferHubTransfersReportData } from '@/utils/reports/transfer-hub-transfers-report';
import { getSimpleSpreadsheet } from '@/utils/sheets';
import { createCsvOrError, createSpreadsheetOrError } from '@/utils/sheets-export';
import { v4 as uuidv4 } from 'uuid';
import { ActionContext } from 'vuex';
import {
  IStatusMessage,
  ReportAuxTask,
  ReportsActions,
  ReportsMutations,
  ReportStatus
} from './consts';
import { IReportConfig, IReportData, IReportsState } from './interfaces';

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
      }: { status?: ReportStatus; statusMessage?: IStatusMessage; prependMessage?: boolean },
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
      { spreadsheet }: { spreadsheet: ISpreadsheet | null },
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
  getters: {},
  actions: {
    [ReportsActions.RESET]: async (ctx: ActionContext<IReportsState, IPluginState>, data: any) => {
      ctx.commit(ReportsMutations.SET_STATUS, {
        status: ReportStatus.INITIAL,
        statusMessage: null,
      });
      ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet: null });
    },
    [ReportsActions.RUN_AUX_REPORT_TASK]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      { auxTask, reportConfig }: { auxTask: ReportAuxTask; reportConfig: IReportConfig },
    ) => {
      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INFLIGHT });

      try {
        switch (auxTask) {
          case ReportAuxTask.UPDATE_MASTER_COST_SHEET:
            await updateCogsV2MasterCostSheet({ ctx, reportConfig });
            break;
          default:
            throw new Error(`Bad aux task: ${auxTask}`);
        }
      } finally {
        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.INITIAL,
        });
      }
    },
    [ReportsActions.GENERATE_REPORT]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      { reportConfig }: { reportConfig: IReportConfig },
    ) => {
      analyticsManager.track(MessageType.GENERATED_SPREADSHEET, reportConfig);

      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INFLIGHT });

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: 'Setting things up...', level: 'success' },
      });

      try {
        const reportData: IReportData = {};

        await maybeLoadPackageReportData({ ctx, reportData, reportConfig });
        await maybeLoadCogsReportData({ ctx, reportData, reportConfig });
        await maybeLoadCogsV2ReportData({ ctx, reportData, reportConfig });
        await maybeLoadCogsTrackerReportData({ ctx, reportData, reportConfig });
        await maybeLoadStragglerPackageReportData({ ctx, reportData, reportConfig });
        await maybeLoadImmaturePlantsReportData({ ctx, reportData, reportConfig });
        await maybeLoadHarvestsReportData({ ctx, reportData, reportConfig });
        await maybeLoadTagsReportData({ ctx, reportData, reportConfig });
        await maybeLoadMaturePlantsReportData({ ctx, reportData, reportConfig });
        await maybeLoadPackagesQuickviewReportData({ ctx, reportData, reportConfig });
        await maybeLoadMaturePlantsQuickviewReportData({ ctx, reportData, reportConfig });
        await maybeLoadImmaturePlantsQuickviewReportData({ ctx, reportData, reportConfig });
        await maybeLoadIncomingTransfersReportData({ ctx, reportData, reportConfig });
        await maybeLoadOutgoingTransfersReportData({ ctx, reportData, reportConfig });
        await maybeLoadTransferHubTransfersReportData({ ctx, reportData, reportConfig });
        await maybeLoadOutgoingTransferManifestsReportData({ ctx, reportData, reportConfig });
        await maybeLoadEmployeeSamplesReportData({ ctx, reportData, reportConfig });
        await maybeLoadHarvestPackagesReportData({ ctx, reportData, reportConfig });
        await maybeLoadEmployeeAuditReportData({ ctx, reportData, reportConfig });
        await maybeLoadPointInTimeInventoryReportData({ ctx, reportData, reportConfig });
        await maybeLoadSingleTransferReportData({ ctx, reportData, reportConfig });

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: 'Generating report...', level: 'success' },
        });

        console.log({ reportData, reportConfig });

        if (reportConfig.exportFormat === 'CSV') {
          await createCsvOrError({ reportData, reportConfig });
        } else {
          const spreadsheet: ISpreadsheet = await createSpreadsheetOrError({
            reportData,
            reportConfig,
          });

          ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet });

          window.open(spreadsheet.spreadsheetUrl, '_blank');
        }

        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.SUCCESS,
          statusMessage: null,
        });
        analyticsManager.track(MessageType.GENERATED_SPREADSHEET_SUCCESS);
      } catch (e) {
        console.error((e as Error).stack);

        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.ERROR,
          // @ts-ignore
          statusMessage: `${e.toString()}
          
          ${(e as Error).stack}`,
        });

        // @ts-ignore
        analyticsManager.track(MessageType.GENERATED_SPREADSHEET_ERROR, { error: e.toString() });

        throw e;
      }
    },
  },
};

export const reportsReducer = (state: IReportsState): IReportsState => ({
  ...state,
  ...inMemoryState,
});
