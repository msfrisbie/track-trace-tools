import {
  IIndexedRichTransferData,
  IPluginState,
  IRichDestinationData,
  ISpreadsheet,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { getSimpleSpreadsheet } from "@/utils/sheets";
import { createExportSpreadsheetOrError } from "@/utils/sheets-export";
import { v4 as uuidv4 } from "uuid";
import { ActionContext } from "vuex";
import {
  ReportsActions,
  ReportsGetters,
  ReportsMutations,
  ReportStatus,
  ReportType,
} from "./consts";
import { IReportConfig, IReportData, IReportsState } from "./interfaces";

const inMemoryState = {
  status: ReportStatus.INITIAL,
  statusMessage: "",
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
      { status, statusMessage }: { status?: ReportStatus; statusMessage?: string }
    ) {
      if (status) {
        state.status = status;

        if (status === ReportStatus.INITIAL) {
          state.statusMessageHistory = [];
        }
      }

      if (typeof statusMessage === "string") {
        if (state.statusMessage.length > 0) {
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
      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INITIAL, statusMessage: "" });
      ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet: null });
    },
    [ReportsActions.GENERATE_REPORT_SPREADSHEET]: async (
      ctx: ActionContext<IReportsState, IPluginState>,
      { reportConfig }: { reportConfig: IReportConfig }
    ) => {
      console.log({ reportConfig });

      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INFLIGHT });

      try {
        let reportData: IReportData = {};

        const activePackageConfig = reportConfig[ReportType.ACTIVE_PACKAGES];
        if (activePackageConfig?.packageFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading packages..." });

          const activePackages = (await primaryDataLoader.activePackages()).filter((pkg) => {
            if (activePackageConfig.packageFilter.packagedDateLt) {
              if (pkg.PackagedDate > activePackageConfig.packageFilter.packagedDateLt) {
                return false;
              }
            }

            if (activePackageConfig.packageFilter.packagedDateEq) {
              if (!pkg.PackagedDate.startsWith(activePackageConfig.packageFilter.packagedDateEq)) {
                return false;
              }
            }

            if (activePackageConfig.packageFilter.packagedDateGt) {
              if (pkg.PackagedDate < activePackageConfig.packageFilter.packagedDateGt) {
                return false;
              }
            }

            return true;
          });

          reportData[ReportType.ACTIVE_PACKAGES] = {
            activePackages,
          };
        }

        const transferPackageConfig = reportConfig[ReportType.TRANSFER_PACKAGES];
        if (transferPackageConfig?.transferFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: "Loading transfer packages...",
          });
          // TODO use transferFilter
          const richOutgoingInactiveTransfers: IIndexedRichTransferData[] =
            await primaryDataLoader.outgoingInactiveTransfers();

          for (const transfer of richOutgoingInactiveTransfers) {
            const destinations: IRichDestinationData[] = (
              await primaryDataLoader.transferDestinations(transfer.Id)
            ).map((x) => ({ ...x, packages: [] }));

            for (const destination of destinations) {
              destination.packages = await primaryDataLoader.destinationPackages(destination.Id);
            }
            transfer.outgoingDestinations = destinations;
          }

          reportData[ReportType.TRANSFER_PACKAGES] = {
            richOutgoingInactiveTransfers,
          };
        }

        ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Generating spreadsheet..." });

        const spreadsheet: ISpreadsheet = await createExportSpreadsheetOrError({
          reportData,
          reportConfig,
        });

        ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet });

        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.SUCCESS,
          statusMessage: "",
        });
      } catch (e) {
        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.ERROR,
          // @ts-ignore
          statusMessage: e.toString(),
        });
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
