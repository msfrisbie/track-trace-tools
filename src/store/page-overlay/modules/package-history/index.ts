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
import _ from "lodash";
import { ActionContext } from "vuex";
import {
  PackageHistoryActions,
  PackageHistoryGetters,
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
      state.log = [timestampedEvent, ...state.log];
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
  getters: {
    [PackageHistoryGetters.ANCESTOR_LIST]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IPackageAncestorTreeNode[] => {
      if (!state.ancestorTree) {
        return [];
      }

      const packageMap: Map<string, IPackageAncestorTreeNode> = new Map();

      const stack = [state.ancestorTree];

      while (stack.length > 0) {
        const node = stack.pop() as IPackageAncestorTreeNode;

        if (!packageMap.has(node.label)) {
          packageMap.set(node.label, node);
        }

        node.ancestors.map((ancestor) =>
          stack.push({
            ...ancestor,
          })
        );
      }

      return _.orderBy([...packageMap.values()], ["pkg.LicenseNumber", "label"], ["asc", "asc"]);
    },
    [PackageHistoryGetters.ANCESTOR_GENERATIONS]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IPackageAncestorTreeNode[][] => {
      const generations: IPackageAncestorTreeNode[][] = [];

      if (!state.ancestorTree) {
        return [];
      }

      const stack: [IPackageAncestorTreeNode, number][] = [[state.ancestorTree, 0]];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageAncestorTreeNode, number];

        if (typeof generations[depth] !== "object") {
          generations[depth] = [];
        }

        if (!generations[depth].includes(node)) {
          generations[depth].push(node);
        }

        for (const ancestor of node.ancestors) {
          stack.push([ancestor, depth + 1]);
        }
      }

      return generations;
    },
    [PackageHistoryGetters.CHILD_LIST]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IPackageChildTreeNode[] => {
      if (!state.childTree) {
        return [];
      }

      const packageMap: Map<string, IPackageChildTreeNode> = new Map();

      const stack = [state.childTree];

      while (stack.length > 0) {
        const node = stack.pop() as IPackageChildTreeNode;

        if (!packageMap.has(node.label)) {
          packageMap.set(node.label, node);
        }

        node.children.map((child) =>
          stack.push({
            ...child,
          })
        );
      }

      return _.orderBy([...packageMap.values()], ["pkg.LicenseNumber", "label"], ["asc", "asc"]);
    },
    [PackageHistoryGetters.CHILD_GENERATIONS]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IPackageChildTreeNode[][] => {
      const generations: IPackageChildTreeNode[][] = [];

      if (!state.childTree) {
        return [];
      }

      const stack: [IPackageChildTreeNode, number][] = [[state.childTree, 0]];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageChildTreeNode, number];

        if (typeof generations[depth] !== "object") {
          generations[depth] = [];
        }

        if (!generations[depth].includes(node)) {
          generations[depth].push(node);
        }

        for (const child of node.children) {
          stack.push([child, depth + 1]);
        }
      }

      return generations;
    },
  },
  actions: {
    [PackageHistoryActions.SET_SOURCE_PACKAGE]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { pkg }: { pkg: IIndexedPackageData | null }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_SOURCE_PACKAGE, { pkg });

      ctx.commit(PackageHistoryMutations.SET_STATUS, {
        status: PackageHistoryStatus.INITIAL,
      });

      if (pkg) {
        ctx.commit(PackageHistoryMutations.SET_STATUS, {
          status: PackageHistoryStatus.INFLIGHT,
        });

        try {
          try {
            ctx.commit(PackageHistoryMutations.SET_SOURCE_HARVESTS, {
              sourceHarvests: await getParentHarvests(pkg.Label),
            });
          } catch (e) {
            console.error("Cannot load source harvests", e);
          }
          ctx.commit(PackageHistoryMutations.SET_ANCESTORS, {
            ancestorTree: await getParentPackageHistoryTree({
              label: pkg.Label,
            }),
          });
          ctx.commit(PackageHistoryMutations.SET_CHILDREN, {
            childTree: await getChildPackageHistoryTree({
              label: pkg.Label,
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
