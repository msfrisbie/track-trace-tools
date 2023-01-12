import { HistoryTreeNodeType, MessageType } from "@/consts";
import {
  IChildPackageTree,
  IChildPackageTreeNode,
  IHarvestHistoryData,
  IIndexedPackageData,
  IPackageData,
  IParentPackageTree,
  IParentPackageTreeNode,
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
  parentTree: null,
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
    [PackageHistoryMutations.SET_PARENTS](
      state: IPackageHistoryState,
      {
        parentTree,
      }: {
        parentTree: IParentPackageTree;
      }
    ) {
      state.parentTree = parentTree;
    },
    [PackageHistoryMutations.SET_CHILDREN](
      state: IPackageHistoryState,
      {
        childTree,
      }: {
        childTree: IChildPackageTree;
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
        state.parentTree = null;
        state.childTree = null;
        state.sourceHarvests = [];
      }
    },
  },
  getters: {
    [PackageHistoryGetters.PARENT_LIST]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IParentPackageTreeNode[] => {
      if (!state.parentTree) {
        return [];
      }

      if (!state.sourcePackage) {
        return [];
      }

      const nodes: IParentPackageTreeNode[] = Object.entries(state.parentTree).map(([k, v]) => {
        if (v) {
          return v;
        } else {
          return {
            label: k,
            type: HistoryTreeNodeType.UNOWNED_PACKAGE,
            parentLabels: [],
            history: [],
            pkg: {} as IIndexedPackageData,
          };
        }
      }) as IParentPackageTreeNode[];

      return _.orderBy(nodes, ["pkg.LicenseNumber", "label"], ["asc", "asc"]);
    },
    [PackageHistoryGetters.PARENT_GENERATIONS]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IParentPackageTreeNode[][] => {
      const generations: IParentPackageTreeNode[][] = [];

      if (!state.parentTree) {
        return [];
      }

      if (!state.sourcePackage) {
        return [];
      }

      const rootNode = state.parentTree[state.sourcePackage.Label];

      if (!rootNode) {
        return [];
      }

      const stack: [IParentPackageTreeNode, number][] = [[rootNode, 0]];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IParentPackageTreeNode, number];

        if (state.maxLookupDepth !== null && depth > state.maxLookupDepth) {
          continue;
        }

        if (typeof generations[depth] !== "object") {
          generations[depth] = [];
        }

        if (!generations[depth].find((x) => x.label === node.label)) {
          generations[depth].push(node);
        }

        for (const parentLabel of node.parentLabels) {
          const parentNode: IParentPackageTreeNode = state.parentTree[parentLabel] || {
            label: parentLabel,
            type: HistoryTreeNodeType.UNOWNED_PACKAGE,
            parentLabels: [],
            history: [],
            pkg: {} as IIndexedPackageData,
          };

          stack.push([parentNode, depth + 1]);
        }
      }

      return generations;
    },
    [PackageHistoryGetters.CHILD_LIST]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IChildPackageTreeNode[] => {
      if (!state.childTree) {
        return [];
      }

      if (!state.sourcePackage) {
        return [];
      }

      const nodes: IChildPackageTreeNode[] = Object.entries(state.childTree).map(([k, v]) => {
        if (v) {
          return v;
        } else {
          return {
            label: k,
            type: HistoryTreeNodeType.UNOWNED_PACKAGE,
            childLabels: [],
            history: [],
            pkg: {} as IIndexedPackageData,
          };
        }
      }) as IChildPackageTreeNode[];

      return _.orderBy(nodes, ["pkg.LicenseNumber", "label"], ["asc", "asc"]);
    },
    [PackageHistoryGetters.CHILD_GENERATIONS]: (
      state: IPackageHistoryState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IChildPackageTreeNode[][] => {
      const generations: IChildPackageTreeNode[][] = [];

      if (!state.childTree) {
        return [];
      }

      if (!state.sourcePackage) {
        return [];
      }

      const rootNode = state.childTree[state.sourcePackage.Label];

      if (!rootNode) {
        return [];
      }

      const stack: [IChildPackageTreeNode, number][] = [[rootNode, 0]];

      while (stack.length > 0) {
        const [node, depth] = stack.pop() as [IChildPackageTreeNode, number];

        if (state.maxLookupDepth !== null && depth > state.maxLookupDepth) {
          continue;
        }

        if (typeof generations[depth] !== "object") {
          generations[depth] = [];
        }

        if (!generations[depth].find((x) => x.label === node.label)) {
          generations[depth].push(node);
        }

        for (const childLabel of node.childLabels) {
          const childNode: IChildPackageTreeNode = state.childTree[childLabel] || {
            label: childLabel,
            type: HistoryTreeNodeType.UNOWNED_PACKAGE,
            childLabels: [],
            history: [],
            pkg: {} as IIndexedPackageData,
          };

          stack.push([childNode, depth + 1]);
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
            (parentTree) => {
              ctx.commit(PackageHistoryMutations.SET_PARENTS, {
                parentTree: _.cloneDeep(parentTree),
              });
            },
            100,
            { maxWait: 500 }
          );
          await getParentPackageHistoryTree({
            label: pkg.Label,
            callback: parentCallback,
          });

          const childCallback = _.debounce(
            (childTree) => {
              ctx.commit(PackageHistoryMutations.SET_CHILDREN, {
                childTree: _.cloneDeep(childTree),
              });
            },
            100,
            { maxWait: 500 }
          );
          await getChildPackageHistoryTree({
            label: pkg.Label,
            callback: childCallback,
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
