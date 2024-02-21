import { MessageType } from "@/consts";
import { IIndexedTransferData, IPluginState, ISpreadsheet } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { todayIsodate } from "@/utils/date";
import { maybeLoadCogsReportData } from "@/utils/reports/cogs-report";
import { maybeLoadCogsTrackerReportData } from "@/utils/reports/cogs-tracker-report";
import {
  maybeLoadCogsV2ReportData,
  updateCogsV2MasterCostSheet
} from "@/utils/reports/cogs-v2-report";
import { maybeLoadEmployeeAuditReportData } from "@/utils/reports/employee-audit-report";
import { maybeLoadEmployeeSamplesReportData } from "@/utils/reports/employee-samples-report";
import { maybeLoadHarvestPackagesReportData } from "@/utils/reports/harvest-packages-report";
import { maybeLoadHarvestsReportData } from "@/utils/reports/harvests-report";
import { maybeLoadImmaturePlantsQuickviewReportData } from "@/utils/reports/immature-plants-quickview-report";
import { maybeLoadImmaturePlantsReportData } from "@/utils/reports/immature-plants-report";
import { maybeLoadIncomingManifestInventoryReportData } from "@/utils/reports/incoming-manifest-inventory";
import { maybeLoadIncomingTransferManifestsReportData } from "@/utils/reports/incoming-transfer-manifests-report";
import { maybeLoadIncomingTransfersReportData } from "@/utils/reports/incoming-transfers-report";
import { maybeLoadMaturePlantsQuickviewReportData } from "@/utils/reports/mature-plants-quickview-report";
import { maybeLoadMaturePlantsReportData } from "@/utils/reports/mature-plants-report";
import { maybeLoadOutgoingTransferManifestsReportData } from "@/utils/reports/outgoing-transfer-manifests-report";
import { maybeLoadOutgoingTransfersReportData } from "@/utils/reports/outgoing-transfers-report";
import { maybeLoadPackageReportData } from "@/utils/reports/package-report";
import { maybeLoadPackagesQuickviewReportData } from "@/utils/reports/packages-quickview-report";
import { maybeLoadPointInTimeInventoryReportData } from "@/utils/reports/point-in-time-inventory-report";
import { maybeLoadSingleTransferReportData } from "@/utils/reports/single-transfer-report";
import { maybeLoadStragglerPackageReportData } from "@/utils/reports/straggler-package-report";
import { maybeLoadTagsReportData } from "@/utils/reports/tags-report";
import { maybeLoadTransferHubTransfersReportData } from "@/utils/reports/transfer-hub-transfers-report";
import { getSimpleSpreadsheet } from "@/utils/sheets";
import {
  createCsvOrError,
  createSpreadsheetOrError,
  createXlsxOrError
} from "@/utils/sheets-export";
import _ from "lodash-es";
import { v4 as uuidv4 } from "uuid";
import { ActionContext } from "vuex";
import { ClientGetters } from "../client/consts";
import {
  IStatusMessage,
  ReportAuxTask, ReportsActions,
  ReportsGetters,
  ReportsMutations, ReportStatus,
  ReportType, SHEET_FIELDS
} from "./consts";
import { IReportConfig, IReportData, IReportOption, IReportsState } from "./interfaces";

