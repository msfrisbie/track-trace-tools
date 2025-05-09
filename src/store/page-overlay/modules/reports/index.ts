import { AnalyticsEvent } from "@/consts";
import {
  IIndexedIncomingTransferData,
  IIndexedOutgoingTransferData,
  IIndexedTransferData,
  IPluginState,
  ISpreadsheet,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { todayIsodate } from "@/utils/date";
import { maybeLoadCogsReportData } from "@/utils/reports/cogs-report";
import { maybeLoadCogsTrackerReportData } from "@/utils/reports/cogs-tracker-report";
import {
  maybeLoadCogsV2ReportData,
  updateCogsV2MasterCostSheet,
} from "@/utils/reports/cogs-v2-report";
import { maybeLoadEmployeeAuditReportData } from "@/utils/reports/employee-audit-report";
import { maybeLoadEmployeePermissionsReportData } from "@/utils/reports/employee-permissions-report";
import { maybeLoadEmployeeSamplesReportData } from "@/utils/reports/employee-samples-report";
import { maybeLoadHarvestPackagesReportData } from "@/utils/reports/harvest-packages-report";
import { maybeLoadHarvestsReportData } from "@/utils/reports/harvests-report";
import { maybeLoadImmaturePlantsQuickviewReportData } from "@/utils/reports/immature-plants-quickview-report";
import { maybeLoadImmaturePlantsReportData } from "@/utils/reports/immature-plants-report";
import { maybeLoadIncomingManifestInventoryReportData } from "@/utils/reports/incoming-manifest-inventory";
import { maybeLoadIncomingTransferManifestsReportData } from "@/utils/reports/incoming-transfer-manifests-report";
import { maybeLoadIncomingTransfersReportData } from "@/utils/reports/incoming-transfers-report";
import { maybeLoadInvoiceReportData } from "@/utils/reports/invoice-report";
import { maybeLoadItemsMetadataReportData } from "@/utils/reports/items-metadata-report";
import { maybeLoadLabResultsReportData } from "@/utils/reports/lab-results-report";
import { maybeLoadMaturePlantsQuickviewReportData } from "@/utils/reports/mature-plants-quickview-report";
import { maybeLoadMaturePlantsReportData } from "@/utils/reports/mature-plants-report";
import { maybeLoadOutgoingTransferManifestsReportData } from "@/utils/reports/outgoing-transfer-manifests-report";
import { maybeLoadOutgoingTransfersReportData } from "@/utils/reports/outgoing-transfers-report";
import { maybeLoadPackageReportData } from "@/utils/reports/package-report";
import { maybeLoadPackagesQuickviewReportData } from "@/utils/reports/packages-quickview-report";
import { maybeLoadPointInTimeInventoryReportData } from "@/utils/reports/point-in-time-inventory-report";
import { maybeLoadScanSheetReportData } from "@/utils/reports/scan-sheet-report";
import { maybeLoadSingleTransferReportData } from "@/utils/reports/single-transfer-report";
import { maybeLoadStragglerPackageReportData } from "@/utils/reports/straggler-package-report";
import { maybeLoadTagsReportData } from "@/utils/reports/tags-report";
import { maybeLoadTransferHubTransfersReportData } from "@/utils/reports/transfer-hub-transfers-report";
import { getSimpleSpreadsheet } from "@/utils/sheets";
import {
  createCsvOrError,
  createGoogleDocsSpreadsheetOrError,
  createXlsxOrError,
} from "@/utils/sheets-export";
import _ from "lodash-es";
import { v4 as uuidv4 } from "uuid";
import { ActionContext } from "vuex";
import { ClientGetters } from "../client/consts";
import {
  IStatusMessage,
  ReportAuxTask,
  ReportCategory,
  ReportsActions,
  ReportsGetters,
  ReportsMutations,
  ReportStatus,
  ReportType,
  SHEET_FIELDS,
} from "./consts";
import { IReportConfig, IReportData, IReportOption, IReportsState } from "./interfaces";

const inMemoryState = {
  status: ReportStatus.INITIAL,
  statusMessage: null,
  statusMessageHistory: [],
  generatedSpreadsheet: null,
  selectedReports: [],
  allFields: SHEET_FIELDS,
  selectedFields: (() => {
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
      allTransfers: [],
      selectedTransfers: [],
    },
    [ReportType.SCAN_SHEET]: {
      allIncomingTransfers: [],
      selectedIncomingTransfers: [],
      allOutgoingTransfers: [],
      selectedOutgoingTransfers: [],
      allRejectedTransfers: [],
      selectedRejectedTransfers: [],
    },
    [ReportType.INVOICE]: {
      allOutgoingTransfers: [],
      selectedOutgoingTransfer: null,
    }
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
        if (selectedReport.requiresGoogleSheets || selectedReport.disableMultiReport) {
          state.selectedReports = [selectedReport];
          return;
        }
      }

      state.selectedReports = data.selectedReports;
    },
    [ReportsMutations.CHECK_ALL](state: IReportsState, data: { reportType: ReportType }) {
      state.selectedFields[data.reportType] = _.cloneDeep(SHEET_FIELDS[data.reportType]);
    },
    [ReportsMutations.UNCHECK_ALL](state: IReportsState, data: { reportType: ReportType }) {
      state.selectedFields[data.reportType] = _.cloneDeep(SHEET_FIELDS[data.reportType]).filter(
        (x) => x.required
      );
    },
    [ReportsMutations.UPDATE_DYNAMIC_REPORT_DATA](
      state: IReportsState,
      data: Partial<{
        incomingTransfers: IIndexedIncomingTransferData[];
        outgoingTransfers: IIndexedOutgoingTransferData[];
        rejectedTransfers: IIndexedIncomingTransferData[];
      }>
    ) {
      if (data.incomingTransfers) {
        state.reportFormFilters[ReportType.INCOMING_MANIFEST_INVENTORY].allTransfers =
          data.incomingTransfers;

        state.reportFormFilters[ReportType.SCAN_SHEET].allIncomingTransfers =
          data.incomingTransfers;
      }

      if (data.outgoingTransfers) {
        state.reportFormFilters[ReportType.SCAN_SHEET].allOutgoingTransfers =
          data.outgoingTransfers;

        state.reportFormFilters[ReportType.INVOICE].allOutgoingTransfers =
          data.outgoingTransfers;
      }

      if (data.rejectedTransfers) {
        state.reportFormFilters[ReportType.SCAN_SHEET].allRejectedTransfers =
          data.rejectedTransfers;
      }
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
    [ReportsMutations.SET_GENERATED_REPORT](
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
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.CUSTOM,
          disableMultiReport: false,
        },
        {
          text: "Packages",
          value: ReportType.PACKAGES,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All packages. Filter by type and date.",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
        },
        {
          text: "Point-in-time inventory",
          value: ReportType.POINT_IN_TIME_INVENTORY,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All active packages on a certain date.",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.PACKAGES,
          disableMultiReport: false,
        },
        {
          text: "Plant Batches",
          value: ReportType.IMMATURE_PLANTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All plant batches. Filter by planted date.",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
        },
        {
          text: "Mature Plants",
          value: ReportType.MATURE_PLANTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All mature plants. Filter by growth phase and planted date",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
        },
        {
          text: "Incoming Transfers",
          value: ReportType.INCOMING_TRANSFERS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All incoming transfers. Filter by wholesale and ETA",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
        },
        {
          text: "Outgoing Transfers",
          value: ReportType.OUTGOING_TRANSFERS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All outgoing transfers. Filter by wholesale and ETD",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
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
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
        },
        {
          text: "Harvests",
          value: ReportType.HARVESTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "All harvests. Filter by status and harvest date.",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.CATALOG,
          disableMultiReport: false,
        },
        {
          text: "Incoming Transfer Manifests",
          value: ReportType.INCOMING_TRANSFER_MANIFESTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Full transfer and package data for all incoming transfers.",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.TRANSFERS,
          disableMultiReport: false,
        },
        {
          text: "Outgoing Transfer Manifests",
          value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Full transfer and package data for all outgoing transfers.",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.TRANSFERS,
          disableMultiReport: false,
        },
        {
          text: "Straggler Inventory",
          value: ReportType.STRAGGLER_PACKAGES,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Find old and empty inventory",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: true,
          reportCategory: ReportCategory.PACKAGES,
          disableMultiReport: false,
        },
        {
          text: "Employee Activity",
          value: ReportType.EMPLOYEE_AUDIT,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "View all employee activity in Metrc",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.EMPLOYEES,
          disableMultiReport: false,
        },
        {
          text: "Employee Permissions",
          value: ReportType.EMPLOYEE_PERMISSIONS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "View all employee permissions in Metrc",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.EMPLOYEES,
          disableMultiReport: false,
        },
        {
          text: "Transfer Invoices",
          value: ReportType.INVOICE,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Generate invoices from outgoing transfers",
          usesSpreadsheetFormulas: true,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.TRANSFERS,
          disableMultiReport: true,
        },
        {
          text: "Scan Sheet",
          value: ReportType.SCAN_SHEET,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Generate a scannable spreadsheet to verify transfer package lists",
          usesSpreadsheetFormulas: true,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.TRANSFERS,
          disableMultiReport: false,
        },
        {
          text: "Lab Results",
          value: ReportType.LAB_RESULTS,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Export specific test values for your packages",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.PACKAGES,
          disableMultiReport: false,
        },
        {
          text: "Items Metadata",
          value: ReportType.ITEMS_METADATA,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description:
            "Export items data with additional details like created date and approval number",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.ITEMS,
          disableMultiReport: false,
        },
        {
          text: "COGS",
          value: ReportType.COGS_V2,
          enabled: !!rootState.client.values.ENABLE_COGS,
          visible: !!rootState.client.values.ENABLE_COGS,
          description: "Generate COGS calculator",
          reportCategory: ReportCategory.CUSTOM,
          usesSpreadsheetFormulas: true,
          requiresGoogleSheets: true,
          usesFieldTransformer: false,
          disableMultiReport: false,
        },
        {
          text: "COGS Tracker",
          value: ReportType.COGS_TRACKER,
          enabled: !!rootState.client.values.ENABLE_COGS_TRACKER,
          visible: !!rootState.client.values.ENABLE_COGS_TRACKER,
          description: "Generate COGS Tracker sheets",
          reportCategory: ReportCategory.CUSTOM,
          usesSpreadsheetFormulas: true,
          requiresGoogleSheets: true,
          usesFieldTransformer: false,
          disableMultiReport: false,
        },
        {
          text: "Employee Samples",
          value: ReportType.EMPLOYEE_SAMPLES,
          enabled: !!rootState.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
          visible: !!rootState.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
          description: "Generate summary of employee samples",
          reportCategory: ReportCategory.CUSTOM,
          usesSpreadsheetFormulas: true,
          requiresGoogleSheets: true,
          usesFieldTransformer: false,
          disableMultiReport: false,
        },
        {
          text: "Harvest Packages",
          value: ReportType.HARVEST_PACKAGES,
          enabled: !!rootState.client.values.ENABLE_HARVEST_PACKAGES,
          visible: !!rootState.client.values.ENABLE_HARVEST_PACKAGES,
          description: "Generate summary of harvest packages",
          usesFieldTransformer: false,
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          reportCategory: ReportCategory.CUSTOM,
          disableMultiReport: false,
        },
        {
          text: "Incoming Manifest Inventory",
          value: ReportType.INCOMING_MANIFEST_INVENTORY,
          enabled: !!rootState.client.values.ENABLE_INCOMING_MANIFEST_INVENTORY,
          visible: !!rootState.client.values.ENABLE_INCOMING_MANIFEST_INVENTORY,
          description: "Generate summary of incoming manifests for inventory checks",
          usesFieldTransformer: true,
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          reportCategory: ReportCategory.CUSTOM,
          disableMultiReport: false,
        },
        {
          text: "Packages Quickview",
          value: ReportType.PACKAGES_QUICKVIEW,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Grouped summary of packages by item, location, and dates",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.QUICKVIEW,
          disableMultiReport: false,
        },
        {
          text: "Plant Batch Quickview",
          value: ReportType.IMMATURE_PLANTS_QUICKVIEW,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description: "Grouped summary of plant batches by strain, location, and dates",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.QUICKVIEW,
          disableMultiReport: false,
        },
        {
          text: "Mature Plants Quickview",
          value: ReportType.MATURE_PLANTS_QUICKVIEW,
          enabled: rootGetters[`client/${ClientGetters.T3PLUS}`],
          visible: true,
          description:
            "Grouped summary of mature plants by growth phase, strain, location, and dates",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.QUICKVIEW,
          disableMultiReport: false,
        },
        {
          text: "Transfer Quickview",
          value: null,
          enabled: false,
          visible: true,
          description: "Summary of incoming, outgoing, and rejected packages",
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          reportCategory: ReportCategory.QUICKVIEW,
          disableMultiReport: false,
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
          usesSpreadsheetFormulas: false,
          requiresGoogleSheets: false,
          usesFieldTransformer: false,
          disableMultiReport: false,
          reportCategory: ReportCategory.TRANSFERS,
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
        case ReportType.SCAN_SHEET: {
          let incomingTransfers: IIndexedIncomingTransferData[] = [];
          let outgoingTransfers: IIndexedOutgoingTransferData[] = [];
          let rejectedTransfers: IIndexedIncomingTransferData[] = [];
          try {
            [incomingTransfers, outgoingTransfers, rejectedTransfers] = await Promise.all([
              primaryDataLoader.incomingTransfers(),
              primaryDataLoader.outgoingTransfers(),
              primaryDataLoader.rejectedTransfers(),
            ]);

            ctx.commit(ReportsMutations.UPDATE_DYNAMIC_REPORT_DATA, {
              incomingTransfers,
              outgoingTransfers,
              rejectedTransfers,
            });
          } catch (error) {
            // Handle errors here
          }
          break;
        }
        case ReportType.INVOICE: {
          let outgoingTransfers: IIndexedOutgoingTransferData[] = [];
          try {
            [outgoingTransfers] = await Promise.all([
              primaryDataLoader.outgoingTransfers(),
            ]);

            ctx.commit(ReportsMutations.UPDATE_DYNAMIC_REPORT_DATA, {
              outgoingTransfers,
            });
          } catch (error) {
            // Handle errors here
          }
          break;
        }
      }
    },
    [ReportsActions.RESET]: async (ctx: ActionContext<IReportsState, IPluginState>, data: any) => {
      ctx.commit(ReportsMutations.SET_STATUS, {
        status: ReportStatus.INITIAL,
        statusMessage: null,
      });
      ctx.commit(ReportsMutations.SET_GENERATED_REPORT, { spreadsheet: null });
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
      analyticsManager.track(AnalyticsEvent.GENERATED_REPORT, reportConfig);

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
        await maybeLoadEmployeePermissionsReportData({ ctx, reportData, reportConfig });
        await maybeLoadPointInTimeInventoryReportData({ ctx, reportData, reportConfig });
        await maybeLoadSingleTransferReportData({ ctx, reportData, reportConfig });
        await maybeLoadScanSheetReportData({ ctx, reportData, reportConfig });
        await maybeLoadInvoiceReportData({ ctx, reportData, reportConfig });
        await maybeLoadLabResultsReportData({ ctx, reportData, reportConfig });
        await maybeLoadItemsMetadataReportData({ ctx, reportData, reportConfig });

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: "Generating report...", level: "success" },
        });

        console.log({ reportData, reportConfig });

        if (reportConfig.exportFormat === "CSV") {
          await createCsvOrError({ reportData, reportConfig });
        } else if (reportConfig.exportFormat === "XLSX") {
          await createXlsxOrError({ reportData, reportConfig });
        } else {
          const spreadsheet: ISpreadsheet = await createGoogleDocsSpreadsheetOrError({
            reportData,
            reportConfig,
          });

          ctx.commit(ReportsMutations.SET_GENERATED_REPORT, { spreadsheet });

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
        analyticsManager.track(AnalyticsEvent.GENERATED_REPORT_SUCCESS);
      } catch (e) {
        console.error((e as Error).stack);

        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.ERROR,
          // @ts-ignore
          statusMessage: `${e.toString()}
          
          ${(e as Error).stack}`,
        });

        // @ts-ignore
        analyticsManager.track(AnalyticsEvent.GENERATED_REPORT_ERROR, { error: e.toString() });

        throw e;
      }
    },
  },
};

export const reportsReducer = (state: IReportsState): IReportsState => ({
  ...state,
  ...inMemoryState,
});
