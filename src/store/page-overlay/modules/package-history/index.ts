import { IPackageData, IPluginState } from "@/interfaces";
import { getChildPackages, getParentPackages } from "@/utils/package";
import { ActionContext } from "vuex";
import { PackageHistoryActions, PackageHistoryMutations } from "../package-history/consts";
import { IPackageHistoryState } from "../package-history/interfaces";

const inMemoryState = {
  sourcePackage: null,
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
    [PackageHistoryMutations.SET_ANCESTORS](
      state: IPackageHistoryState,
      { packages }: { packages: IPackageData[][] }
    ) {
      state.ancestors = packages;
    },
    [PackageHistoryMutations.SET_CHILDREN](
      state: IPackageHistoryState,
      { packages }: { packages: IPackageData[][] }
    ) {
      state.children = packages;
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
        ctx.commit(PackageHistoryMutations.SET_ANCESTORS, {
          packages: [await getParentPackages(pkg)],
        });
        ctx.commit(PackageHistoryMutations.SET_CHILDREN, {
          packages: [await getChildPackages(pkg)],
        });
      } else {
        ctx.commit(PackageHistoryMutations.SET_ANCESTORS, { packages: [] });
        ctx.commit(PackageHistoryMutations.SET_CHILDREN, { packages: [] });
      }
    },
  },
};

export const packageHistoryReducer = (state: IPackageHistoryState): IPackageHistoryState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