const inMemoryState = {
  status: ReportStatus.INITIAL,
  statusMessage: null,
  statusMessageHistory: [],
  generatedSpreadsheet: null,
  selectedReports: [],
  fields: (() => {
    const fields = _.cloneDeep(SHEET_FIELDS);

    for (const key of Object.keys(fields)) {
      fields[key] = fields[key].filter((x) => x.initiallyChecked);
    }

    return fields;
  })(),
  reportFormFilters: {
    [ReportType.INCOMING_MANIFEST_INVENTORY]: {
      estimatedArrivalDateLt: todayIsodate(),
      estimatedArrivalDateGt: todayIsodate(),
      shouldFilterEstimatedArrivalDateLt: false,
      shouldFilterEstimatedArrivalDateGt: false,
      useExactTransferIds: [],
      allTransfers: [],
      selectedTransfers: [],
    },
  },
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
    [ReportsMutations.REPORTS_MUTATION](state: IReportsState, data: Partial<IReportsState>) {
      (Object.keys(data) as Array<keyof IReportsState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
    [ReportsMutations.UPDATE_SELECTED_REPORTS](
      state: IReportsState,
      data: { selectedReports: IReportOption[] }
    ) {
      for (const selectedReport of data.selectedReports) {
        if (selectedReport.isMultiSheet) {
          state.selectedReports = [selectedReport];
          return;
        }
      }

      state.selectedReports = data.selectedReports;
    },
    [ReportsMutations.CHECK_ALL](state: IReportsState, data: { reportType: ReportType }) {
      state.fields[data.reportType] = _.cloneDeep(SHEET_FIELDS[data.reportType]);
    },
    [ReportsMutations.UNCHECK_ALL](state: IReportsState, data: { reportType: ReportType }) {
      state.fields[data.reportType] = _.cloneDeep(SHEET_FIELDS[data.reportType]).filter(
        (x) => x.required
      );
    },
    [ReportsMutations.UPDATE_DYNAMIC_REPORT_DATA](
      state: IReportsState,
      data: {
        incomingTransfers: IIndexedTransferData[];
      }
    ) {
      state.reportFormFilters[ReportType.INCOMING_MANIFEST_INVENTORY].allTransfers =
        data.incomingTransfers;
    },
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
    [ReportsGetters.REPORT_OPTIONS]: (
      state: IReportsState,
      getters: any,
      rootState: IPluginState,
      rootGetters: any
    ) => {
      const reportOptions: IReportOption[] = [
        {
          text: "Test",
          value: ReportType.TEST,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: false,
          description: "Test report",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Packages",
          value: ReportType.PACKAGES,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All packages. Filter by type and date.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Point-in-time inventory",
          value: ReportType.POINT_IN_TIME_INVENTORY,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All active packages on a certain date.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: true,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Plant Batches",
          value: ReportType.IMMATURE_PLANTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All plant batches. Filter by planted date.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Mature Plants",
          value: ReportType.MATURE_PLANTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All mature plants. Filter by growth phase and planted date",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Incoming Transfers",
          value: ReportType.INCOMING_TRANSFERS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All incoming transfers. Filter by wholesale and ETA",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Outgoing Transfers",
          value: ReportType.OUTGOING_TRANSFERS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All outgoing transfers. Filter by wholesale and ETD",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        // Disabled - Destinations returns 0, more like incoming?
        // {
        //   text: "Hub Transfers",
        //   value: ReportType.TRANSFER_HUB_TRANSFERS,
        //
        //   enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
        //   description: "Filter by estimated time of departure",
        //   isCustom: false,
        // },
        {
          text: "Tags",
          value: ReportType.TAGS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All tags. Filter by status and tag type.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Harvests",
          value: ReportType.HARVESTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All harvests. Filter by status and harvest date.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: false,
          isCatalog: true,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Incoming Transfer Manifests",
          value: ReportType.INCOMING_TRANSFER_MANIFESTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Full transfer and package data for all incoming transfers.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: true,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Outgoing Transfer Manifests",
          value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Full transfer and package data for all outgoing transfers.",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: true,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Straggler Inventory",
          value: ReportType.STRAGGLER_PACKAGES,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Find old and empty inventory",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: true,
          isSpecialty: true,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Employee Activity",
          value: ReportType.EMPLOYEE_AUDIT,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "View all employee activity in Metrc",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: true,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "COGS",
          value: ReportType.COGS_V2,
          enabled: !!rootState.client.values.ENABLE_COGS,
          visible: !!rootState.client.values.ENABLE_COGS,
          description: "Generate COGS calculator",
          isCustom: true,
          usesFormulas: true,
          isMultiSheet: true,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "COGS Tracker",
          value: ReportType.COGS_TRACKER,
          enabled: !!rootState.client.values.ENABLE_COGS_TRACKER,
          visible: !!rootState.client.values.ENABLE_COGS_TRACKER,
          description: "Generate COGS Tracker sheets",
          isCustom: true,
          usesFormulas: true,
          isMultiSheet: true,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Employee Samples",
          value: ReportType.EMPLOYEE_SAMPLES,
          enabled: !!rootState.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
          visible: !!rootState.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
          description: "Generate summary of employee samples",
          isCustom: true,
          usesFormulas: true,
          isMultiSheet: true,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Harvest Packages",
          value: ReportType.HARVEST_PACKAGES,
          enabled: !!rootState.client.values.ENABLE_HARVEST_PACKAGES,
          visible: !!rootState.client.values.ENABLE_HARVEST_PACKAGES,
          description: "Generate summary of harvest packages",
          usesFieldTransformer: false,
          usesFormulas: false,
          isMultiSheet: false,
          isCustom: true,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Incoming Manifest Inventory",
          value: ReportType.INCOMING_MANIFEST_INVENTORY,
          enabled: !!rootState.client.values.ENABLE_INCOMING_MANIFEST_INVENTORY,
          visible: !!rootState.client.values.ENABLE_INCOMING_MANIFEST_INVENTORY,
          description: "Generate summary of incoming manifests for inventory checks",
          usesFieldTransformer: true,
          usesFormulas: false,
          isMultiSheet: false,
          isCustom: true,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
        {
          text: "Packages Quickview",
          value: ReportType.PACKAGES_QUICKVIEW,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Grouped summary of packages by item, location, and dates",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: true,
          isHeadless: false,
        },
        {
          text: "Plant Batch Quickview",
          value: ReportType.IMMATURE_PLANTS_QUICKVIEW,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Grouped summary of plant batches by strain, location, and dates",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: true,
          isHeadless: false,
        },
        {
          text: "Mature Plants Quickview",
          value: ReportType.MATURE_PLANTS_QUICKVIEW,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description:
            "Grouped summary of mature plants by growth phase, strain, location, and dates",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: true,
          isHeadless: false,
        },
        {
          text: "Transfer Quickview",
          value: null,
          enabled: false,
          visible: true,
          description: "Summary of incoming, outgoing, and rejected packages",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: true,
          isHeadless: false,
        },
        // {
        //   text: "Incoming Inventory",
        //   value: null,
        //
        //   enabled: false,
        //   description: "See packages not yet recieved",
        //   isCustom: false,
        // },
        // {
        //   text: "Harvested Plants",
        //   value: null,
        //
        //   enabled: false,
        //   description: "All plants and associated harvest data within this license",
        //   isCustom: false,
        // },
        {
          text: "Single Transfer",
          value: ReportType.SINGLE_TRANSFER,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: false,
          description: "Single transfer",
          isCustom: false,
          usesFormulas: false,
          isMultiSheet: false,
          usesFieldTransformer: false,
          isSpecialty: false,
          isCatalog: false,
          isQuickview: false,
          isHeadless: false,
        },
      ];

      return reportOptions;
    },
  },
  actions: {
    [ReportsActions.UPDATE_DYNAMIC_REPORT_DATA]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      data: { reportType: ReportType }
    ) => {
      switch (data.reportType) {
        case ReportType.INCOMING_MANIFEST_INVENTORY:
          let incomingTransfers: IIndexedTransferData[] = [];
          try {
            incomingTransfers = await primaryDataLoader.incomingTransfers();
          } catch {}

          ctx.commit(ReportsMutations.UPDATE_DYNAMIC_REPORT_DATA, {
            incomingTransfers,
          });
          break;
      }
    },
    [ReportsActions.RESET]: async (ctx: ActionContext<IReportsState, IPluginState>, data: any) => {
      ctx.commit(ReportsMutations.SET_STATUS, {
        status: ReportStatus.INITIAL,
        statusMessage: null,
      });
      ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet: null });
    },
    [ReportsActions.RUN_AUX_REPORT_TASK]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      { auxTask, reportConfig }: { auxTask: ReportAuxTask; reportConfig: IReportConfig }
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
    [ReportsActions.CHECK_ALL]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      data: { reportType: ReportType }
    ) => {
      ctx.commit(ReportsMutations.CHECK_ALL, data);
    },
    [ReportsActions.UNCHECK_ALL]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      data: { reportType: ReportType }
    ) => {
      ctx.commit(ReportsMutations.UNCHECK_ALL, data);
    },
    [ReportsActions.GENERATE_REPORT]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      { reportConfig }: { reportConfig: IReportConfig }
    ) => {
      analyticsManager.track(MessageType.GENERATED_SPREADSHEET, reportConfig);

      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INFLIGHT });

      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Setting things up...", level: "success" },
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
        await maybeLoadIncomingTransferManifestsReportData({ ctx, reportData, reportConfig });
        await maybeLoadIncomingManifestInventoryReportData({ ctx, reportData, reportConfig });
        await maybeLoadOutgoingTransferManifestsReportData({ ctx, reportData, reportConfig });
        await maybeLoadEmployeeSamplesReportData({ ctx, reportData, reportConfig });
        await maybeLoadHarvestPackagesReportData({ ctx, reportData, reportConfig });
        await maybeLoadEmployeeAuditReportData({ ctx, reportData, reportConfig });
        await maybeLoadPointInTimeInventoryReportData({ ctx, reportData, reportConfig });
        await maybeLoadSingleTransferReportData({ ctx, reportData, reportConfig });

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Generating report...", level: "success" },
        });

        console.log({ reportData, reportConfig });

        if (reportConfig.exportFormat === "CSV") {
          await createCsvOrError({ reportData, reportConfig });
        } else if (reportConfig.exportFormat === "XLSX") {
          await createXlsxOrError({ reportData, reportConfig });
        } else {
          const spreadsheet: ISpreadsheet = await createSpreadsheetOrError({
            reportData,
            reportConfig,
          });

          ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet });

          switch (reportConfig.fileDeliveryFormat) {
            case "OPEN_LINK":
              window.open(spreadsheet.spreadsheetUrl, "_blank");
              break;

            default:
              throw new Error(`Invalid file delivery format: ${reportConfig.fileDeliveryFormat}`);
          }
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
