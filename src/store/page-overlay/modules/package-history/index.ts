import { MessageType } from "@/consts";
import {
  IHarvestHistoryData,
  IIndexedPackageData,
  IPackageAncestorTreeNode,
  IPackageChildTreeNode,
  IPackageData,
  IPluginState,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
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
  maxParentLookupDepth: null,
  maxChildLookupDepth: null,
  maxParentVisibleDepth: 20,
  maxChildVisibleDepth: 20,
  parentZoom: 1,
  childZoom: 1,
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
    [PackageHistoryMutations.SET_MAX_PARENT_LOOKUP_DEPTH](
      state: IPackageHistoryState,
      { maxParentLookupDepth }: { maxParentLookupDepth: number | null }
    ) {
      state.maxParentLookupDepth = maxParentLookupDepth;
    },
    [PackageHistoryMutations.SET_MAX_CHILD_LOOKUP_DEPTH](
      state: IPackageHistoryState,
      { maxChildLookupDepth }: { maxChildLookupDepth: number | null }
    ) {
      state.maxChildLookupDepth = maxChildLookupDepth;
    },
    [PackageHistoryMutations.SET_MAX_PARENT_VISIBLE_DEPTH](
      state: IPackageHistoryState,
      { maxParentVisibleDepth }: { maxParentVisibleDepth: number }
    ) {
      state.maxParentVisibleDepth = maxParentVisibleDepth;
    },
    [PackageHistoryMutations.SET_MAX_CHILD_VISIBLE_DEPTH](
      state: IPackageHistoryState,
      { maxChildVisibleDepth }: { maxChildVisibleDepth: number }
    ) {
      state.maxChildVisibleDepth = maxChildVisibleDepth;
    },
    [PackageHistoryMutations.SET_PARENT_ZOOM](
      state: IPackageHistoryState,
      { parentZoom }: { parentZoom: number }
    ) {
      state.parentZoom = parentZoom;
    },
    [PackageHistoryMutations.SET_CHILD_ZOOM](
      state: IPackageHistoryState,
      { childZoom }: { childZoom: number }
    ) {
      state.childZoom = childZoom;
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

      const stack: [IPackageAncestorTreeNode, number][] = [[state.ancestorTree, 0]];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageAncestorTreeNode, number];

        if (state.maxParentLookupDepth !== null && depth > state.maxParentLookupDepth) {
          continue;
        }

        if (!packageMap.has(node.label)) {
          packageMap.set(node.label, node);
        }

        node.ancestors.map((ancestor) => stack.push([ancestor, depth + 1]));
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

        if (state.maxParentLookupDepth !== null && depth > state.maxParentLookupDepth) {
          continue;
        }

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

      const stack: [IPackageChildTreeNode, number][] = [[state.childTree, 0]];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageChildTreeNode, number];

        if (state.maxChildLookupDepth !== null && depth > state.maxChildLookupDepth) {
          continue;
        }

        if (!packageMap.has(node.label)) {
          packageMap.set(node.label, node);
        }

        node.children.map((child) => stack.push([child, depth + 1]));
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

        if (state.maxChildLookupDepth !== null && depth > state.maxChildLookupDepth) {
          continue;
        }

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
      analyticsManager.track(MessageType.GENERATE_PACKAGE_HISTORY, { pkg });

      if (!clientBuildManager.assertValues(["ENABLE_PACKAGE_HISTORY"])) {
        return;
      }

      ctx.commit(PackageHistoryMutations.SET_SOURCE_PACKAGE, { pkg });

      ctx.commit(PackageHistoryMutations.SET_STATUS, {
        status: PackageHistoryStatus.INITIAL,
      });

      ctx.commit(PackageHistoryMutations.SET_MAX_PARENT_LOOKUP_DEPTH, {
        maxParentLookupDepth: null,
      });

      ctx.commit(PackageHistoryMutations.SET_MAX_CHILD_LOOKUP_DEPTH, {
        maxChildLookupDepth: null,
      });
      ctx.commit(PackageHistoryMutations.SET_MAX_PARENT_VISIBLE_DEPTH, {
        maxParentVisibleDepth: 20,
      });

      ctx.commit(PackageHistoryMutations.SET_MAX_CHILD_VISIBLE_DEPTH, {
        maxChildVisibleDepth: 20,
      });
      ctx.commit(PackageHistoryMutations.SET_PARENT_ZOOM, {
        parentZoom: 1,
      });

      ctx.commit(PackageHistoryMutations.SET_CHILD_ZOOM, {
        childZoom: 1,
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
          if (ctx.state.status !== PackageHistoryStatus.HALTED) {
            ctx.commit(PackageHistoryMutations.SET_STATUS, {
              status: PackageHistoryStatus.SUCCESS,
            });
          }
          analyticsManager.track(MessageType.GENERATE_PACKAGE_HISTORY_SUCCESS);
        } catch (e) {
          console.error(e);
          analyticsManager.track(MessageType.GENERATE_PACKAGE_HISTORY_ERROR, { e });
          ctx.commit(PackageHistoryMutations.LOG_EVENT, {
            event: e.toString(),
          });
          ctx.commit(PackageHistoryMutations.SET_STATUS, {
            status: PackageHistoryStatus.ERROR,
          });
        }
      }
    },
    [PackageHistoryActions.SET_MAX_PARENT_LOOKUP_DEPTH]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { maxParentLookupDepth }: { maxParentLookupDepth: number | null }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_MAX_PARENT_LOOKUP_DEPTH, { maxParentLookupDepth });
    },
    [PackageHistoryActions.SET_MAX_CHILD_LOOKUP_DEPTH]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { maxChildLookupDepth }: { maxChildLookupDepth: number | null }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_MAX_CHILD_LOOKUP_DEPTH, { maxChildLookupDepth });
    },

    [PackageHistoryActions.SET_MAX_PARENT_VISIBLE_DEPTH]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { maxParentVisibleDepth }: { maxParentVisibleDepth: number }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_MAX_PARENT_VISIBLE_DEPTH, { maxParentVisibleDepth });
    },
    [PackageHistoryActions.SET_MAX_CHILD_VISIBLE_DEPTH]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { maxChildVisibleDepth }: { maxChildVisibleDepth: number }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_MAX_CHILD_VISIBLE_DEPTH, { maxChildVisibleDepth });
    },
    [PackageHistoryActions.SET_PARENT_ZOOM]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { parentZoom }: { parentZoom: number }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_PARENT_ZOOM, { parentZoom });
    },
    [PackageHistoryActions.SET_CHILD_ZOOM]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { childZoom }: { childZoom: number }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_CHILD_ZOOM, { childZoom });
    },
    [PackageHistoryActions.LOG_EVENT]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { event }: { event: string }
    ) => {
      ctx.commit(PackageHistoryMutations.LOG_EVENT, { event });
    },
    [PackageHistoryActions.HALT]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      {}
    ) => {
      ctx.commit(PackageHistoryMutations.SET_STATUS, {
        status: PackageHistoryStatus.HALTED,
      });
    },
  },
};

export const packageHistoryReducer = (state: IPackageHistoryState): IPackageHistoryState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
