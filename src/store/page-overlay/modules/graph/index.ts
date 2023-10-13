import { IIndexedPackageData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { todayIsodate } from "@/utils/date";
import { edgeReducer, hoverRenderer, labelRenderer, nodeReducer } from "@/utils/graph";
import { Coordinates } from "sigma/types";
import { ActionContext } from "vuex";
import {
  GraphActions,
  GraphGetters,
  GraphMutations,
  GraphRenderAlgorithm,
  GraphStatus,
} from "../graph/consts";
import { IGraphComponentContext, IGraphData, IGraphState } from "../graph/interfaces";

const inMemoryState = {
  status: GraphStatus.INITIAL,
  renderAlgorithm: GraphRenderAlgorithm.RANDOM,
  filterDateGt: false,
  dateGt: todayIsodate(),
  filterDateLt: false,
  dateLt: todayIsodate(),
  licenseOptions: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  licenses: facilityManager.cachedFacilities.map((x) => x.licenseNumber),
  graphData: {
    nodes: [],
    edges: [],
  },
  hoveredNode: null,
  searchQuery: null,
  selectedNode: null,
  suggestions: [],
  hoveredNeighbors: [],
};

const persistedState = {};

const defaultState: IGraphState = {
  ...inMemoryState,
  ...persistedState,
};

export const graphModule = {
  state: () => defaultState,
  mutations: {
    [GraphMutations.GRAPH_MUTATION](state: IGraphState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [GraphGetters.GRAPH_GETTER]: (
      state: IGraphState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [GraphActions.LOAD_DATA]: async (ctx: ActionContext<IGraphState, IPluginState>, {}: {}) => {
      ctx.state.status = GraphStatus.INFLIGHT;

      let packages: IIndexedPackageData[] = [];

      await Promise.allSettled([
        primaryDataLoader.activePackages().then((result) => {
          packages = [...packages, ...result];
        }),
        // primaryDataLoader.onHoldPackages().then((result) => {
        //   packages = [...packages, ...result];
        // }),
        // primaryDataLoader.inactivePackages().then((result) => {
        //   packages = [...packages, ...result];
        // }),
        // primaryDataLoader.inTransitPackages().then((result) => {
        //   packages = [...packages, ...result];
        // }),
      ]);

      const packageLabels = new Set(packages.map((x) => x.Label));

      const packageIGraphData: IGraphData = {
        nodes: packages.map((pkg) => ({
          key: pkg.Label,
          attributes: {
            size: 2,
            label: pkg.Label,
            color: "#49276a",
            obj: {
              pkg,
            },
          },
        })),
        edges: [],
      };

      for (const [i, pkg] of packages.entries()) {
        for (const [j, sourcePkgLabel] of pkg.SourcePackageLabels.split(",").entries()) {
          if (packageLabels.has(sourcePkgLabel)) {
            packageIGraphData.edges.push({
              key: `${pkg.Label}::${j}`,
              source: sourcePkgLabel,
              target: pkg.Label,
              attributes: {
                size: 1,
                type: "arrow",
              },
            });
          }
        }
      }

      ctx.state.graphData = packageIGraphData;

      ctx.state.status = GraphStatus.SUCCESS;
    },
    [GraphActions.RENDER_GRAPH]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      { graphComponentContext }: { graphComponentContext: IGraphComponentContext }
    ) => {
      // @ts-ignore
      graphComponentContext.graph.import(ctx.state.graphData);

      // @ts-ignore
      graphComponentContext.graph.nodes().forEach((node, i) => {
        // @ts-ignore
        graphComponentContext.graph.setNodeAttribute(node, "x", Math.random() * 2);
        // @ts-ignore
        graphComponentContext.graph.setNodeAttribute(node, "y", Math.random());
      });
    },
    [GraphActions.INITIALIZE_GRAPH]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      { graphComponentContext }: { graphComponentContext: IGraphComponentContext }
    ) => {
      if (!ctx.state.graphData) {
        toastManager.openToast("No graph data loaded", {
          title: "Graph Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        return;
      }

      // Taken from https://codesandbox.io/s/github/jacomyal/sigma.js/tree/main/examples/use-reducers

      // Examples: https://github.com/jacomyal/sigma.js/#installation

      ctx.state.searchQuery = "";

      // Bind search input interactions:
      graphComponentContext.searchInput.addEventListener("input", () => {
        ctx.dispatch(GraphActions.SET_SEARCH_QUERY, {
          graphComponentContext,
          query: graphComponentContext.searchInput.value || "",
        });
      });
      graphComponentContext.searchInput.addEventListener("blur", () => {
        ctx.dispatch(GraphActions.SET_SEARCH_QUERY, {
          graphComponentContext,
          query: "",
        });
      });

      // Bind graph interactions:
      graphComponentContext.renderer.on("enterNode", ({ node }) => {
        ctx.dispatch(GraphActions.SET_HOVERED_NODE, { graphComponentContext, node });
      });
      graphComponentContext.renderer.on("leaveNode", () => {
        ctx.dispatch(GraphActions.SET_HOVERED_NODE, { graphComponentContext });
      });

      graphComponentContext.renderer.setSetting("nodeReducer", (node, data) =>
        nodeReducer({
          graphComponentContext,
          node,
          data,
          graphState: ctx.state,
        })
      );

      graphComponentContext.renderer.setSetting("edgeReducer", (edge, data) =>
        edgeReducer({
          graphComponentContext,
          edge,
          data,
          graphState: ctx.state,
        })
      );

      // Examples of override functions
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/demo/src/canvas-utils.ts#L34

      // Override options
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/src/settings.ts#L12
      graphComponentContext.renderer.setSetting("hoverRenderer", (context, data, settings) =>
        hoverRenderer(context, data, settings)
      );

      graphComponentContext.renderer.setSetting("labelRenderer", (context, data, settings) =>
        labelRenderer(context, data, settings)
      );

      // https://github.com/jacomyal/sigma.js/blob/main/examples/custom-rendering/index.ts
      // renderer.setSetting("nodeProgramClasses", {
      //   image: getNodeProgramImage(),
      // });

      const nodeEvents = [
        "enterNode",
        "leaveNode",
        "downNode",
        "clickNode",
        "rightClickNode",
        "doubleClickNode",
        "wheelNode",
      ] as const;
      const edgeEvents = [
        "downEdge",
        "clickEdge",
        "rightClickEdge",
        "doubleClickEdge",
        "wheelEdge",
      ] as const;
      const stageEvents = ["downStage", "clickStage", "doubleClickStage", "wheelStage"] as const;

      nodeEvents.map((eventType) =>
        graphComponentContext.renderer.on(eventType, ({ node }) =>
          ctx.dispatch(GraphActions.HANDLE_EVENT, {
            graphComponentContext,
            eventType,
            sourceType: "node",
            source: node,
          })
        )
      );
      edgeEvents.map((eventType) =>
        graphComponentContext.renderer.on(eventType, ({ edge }) =>
          ctx.dispatch(GraphActions.HANDLE_EVENT, {
            graphComponentContext,
            eventType,
            sourceType: "edge",
            source: edge,
          })
        )
      );
      stageEvents.map((eventType) =>
        graphComponentContext.renderer.on(eventType, (eventType) =>
          ctx.dispatch(GraphActions.HANDLE_EVENT, {
            graphComponentContext,
            eventType,
            sourceType: "stage",
          })
        )
      );
    },
    [GraphActions.HANDLE_EVENT]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      {
        graphComponentContext,
        eventType,
        sourceType,
        source,
      }: {
        graphComponentContext: IGraphComponentContext;
        eventType: string;
        sourceType: string;
        source?: string;
      }
    ) => {
      switch (eventType) {
        case "clickNode":
          ctx.dispatch(GraphActions.SELECT_NODE, {
            graphComponentContext,
            node: source,
          });
          break;
      }

      if (sourceType === "stage") {
        ctx.dispatch(GraphActions.SELECT_NODE, {
          graphComponentContext,
          node: null,
        });
      }

      console.log({ eventType, sourceType, source });
    },
    [GraphActions.SELECT_NODE]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      {
        graphComponentContext,
        node,
      }: { graphComponentContext: IGraphComponentContext; node: string }
    ) => {
      ctx.state.selectedNode = node;
      ctx.state.suggestions = [];

      // Move the camera to center it on the selected node:
      const nodePosition: Coordinates = node
        ? (graphComponentContext.renderer.getNodeDisplayData(ctx.state.selectedNode) as Coordinates)
        : { x: 0.5, y: 0.5 };
      graphComponentContext.renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    },
    [GraphActions.SET_SEARCH_QUERY]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      {
        graphComponentContext,
        query,
      }: {
        graphComponentContext: IGraphComponentContext;
        query: string;
      }
    ) => {
      ctx.state.searchQuery = query;

      if (graphComponentContext.searchInput.value !== query) {
        graphComponentContext.searchInput.value = query;
      }

      if (query) {
        const lcQuery = query.toLowerCase();
        const suggestions = graphComponentContext.graph
          // @ts-ignore
          .nodes()
          .map((n: any) => ({
            id: n,
            // @ts-ignore
            label: graphComponentContext.graph.getNodeAttribute(n, "label") as string,
          }))
          .filter(({ label }: { label: any }) => label.toLowerCase().includes(lcQuery));

        // If we have a single perfect match, them we remove the suggestions, and
        // we consider the user has selected a node through the datalist
        // autocomplete:
        if (suggestions.length === 1 && suggestions[0].label === query) {
          ctx.dispatch(GraphActions.SELECT_NODE, {
            graphComponentContext,
            node: suggestions[0].id,
          });
        }
        // Else, we display the suggestions list:
        else {
          ctx.state.selectedNode = null;
          ctx.state.suggestions = suggestions.map(({ id }: { id: any }) => id);
        }
      }
      // If the query is empty, then we reset the selectedNode / suggestions ctx.state:
      else {
        ctx.state.selectedNode = null;
        ctx.state.suggestions = [];
      }

      // Refresh rendering:
      graphComponentContext.renderer.refresh();
    },
    [GraphActions.SET_HOVERED_NODE]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      {
        graphComponentContext,
        node,
      }: {
        graphComponentContext: IGraphComponentContext;
        node?: string;
      }
    ) => {
      if (node) {
        ctx.state.hoveredNode = node;
        ctx.state.hoveredNeighbors =
          // @ts-ignore
          graphComponentContext.graph.neighbors(node);
      } else {
        ctx.state.hoveredNode = null;
        ctx.state.hoveredNeighbors = [];
      }

      // Refresh rendering:
      graphComponentContext.renderer.refresh();
    },
  },
};

export const graphReducer = (state: IGraphState): IGraphState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
