import { IIndexedPackageData, IPackageHistoryData, IPluginState } from "@/interfaces";
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
        },
        ...state.recent,
      ].slice(0, 25);
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
    [ExplorerActions.SUBMIT_QUERY]: async (ctx: ActionContext<IExplorerState, IPluginState>) => {
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
              pkg = await dataLoader.activePackage(ctx.state.queryString!);
            } catch {}
            if (pkg) {
              break;
            }
            try {
              pkg = await dataLoader.inactivePackage(ctx.state.queryString!);
            } catch {}
            if (pkg) {
              break;
            }
            try {
              pkg = await dataLoader.inTransitPackage(ctx.state.queryString!, { useCache: false });
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
