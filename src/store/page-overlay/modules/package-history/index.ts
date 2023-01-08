import {
  IHarvestHistoryData,
  IIndexedPackageData,
  IPackageAncestorTreeNode,
  IPackageChildTreeNode,
  IPackageData,
  IPluginState,
} from "@/interfaces";
import {
  getChildPackageHistoryTree,
  getParentHarvests,
  getParentPackageHistoryTree,
} from "@/utils/package";
import { ActionContext } from "vuex";
import {
  PackageHistoryActions,
  PackageHistoryMutations,
  PackageHistoryStatus,
} from "../package-history/consts";
import { IPackageHistoryState } from "../package-history/interfaces";

const inMemoryState = {
  sourcePackage: null,
  status: PackageHistoryStatus.INITIAL,
  log: [],
  ancestorTree: null,
  childTree: null,
  sourceHarvests: [],
};

const persistedState = {};

const defaultState: IPackageHistoryState = {
  ...inMemoryState,
  ...persistedState,
};

export const packageHistoryModule = {
  state: () => defaultState,
  mutations: {
    [PackageHistoryMutations.SET_SOURCE_PACKAGE](
      state: IPackageHistoryState,
      { pkg }: { pkg: IPackageData | null }
    ) {
      state.sourcePackage = pkg;
    },
    [PackageHistoryMutations.LOG_EVENT](state: IPackageHistoryState, { event }: { event: string }) {
      const timestampedEvent = `${Date.now()}: ${event}`;
      console.log(timestampedEvent);
      state.log = [...state.log, timestampedEvent];
    },
    [PackageHistoryMutations.SET_SOURCE_HARVESTS](
      state: IPackageHistoryState,
      {
        sourceHarvests,
      }: {
        sourceHarvests: IHarvestHistoryData[];
      }
    ) {
      state.sourceHarvests = sourceHarvests;
    },
    [PackageHistoryMutations.SET_ANCESTORS](
      state: IPackageHistoryState,
      {
        ancestorTree,
      }: {
        ancestorTree: IPackageAncestorTreeNode;
      }
    ) {
      state.ancestorTree = ancestorTree;
    },
    [PackageHistoryMutations.SET_CHILDREN](
      state: IPackageHistoryState,
      {
        childTree,
      }: {
        childTree: IPackageChildTreeNode;
      }
    ) {
      state.childTree = childTree;
    },
    [PackageHistoryMutations.SET_STATUS](
      state: IPackageHistoryState,
      { status }: { status: PackageHistoryStatus }
    ) {
      state.status = status;
      if (status === PackageHistoryStatus.INITIAL) {
        state.log = [];
        state.ancestorTree = null;
        state.childTree = null;
        state.sourceHarvests = [];
      }
    },
  },
  getters: {},
  actions: {
    [PackageHistoryActions.SET_SOURCE_PACKAGE]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { pkg }: { pkg: IIndexedPackageData | null }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_SOURCE_PACKAGE, { pkg });

      if (pkg) {
        ctx.commit(PackageHistoryMutations.SET_STATUS, {
          status: PackageHistoryStatus.INFLIGHT,
        });

        try {
          ctx.commit(PackageHistoryMutations.SET_SOURCE_HARVESTS, {
            sourceHarvests: getParentHarvests(pkg.Label),
          });
          ctx.commit(PackageHistoryMutations.SET_ANCESTORS, {
            ancestorTree: await getParentPackageHistoryTree({
              label: pkg.Label,
              license: pkg.LicenseNumber,
            }),
          });
          ctx.commit(PackageHistoryMutations.SET_CHILDREN, {
            childTree: await getChildPackageHistoryTree({
              label: pkg.Label,
              license: pkg.LicenseNumber,
            }),
          });
          ctx.commit(PackageHistoryMutations.SET_STATUS, {
            status: PackageHistoryStatus.SUCCESS,
          });
        } catch (e) {
          console.error(e);
          ctx.commit(PackageHistoryMutations.LOG_EVENT, {
            payload: {
              event: e.toString(),
            },
          });
          ctx.commit(PackageHistoryMutations.SET_STATUS, {
            status: PackageHistoryStatus.ERROR,
          });
        }
      } else {
        ctx.commit(PackageHistoryMutations.SET_STATUS, {
          status: PackageHistoryStatus.INITIAL,
        });
      }
    },
    [PackageHistoryActions.LOG_EVENT]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { event }: { event: string }
    ) => {
      ctx.commit(PackageHistoryMutations.LOG_EVENT, { event });
    },
  },
};

export const packageHistoryReducer = (state: IPackageHistoryState): IPackageHistoryState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
