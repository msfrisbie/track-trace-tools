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
  maxLookupDepth: null,
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
    [PackageHistoryMutations.SET_MAX_LOOKUP_DEPTH](
      state: IPackageHistoryState,
      { maxLookupDepth }: { maxLookupDepth: number | null }
    ) {
      state.maxLookupDepth = maxLookupDepth;
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

      if (!state.sourcePackage) {
        return [];
      }

      const packageMap: Map<string, IPackageAncestorTreeNode> = new Map();

      const stack: [IPackageAncestorTreeNode, number][] = [
        [state.ancestorTree[state.sourcePackage.Label], 0],
      ];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageAncestorTreeNode, number];

        if (state.maxLookupDepth !== null && depth > state.maxLookupDepth) {
          continue;
        }

        if (!packageMap.has(node.label)) {
          packageMap.set(node.label, node);
        }

        node.ancestors.map((ancestor) =>
          stack.push([
            // @ts-ignore
            state.ancestorTree[ancestor],
            depth + 1,
          ])
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

      if (!state.sourcePackage) {
        return [];
      }

      const stack: [IPackageAncestorTreeNode, number][] = [
        [state.ancestorTree[state.sourcePackage.Label], 0],
      ];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageAncestorTreeNode, number];

        if (state.maxLookupDepth !== null && depth > state.maxLookupDepth) {
          continue;
        }

        if (typeof generations[depth] !== "object") {
          generations[depth] = [];
        }

        if (!generations[depth].includes(node)) {
          generations[depth].push(node);
        }

        for (const ancestor of node.ancestors) {
          stack.push([state.ancestorTree[ancestor], depth + 1]);
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

      if (!state.sourcePackage) {
        return [];
      }

      const packageMap: Map<string, IPackageChildTreeNode> = new Map();

      const stack: [IPackageChildTreeNode, number][] = [
        [state.childTree[state.sourcePackage.Label], 0],
      ];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageChildTreeNode, number];

        if (state.maxLookupDepth !== null && depth > state.maxLookupDepth) {
          continue;
        }

        if (!packageMap.has(node.label)) {
          packageMap.set(node.label, node);
        }

        node.children.map((child) =>
          stack.push([
            // @ts-ignore
            state.childTree[child],
            depth + 1,
          ])
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

      if (!state.sourcePackage) {
        return [];
      }

      const stack: [IPackageChildTreeNode, number][] = [
        [state.childTree[state.sourcePackage.Label], 0],
      ];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IPackageChildTreeNode, number];

        if (state.maxLookupDepth !== null && depth > state.maxLookupDepth) {
          continue;
        }

        if (typeof generations[depth] !== "object") {
          generations[depth] = [];
        }

        if (!generations[depth].includes(node)) {
          generations[depth].push(node);
        }

        for (const child of node.children) {
          stack.push([state.childTree[child], depth + 1]);
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

      ctx.commit(PackageHistoryMutations.SET_MAX_LOOKUP_DEPTH, { maxLookupDepth: null });

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

          const parentCallback = _.debounce(
            (node) => {
              console.log("setting ancestors");
              ctx.commit(PackageHistoryMutations.SET_ANCESTORS, {
                ancestorTree: _.cloneDeep(node),
              });
            },
            2000,
            { maxWait: 5000 }
          );
          const rootParentNode = await getParentPackageHistoryTree({
            label: pkg.Label,
            // callback: parentCallback,
          });
          // parentCallback(rootParentNode);
          // console.log(JSON.stringify(rootParentNode, null, 2));

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
    [PackageHistoryActions.SET_MAX_LOOKUP_DEPTH]: async (
      ctx: ActionContext<IPackageHistoryState, IPluginState>,
      { maxLookupDepth }: { maxLookupDepth: number | null }
    ) => {
      ctx.commit(PackageHistoryMutations.SET_MAX_LOOKUP_DEPTH, { maxLookupDepth });
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
