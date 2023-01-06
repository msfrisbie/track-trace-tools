import {
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedTransferData,
  IPackageData,
  IPluginState,
} from "@/interfaces";
import { getChildPackages, getParentPackages } from "@/utils/package";
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
  ancestors: [],
  children: [],
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
    [PackageHistoryMutations.SET_ANCESTORS](
      state: IPackageHistoryState,
      {
        packages = [],
        harvests = [],
        transfers = [],
        depth,
      }: {
        depth: number;
        packages?: IIndexedPackageData[];
        harvests?: IIndexedHarvestData[];
        transfers?: IIndexedTransferData[];
      }
    ) {
      state.ancestors[depth] = [
        ...(state.ancestors[depth] || []),
        ...packages.map((pkg) => ({ pkg })),
        ...harvests.map((harvest) => ({
          harvest,
        })),
        ...transfers.map((transfer) => ({
          transfer,
        })),
      ];
    },
    [PackageHistoryMutations.SET_CHILDREN](
      state: IPackageHistoryState,
      {
        packages = [],
        harvests = [],
        transfers = [],
        depth,
      }: {
        depth: number;
        packages?: IIndexedPackageData[];
        harvests?: IIndexedHarvestData[];
        transfers?: IIndexedTransferData[];
      }
    ) {
      state.children[depth] = [
        ...(state.children[depth] || []),
        ...packages.map((pkg) => ({ pkg })),
        ...harvests.map((harvest) => ({
          harvest,
        })),
        ...transfers.map((transfer) => ({
          transfer,
        })),
      ];
    },
    [PackageHistoryMutations.SET_STATUS](
      state: IPackageHistoryState,
      { status }: { status: PackageHistoryStatus }
    ) {
      state.status = status;
      if (status === PackageHistoryStatus.INITIAL) {
        state.log = [];
        state.ancestors = [];
        state.children = [];
      }
    },
  },
  getters: {},
  actions: {
    [PackageHistoryActions.SET_SOURCE_PACKAGE]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { pkg }: { pkg: IPackageData | null }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_SOURCE_PACKAGE, { pkg });

      if (pkg) {
        ctx.commit(PackageHistoryMutations.SET_STATUS, {
          status: PackageHistoryStatus.INFLIGHT,
        });

        try {
          ctx.commit(PackageHistoryMutations.SET_ANCESTORS, {
            packages: [await getParentPackages(pkg)],
          });
          ctx.commit(PackageHistoryMutations.SET_CHILDREN, {
            packages: [await getChildPackages(pkg)],
          });
          ctx.commit(PackageHistoryMutations.SET_STATUS, {
            status: PackageHistoryStatus.SUCCESS,
          });
        } catch (e) {
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
