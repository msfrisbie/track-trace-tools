import { MessageType } from "@/consts";
import {
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTagData,
  IPluginState,
  IRichDestinationData,
  ISpreadsheet,
  ITransporterData,
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

        const packageConfig = reportConfig[ReportType.PACKAGES];
        if (packageConfig?.packageFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading packages..." });

          let packages: IIndexedPackageData[] = [];

          if (packageConfig.packageFilter.includeActive) {
            try {
              packages = [...packages, ...(await primaryDataLoader.activePackages())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load active packages.",
              });
            }
          }

          if (packageConfig.packageFilter.includeInactive) {
            try {
              packages = [...packages, ...(await primaryDataLoader.inactivePackages())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load inactive packages.",
              });
            }
          }

          packages = packages.filter((pkg) => {
            if (packageConfig.packageFilter.packagedDateLt) {
              if (pkg.PackagedDate > packageConfig.packageFilter.packagedDateLt) {
                return false;
              }
            }

            if (packageConfig.packageFilter.packagedDateEq) {
              if (!pkg.PackagedDate.startsWith(packageConfig.packageFilter.packagedDateEq)) {
                return false;
              }
            }

            if (packageConfig.packageFilter.packagedDateGt) {
              if (pkg.PackagedDate < packageConfig.packageFilter.packagedDateGt) {
                return false;
              }
            }

            return true;
          });

          reportData[ReportType.PACKAGES] = {
            packages,
          };
        }

        const immaturePlantConfig = reportConfig[ReportType.IMMATURE_PLANTS];
        if (immaturePlantConfig?.immaturePlantFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading plant batches..." });

          let immaturePlants: IIndexedPlantBatchData[] = [];

          if (immaturePlantConfig.immaturePlantFilter.includeActive) {
            try {
              immaturePlants = [...immaturePlants, ...(await primaryDataLoader.plantBatches({}))];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load active plant batches.",
              });
            }
          }

          if (immaturePlantConfig.immaturePlantFilter.includeInactive) {
            try {
              immaturePlants = [
                ...immaturePlants,
                ...(await primaryDataLoader.inactivePlantBatches()),
              ];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load inactive plant batches.",
              });
            }
          }

          immaturePlants = immaturePlants.filter((plantBatch) => {
            if (immaturePlantConfig.immaturePlantFilter.plantedDateLt) {
              if (plantBatch.PlantedDate > immaturePlantConfig.immaturePlantFilter.plantedDateLt) {
                return false;
              }
            }

            if (immaturePlantConfig.immaturePlantFilter.plantedDateGt) {
              if (plantBatch.PlantedDate < immaturePlantConfig.immaturePlantFilter.plantedDateGt) {
                return false;
              }
            }

            return true;
          });

          reportData[ReportType.IMMATURE_PLANTS] = {
            immaturePlants,
          };
        }

        const harvestConfig = reportConfig[ReportType.HARVESTS];
        if (harvestConfig?.harvestFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading harvests..." });

          let harvests: IIndexedHarvestData[] = [];

          if (harvestConfig.harvestFilter.includeActive) {
            try {
              harvests = [...harvests, ...(await primaryDataLoader.activeHarvests())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load active harvests.",
              });
            }
          }

          if (harvestConfig.harvestFilter.includeInactive) {
            try {
              harvests = [...harvests, ...(await primaryDataLoader.inactiveHarvests())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load inactive harvests.",
              });
            }
          }

          harvests = harvests.filter((harvest) => {
            if (harvestConfig.harvestFilter.harvestDateLt) {
              if (harvest.HarvestStartDate > harvestConfig.harvestFilter.harvestDateLt) {
                return false;
              }
            }

            if (harvestConfig.harvestFilter.harvestDateGt) {
              if (harvest.HarvestStartDate < harvestConfig.harvestFilter.harvestDateGt) {
                return false;
              }
            }

            return true;
          });

          reportData[ReportType.HARVESTS] = {
            harvests,
          };
        }

        const tagConfig = reportConfig[ReportType.TAGS];
        if (tagConfig?.tagFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, { statusMessage: "Loading tags..." });

          let tags: IIndexedTagData[] = [];

          if (tagConfig.tagFilter.includeAvailable) {
            try {
              tags = [...tags, ...(await primaryDataLoader.availableTags())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load active tags.",
              });
            }
          }

          if (tagConfig.tagFilter.includeUsed) {
            try {
              tags = [...tags, ...(await primaryDataLoader.usedTags())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load used tags.",
              });
            }
          }

          if (tagConfig.tagFilter.includeVoided) {
            try {
              tags = [...tags, ...(await primaryDataLoader.voidedTags())];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load voided tags.",
              });
            }
          }

          // This filter is expensive, only conditionally apply if necessary
          if (!tagConfig.tagFilter.includePlant || !tagConfig.tagFilter.includePackage) {
            tags = tags.filter((tag) => {
              if (!tagConfig.tagFilter.includePlant) {
                if (tag.TagTypeName.includes("Plant")) {
                  return false;
                }
              }

              if (!tagConfig.tagFilter.includePackage) {
                if (tag.TagTypeName.includes("Package")) {
                  return false;
                }
              }

              return true;
            });
          }

          reportData[ReportType.TAGS] = {
            tags,
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

          if (maturePlantConfig.plantFilter.includeInactive) {
            try {
              maturePlants = [...maturePlants, ...(await primaryDataLoader.inactivePlants({}))];
            } catch (e) {
              ctx.commit(ReportsMutations.SET_STATUS, {
                statusMessage: "Failed to load inactive plants.",
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

        const incomingTransferConfig = reportConfig[ReportType.INCOMING_TRANSFERS];
        if (incomingTransferConfig?.transferFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: "Loading incoming transfers...",
          });

          let richIncomingTransfers: IIndexedRichIncomingTransferData[] = [];

          if (incomingTransferConfig.transferFilter.includeOutgoing) {
            richIncomingTransfers = [
              ...(await primaryDataLoader.incomingTransfers()),
              ...richIncomingTransfers,
            ];
          }

          if (incomingTransferConfig.transferFilter.includeOutgoingInactive) {
            richIncomingTransfers = [
              ...(await primaryDataLoader.incomingInactiveTransfers()),
              ...richIncomingTransfers,
            ];
          }

          richIncomingTransfers = richIncomingTransfers.filter((transfer) => {
            if (incomingTransferConfig.transferFilter.onlyWholesale) {
              if (!transfer.ShipmentTypeName.includes("Wholesale")) {
                return false;
              }
            }

            if (incomingTransferConfig.transferFilter.estimatedArrivalDateLt) {
              if (
                transfer.EstimatedDepartureDateTime >
                incomingTransferConfig.transferFilter.estimatedArrivalDateLt
              ) {
                return false;
              }
            }

            if (incomingTransferConfig.transferFilter.estimatedArrivalDateGt) {
              if (
                transfer.EstimatedDepartureDateTime <
                incomingTransferConfig.transferFilter.estimatedArrivalDateGt
              ) {
                return false;
              }
            }

            return true;
          });

          for (const transfer of richIncomingTransfers) {
            const transporters: ITransporterData[] =
              await primaryDataLoader.destinationTransporters(transfer.DeliveryId);

            transfer.incomingTransporters = transporters;
          }

          reportData[ReportType.INCOMING_TRANSFERS] = {
            incomingTransfers: richIncomingTransfers,
          };
        }

        const outgoingTransferConfig = reportConfig[ReportType.OUTGOING_TRANSFERS];
        if (outgoingTransferConfig?.transferFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: "Loading outgoing transfers...",
          });

          let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

          if (outgoingTransferConfig.transferFilter.includeOutgoing) {
            richOutgoingTransfers = [
              ...(await primaryDataLoader.outgoingTransfers()),
              ...richOutgoingTransfers,
            ];
          }

          if (outgoingTransferConfig.transferFilter.includeRejected) {
            richOutgoingTransfers = [
              ...(await primaryDataLoader.rejectedTransfers()),
              ...richOutgoingTransfers,
            ];
          }

          if (outgoingTransferConfig.transferFilter.includeOutgoingInactive) {
            richOutgoingTransfers = [
              ...(await primaryDataLoader.outgoingInactiveTransfers()),
              ...richOutgoingTransfers,
            ];
          }

          for (const transfer of richOutgoingTransfers) {
            const destinations: IRichDestinationData[] = (
              await primaryDataLoader.transferDestinations(transfer.Id)
            ).map((x) => ({ ...x, packages: [] }));

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

        const transferManifestConfig = reportConfig[ReportType.OUTGOING_TRANSFER_MANIFESTS];
        if (transferManifestConfig?.transferFilter) {
          ctx.commit(ReportsMutations.SET_STATUS, {
            statusMessage: "Loading transfer manifest packages...",
          });

          let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

          if (transferManifestConfig.transferFilter.includeOutgoing) {
            richOutgoingTransfers = [
              ...(await primaryDataLoader.outgoingTransfers()),
              ...richOutgoingTransfers,
            ];
          }

          if (transferManifestConfig.transferFilter.includeRejected) {
            richOutgoingTransfers = [
              ...(await primaryDataLoader.rejectedTransfers()),
              ...richOutgoingTransfers,
            ];
          }

          if (transferManifestConfig.transferFilter.includeOutgoingInactive) {
            richOutgoingTransfers = [
              ...(await primaryDataLoader.outgoingInactiveTransfers()),
              ...richOutgoingTransfers,
            ];
          }

          for (const transfer of richOutgoingTransfers) {
            const destinations: IRichDestinationData[] = (
              await primaryDataLoader.transferDestinations(transfer.Id)
            ).map((x) => ({ ...x, packages: [] }));

            for (const destination of destinations) {
              destination.packages = await primaryDataLoader.destinationPackages(destination.Id);
            }
            transfer.outgoingDestinations = destinations;

            transfer.outgoingDestinations = destinations.filter((destination) => {
              if (transferManifestConfig.transferFilter.onlyWholesale) {
                if (!destination.ShipmentTypeName.includes("Wholesale")) {
                  return false;
                }
              }

              if (transferManifestConfig.transferFilter.estimatedDepartureDateLt) {
                if (
                  destination.EstimatedDepartureDateTime >
                  transferManifestConfig.transferFilter.estimatedDepartureDateLt
                ) {
                  return false;
                }
              }

              if (transferManifestConfig.transferFilter.estimatedDepartureDateGt) {
                if (
                  destination.EstimatedDepartureDateTime <
                  transferManifestConfig.transferFilter.estimatedDepartureDateGt
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

          reportData[ReportType.OUTGOING_TRANSFER_MANIFESTS] = {
            richOutgoingTransfers,
          };
        }

        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: "Generating spreadsheet...",
        });

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
