import {
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedTransferData,
  IPackageHistoryData,
  IPlantBatchHistoryData,
  IPluginState,
  ITransferHistoryData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { DataLoader, getDataLoader } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { LRU } from "@/utils/cache";
import { ActionContext } from "vuex";
import { ExplorerTarget, ExplorerTargetHistory, IExplorerState } from "../explorer/interfaces";
import { ExplorerActions, ExplorerMutations, ExplorerStatus, ExplorerTargetType } from "./consts";

const inMemoryState = {
  status: ExplorerStatus.INITIAL,
  statusMessage: "",
  queryString: "",
  target: null,
  targetType: ExplorerTargetType.PACKAGE,
  history: null,
};

const persistedState = {
  recent: [],
};

const defaultState: IExplorerState = {
  ...inMemoryState,
  ...persistedState,
};

export const explorerModule = {
  state: () => defaultState,
  mutations: {
    [ExplorerMutations.SET_TARGET](
      state: IExplorerState,
      {
        target,
      }: {
        target: ExplorerTarget | null;
      }
    ) {
      state.target = target;

      if (!target) {
        state.status = ExplorerStatus.INITIAL;
        state.statusMessage = "";
        state.history = null;
      }
    },
    [ExplorerMutations.SET_HISTORY](
      state: IExplorerState,
      {
        targetHistory,
      }: {
        targetHistory: ExplorerTargetHistory | null;
      }
    ) {
      state.history = targetHistory;
    },
    [ExplorerMutations.SET_STATUS](
      state: IExplorerState,
      {
        status,
        statusMessage,
      }: {
        status?: ExplorerStatus;
        statusMessage?: string;
      }
    ) {
      if (status) {
        state.status = status;
      }

      if (statusMessage) {
        state.statusMessage = statusMessage;
      }
    },
    [ExplorerMutations.SET_QUERY](
      state: IExplorerState,
      {
        queryString,
      }: {
        queryString: string;
      }
    ) {
      state.queryString = queryString;
    },
    [ExplorerMutations.SET_TARGET_TYPE](
      state: IExplorerState,
      {
        targetType,
      }: {
        targetType: ExplorerTargetType;
      }
    ) {
      state.targetType = targetType;
    },
    [ExplorerMutations.ADD_QUERY](state: IExplorerState) {
      state.recent = [
        {
          queryString: state.queryString,
          targetType: state.targetType,
          timestamp: Date.now(),
        },
        ...state.recent,
      ].slice(0, 50);
    },
  },
  getters: {
    // [ExplorerGetters.STATE]: (
    //   state: IExplorerState,
    //   getters: any,
    //   rootState: any,
    //   rootGetters: any
    // ): ExplorerStatus => {
    //   return ExplorerStatus.INITIAL;
    // },
  },
  actions: {
    [ExplorerActions.RESET]: async (ctx: ActionContext<IExplorerState, IPluginState>) => {
      ctx.commit(ExplorerMutations.SET_TARGET, {
        target: null,
      });
    },
    [ExplorerActions.SET_QUERY]: async (
      ctx: ActionContext<IExplorerState, IPluginState>,
      { queryString }: { queryString: string }
    ) => {
      ctx.commit(ExplorerMutations.SET_QUERY, {
        queryString,
      });
    },
    [ExplorerActions.SET_TARGET_TYPE]: async (
      ctx: ActionContext<IExplorerState, IPluginState>,
      { targetType }: { targetType: ExplorerTargetType }
    ) => {
      ctx.commit(ExplorerMutations.SET_TARGET_TYPE, {
        targetType,
      });
    },
    [ExplorerActions.SUBMIT_QUERY]: async (
      ctx: ActionContext<IExplorerState, IPluginState>,
      {
        queryString,
        targetType,
      }: {
        queryString?: string;
        targetType?: ExplorerTargetType;
      } = {}
    ) => {
      if (queryString) {
        ctx.commit(ExplorerMutations.SET_QUERY, { queryString });
      }

      if (targetType) {
        ctx.commit(ExplorerMutations.SET_TARGET_TYPE, { targetType });
      }

      if (!ctx.state.queryString) {
        throw new Error("Must provide query string");
      }

      ctx.commit(ExplorerMutations.SET_STATUS, {
        status: ExplorerStatus.INFLIGHT,
      });

      ctx.commit(ExplorerMutations.ADD_QUERY, {});

      const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
        (facility) => facility.licenseNumber
      );
      const licenseCache: LRU<string> = new LRU(ownedLicenses);
      let dataLoader: DataLoader | null = null;

      switch (ctx.state.targetType) {
        case ExplorerTargetType.PACKAGE:
          let pkg: IIndexedPackageData | null = null;

          for (const license of licenseCache.elements) {
            const authState = {
              ...(await authManager.authStateOrError()),
              license,
            };

            dataLoader = await getDataLoader(authState);

            try {
              // @ts-ignore
              pkg = await Promise.any([
                dataLoader.activePackage(ctx.state.queryString!),
                dataLoader.inactivePackage(ctx.state.queryString!),
                dataLoader.inTransitPackage(ctx.state.queryString!, { useCache: false }),
              ]);
            } catch {}
            if (pkg) {
              break;
            }
          }

          if (!pkg) {
            ctx.commit(ExplorerMutations.SET_STATUS, {
              status: ExplorerStatus.ERROR,
              statusMessage: "Unable to match package",
            });
            return;
          }

          ctx.commit(ExplorerMutations.SET_TARGET, {
            target: pkg,
          });

          let pkgHistory: IPackageHistoryData[] | null = null;

          for (const license of licenseCache.elements) {
            const authState = {
              ...(await authManager.authStateOrError()),
              license,
            };

            dataLoader = await getDataLoader(authState);

            try {
              pkgHistory = await dataLoader.packageHistoryByPackageId(pkg.Id);
            } catch {}

            // A license mismatch will return 200 w/ 0 entries
            if (pkgHistory && pkgHistory.length > 0) {
              break;
            }
          }

          if (!pkgHistory) {
            ctx.commit(ExplorerMutations.SET_STATUS, {
              status: ExplorerStatus.ERROR,
              statusMessage: "Unable to match package history",
            });

            return;
          }

          ctx.commit(ExplorerMutations.SET_HISTORY, {
            targetHistory: pkgHistory,
          });

          ctx.commit(ExplorerMutations.SET_STATUS, {
            status: ExplorerStatus.SUCCESS,
            statusMessage: "",
          });

          break;
        case ExplorerTargetType.PLANT_BATCH:
          let plantBatch: IIndexedPlantBatchData | null = null;

          for (const license of licenseCache.elements) {
            const authState = {
              ...(await authManager.authStateOrError()),
              license,
            };

            dataLoader = await getDataLoader(authState);

            try {
              // @ts-ignore
              plantBatch = await Promise.any([
                dataLoader.plantBatch(ctx.state.queryString!),
                dataLoader.inactivePlantBatch(ctx.state.queryString!),
              ]);
            } catch {}
            if (plantBatch) {
              break;
            }
          }

          if (!plantBatch) {
            ctx.commit(ExplorerMutations.SET_STATUS, {
              status: ExplorerStatus.ERROR,
              statusMessage: "Unable to match plant batch",
            });
            return;
          }

          ctx.commit(ExplorerMutations.SET_TARGET, {
            target: plantBatch,
          });

          let plantBatchHistory: IPlantBatchHistoryData[] | null = null;

          for (const license of licenseCache.elements) {
            const authState = {
              ...(await authManager.authStateOrError()),
              license,
            };

            dataLoader = await getDataLoader(authState);

            try {
              plantBatchHistory = await dataLoader.plantBatchHistoryByPlantBatchId(plantBatch.Id);
            } catch {}

            // A license mismatch will return 200 w/ 0 entries
            if (plantBatchHistory && plantBatchHistory.length > 0) {
              break;
            }
          }

          if (!plantBatchHistory) {
            ctx.commit(ExplorerMutations.SET_STATUS, {
              status: ExplorerStatus.ERROR,
              statusMessage: "Unable to match plant batch history",
            });

            return;
          }

          ctx.commit(ExplorerMutations.SET_HISTORY, {
            targetHistory: plantBatchHistory,
          });

          ctx.commit(ExplorerMutations.SET_STATUS, {
            status: ExplorerStatus.SUCCESS,
            statusMessage: "",
          });

          break;

        case ExplorerTargetType.OUTGOING_TRANSFER:
          let outgoingTransfer: IIndexedTransferData | null = null;

          for (const license of licenseCache.elements) {
            const authState = {
              ...(await authManager.authStateOrError()),
              license,
            };

            dataLoader = await getDataLoader(authState);

            try {
              // @ts-ignore
              outgoingTransfer = await Promise.any([
                dataLoader.outgoingTransfer(ctx.state.queryString!),
                dataLoader.rejectedTransfer(ctx.state.queryString!),
                dataLoader.outgoingInactiveTransfer(ctx.state.queryString!),
              ]);
            } catch {}
            if (outgoingTransfer) {
              break;
            }
          }

          if (!outgoingTransfer) {
            ctx.commit(ExplorerMutations.SET_STATUS, {
              status: ExplorerStatus.ERROR,
              statusMessage: "Unable to match outgoing transfer",
            });
            return;
          }

          ctx.commit(ExplorerMutations.SET_TARGET, {
            target: outgoingTransfer,
          });

          let outgoingTransferHistory: ITransferHistoryData[] | null = null;

          for (const license of licenseCache.elements) {
            const authState = {
              ...(await authManager.authStateOrError()),
              license,
            };

            dataLoader = await getDataLoader(authState);

            try {
              outgoingTransferHistory = await dataLoader.transferHistoryByOutGoingTransferId(
                outgoingTransfer.Id
              );
            } catch {}

            // A license mismatch will return 200 w/ 0 entries
            if (outgoingTransferHistory && outgoingTransferHistory.length > 0) {
              break;
            }
          }

          if (!outgoingTransferHistory) {
            ctx.commit(ExplorerMutations.SET_STATUS, {
              status: ExplorerStatus.ERROR,
              statusMessage: "Unable to match outgoing transfer history",
            });

            return;
          }

          ctx.commit(ExplorerMutations.SET_HISTORY, {
            targetHistory: outgoingTransferHistory,
          });

          ctx.commit(ExplorerMutations.SET_STATUS, {
            status: ExplorerStatus.SUCCESS,
            statusMessage: "",
          });

          break;

        default:
          throw new Error("Bad target type");
      }
    },
  },
};

export const explorerReducer = (state: IExplorerState): IExplorerState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
