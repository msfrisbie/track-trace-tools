import { IIndexedPackageData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { todayIsodate } from "@/utils/date";
import { edgeReducer, hoverRenderer, labelRenderer, nodeReducer } from "@/utils/graph";
import Graph from "graphology";
import Sigma from "sigma";
import { Coordinates } from "sigma/types";
import { ActionContext } from "vuex";
import {
  GraphActions,
  GraphGetters,
  GraphMutations,
  GraphRenderAlgorithm,
  GraphStatus,
} from "../graph/consts";
import { IGraphData, IGraphState } from "../graph/interfaces";

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
    [GraphActions.LOAD_AND_RENDER]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      data: any
    ) => {
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

      // Taken from https://codesandbox.io/s/github/jacomyal/sigma.js/tree/main/examples/use-reducers

      // Examples: https://github.com/jacomyal/sigma.js/#installation

      // Retrieve some useful DOM elements:
      const container = document.getElementById("sigma-container") as HTMLElement;
      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      // const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;

      // Instantiate sigma:
      const graph = new Graph();
      // @ts-ignore
      graph.import(packageIGraphData);

      // @ts-ignore
      graph.nodes().forEach((node, i) => {
        // @ts-ignore
        graph.setNodeAttribute(node, "x", Math.random() * 2);
        // @ts-ignore
        graph.setNodeAttribute(node, "y", Math.random());
      });

      const renderer = new Sigma(graph, container);

      ctx.state.searchQuery = "";

      ctx.state.status = GraphStatus.SUCCESS;

      // Bind search input interactions:
      searchInput.addEventListener("input", () => {
        ctx.dispatch(GraphActions.SET_SEARCH_QUERY, {
          graph,
          renderer,
          searchInput,
          query: searchInput.value || "",
        });
      });
      searchInput.addEventListener("blur", () => {
        ctx.dispatch(GraphActions.SET_SEARCH_QUERY, {
          graph,
          renderer,
          searchInput,
          query: "",
        });
      });

      // Bind graph interactions:
      renderer.on("enterNode", ({ node }) => {
        ctx.dispatch(GraphActions.SET_HOVERED_NODE, { graph, renderer, node });
      });
      renderer.on("leaveNode", () => {
        ctx.dispatch(GraphActions.SET_HOVERED_NODE, { graph, renderer });
      });

      renderer.setSetting("nodeReducer", (node, data) =>
        nodeReducer({
          node,
          data,
          graphState: ctx.state,
        })
      );

      renderer.setSetting("edgeReducer", (edge, data) =>
        edgeReducer({
          graph,
          edge,
          data,
          graphState: ctx.state,
        })
      );

      // Examples of override functions
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/demo/src/canvas-utils.ts#L34

      // Override options
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/src/settings.ts#L12
      renderer.setSetting("hoverRenderer", (context, data, settings) =>
        hoverRenderer(context, data, settings)
      );

      renderer.setSetting("labelRenderer", (context, data, settings) =>
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
        renderer.on(eventType, ({ node }) =>
          ctx.dispatch(GraphActions.HANDLE_EVENT, { eventType, sourceType: "node", source: node })
        )
      );
      edgeEvents.map((eventType) =>
        renderer.on(eventType, ({ edge }) =>
          ctx.dispatch(GraphActions.HANDLE_EVENT, { eventType, sourceType: "edge", source: edge })
        )
      );
      stageEvents.map((eventType) =>
        renderer.on(eventType, (eventType) =>
          ctx.dispatch(GraphActions.HANDLE_EVENT, { eventType, sourceType: "stage" })
        )
      );
    },
    [GraphActions.HANDLE_EVENT]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      { eventType, sourceType, source }: { eventType: string; sourceType: string; source?: string }
    ) => {
      switch (eventType) {
        case "hoverNode":
          ctx.dispatch(GraphActions.SELECT_NODE, {});
          break;
      }
      console.log({ eventType, sourceType, source });
    },
    [GraphActions.SELECT_NODE]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      { renderer, node }: { renderer: Sigma; node: string }
    ) => {
      ctx.state.selectedNode = node;
      ctx.state.suggestions = [];

      // Move the camera to center it on the selected node:
      const nodePosition = renderer.getNodeDisplayData(ctx.state.selectedNode) as Coordinates;
      renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    },
    [GraphActions.SET_SEARCH_QUERY]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      {
        graph,
        renderer,
        searchInput,
        query,
      }: {
        graph: Graph;
        renderer: Sigma;
        searchInput: HTMLInputElement;
        query: string;
      }
    ) => {
      ctx.state.searchQuery = query;

      if (searchInput.value !== query) {
        searchInput.value = query;
      }

      if (query) {
        const lcQuery = query.toLowerCase();
        const suggestions = graph
          // @ts-ignore
          .nodes()
          // @ts-ignore
          .map((n: any) => ({ id: n, label: graph.getNodeAttribute(n, "label") as string }))
          .filter(({ label }: { label: any }) => label.toLowerCase().includes(lcQuery));

        // If we have a single perfect match, them we remove the suggestions, and
        // we consider the user has selected a node through the datalist
        // autocomplete:
        if (suggestions.length === 1 && suggestions[0].label === query) {
          ctx.dispatch(GraphActions.SELECT_NODE, { renderer, node: suggestions[0].id });
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
      renderer.refresh();
    },
    [GraphActions.SET_HOVERED_NODE]: async (
      ctx: ActionContext<IGraphState, IPluginState>,
      {
        graph,
        renderer,
        node,
      }: {
        graph: Graph;
        renderer: Sigma;
        node?: string;
      }
    ) => {
      if (node) {
        ctx.state.hoveredNode = node;
        ctx.state.hoveredNeighbors =
          // @ts-ignore
          graph.neighbors(node);
      } else {
        ctx.state.hoveredNode = null;
        ctx.state.hoveredNeighbors = [];
      }

      // Refresh rendering:
      renderer.refresh();
    },
  },
};

export const graphReducer = (state: IGraphState): IGraphState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
