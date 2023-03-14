import { MessageType } from "@/consts";
import {
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedRichTransferData,
  IPluginState,
  IRichDestinationData,
  ISpreadsheet,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
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
      analyticsManager.track(MessageType.GENERATED_SPREADSHEET, reportConfig);

      ctx.commit(ReportsMutations.SET_STATUS, { status: ReportStatus.INFLIGHT });

      try {
        let reportData: IReportData = {};

        const activePackageConfig = reportConfig[ReportType.ACTIVE_PACKAGES];
        if (activePackageConfig?.packageFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading packages..." });

          let activePackages: IIndexedPackageData[] = [];

          try {
            activePackages = [...activePackages, ...(await primaryDataLoader.activePackages())];
          } catch (e) {
            ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Failed to load packages." });
          }

          activePackages = activePackages.filter((pkg) => {
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

        const maturePlantConfig = reportConfig[ReportType.MATURE_PLANTS];
        if (maturePlantConfig?.plantFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading plants..." });

          let maturePlants: IIndexedPlantData[] = [];

          if (maturePlantConfig.plantFilter.includeVegetative) {
            try {
              maturePlants = [...maturePlants, ...(await primaryDataLoader.vegetativePlants())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load vegetative plants.",
              });
            }
          }

          if (maturePlantConfig.plantFilter.includeFlowering) {
            try {
              maturePlants = [...maturePlants, ...(await primaryDataLoader.floweringPlants())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load flowering plants.",
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

        const outgoingTransferConfig = reportConfig[ReportType.OUTGOING_TRANSFERS];
        if (outgoingTransferConfig?.transferFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: "Loading outgoing transfers...",
          });

          let richOutgoingTransfers: IIndexedRichTransferData[] =
            await primaryDataLoader.outgoingTransfers();

          for (const transfer of richOutgoingTransfers) {
            const destinations: IRichDestinationData[] = (
              await primaryDataLoader.transferDestinations(transfer.Id)
            ).map((x) => ({ ...x, packages: [] }));

            console.log({ destinations, filter: outgoingTransferConfig.transferFilter });

            transfer.outgoingDestinations = destinations.filter((destination) => {
              if (outgoingTransferConfig.transferFilter.onlyWholesale) {
                if (!destination.ShipmentTypeName.includes("Wholesale")) {
                  return false;
                }
              }

              if (outgoingTransferConfig.transferFilter.estimatedDepartureDateLt) {
                if (
                  destination.EstimatedDepartureDateTime >
                  outgoingTransferConfig.transferFilter.estimatedDepartureDateLt
                ) {
                  return false;
                }
              }

              if (outgoingTransferConfig.transferFilter.estimatedDepartureDateGt) {
                if (
                  destination.EstimatedDepartureDateTime <
                  outgoingTransferConfig.transferFilter.estimatedDepartureDateGt
                ) {
                  return false;
                }
              }

              return true;
            });
          }

          richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => {
            return true;
          });

          reportData[ReportType.OUTGOING_TRANSFERS] = {
            outgoingTransfers: richOutgoingTransfers,
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

        console.log({ reportData, reportConfig });

        const spreadsheet: ISpreadsheet = await createExportSpreadsheetOrError({
          reportData,
          reportConfig,
        });

        ctx.commit(ReportsMutations.SET_GENERATED_SPREADSHEET, { spreadsheet });

        window.open(spreadsheet.spreadsheetUrl, "_blank");

        ctx.commit(ReportsMutations.SET_STATUS, {
          status: ReportStatus.SUCCESS,
          statusMessage: "",
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
