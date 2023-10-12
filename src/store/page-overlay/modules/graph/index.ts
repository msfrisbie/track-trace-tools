import { IIndexedPackageData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { todayIsodate } from "@/utils/date";
import {
  edgeReducer,
  hoverRenderer,
  labelRenderer,
  nodeReducer,
  setHoveredNode,
  setSearchQuery,
} from "@/utils/graph";
import Graph from "graphology";
import Sigma from "sigma";
import { ActionContext } from "vuex";
import { GraphActions, GraphGetters, GraphMutations } from "../graph/consts";
import { GraphData, IGraphState } from "../graph/interfaces";

const inMemoryState = {
  inflight: false,
  dateGt: todayIsodate(),
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
      ctx.state.inflight = true;

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

      const packageGraphData: GraphData = {
        nodes: packages.map((pkg) => ({
          key: pkg.Label,
          attributes: {
            size: 2,
            label: pkg.Label,
            color: "#49276a",
            // obj: {
            //   pkg,
            // },
          },
        })),
        edges: [],
      };

      for (const [i, pkg] of packages.entries()) {
        for (const [j, sourcePkgLabel] of pkg.SourcePackageLabels.split(",").entries()) {
          if (packageLabels.has(sourcePkgLabel)) {
            packageGraphData.edges.push({
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

      ctx.state.graphData = packageGraphData;

      // Taken from https://codesandbox.io/s/github/jacomyal/sigma.js/tree/main/examples/use-reducers

      // Examples: https://github.com/jacomyal/sigma.js/#installation

      // Retrieve some useful DOM elements:
      const container = document.getElementById("sigma-container") as HTMLElement;
      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      // const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;

      // Instantiate sigma:
      const graph = new Graph();
      // @ts-ignore
      graph.import(packageGraphData);

      // @ts-ignore
      graph.nodes().forEach((node, i) => {
        // @ts-ignore
        graph.setNodeAttribute(node, "x", Math.random() * 2);
        // @ts-ignore
        graph.setNodeAttribute(node, "y", Math.random());
      });

      const renderer = new Sigma(graph, container);

      ctx.state.searchQuery = "";

      ctx.state.inflight = false;

      // Bind search input interactions:
      searchInput.addEventListener("input", () => {
        setSearchQuery(graph, renderer, searchInput, searchInput.value || "");
      });
      searchInput.addEventListener("blur", () => {
        setSearchQuery(graph, renderer, searchInput, "");
      });

      // Bind graph interactions:
      renderer.on("enterNode", ({ node }) => {
        setHoveredNode(graph, renderer, node);
      });
      renderer.on("leaveNode", () => {
        setHoveredNode(graph, renderer);
      });

      renderer.setSetting("nodeReducer", (node, data) => nodeReducer(node, data));

      renderer.setSetting("edgeReducer", (edge, data) => edgeReducer(graph, edge, data));

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

      nodeEvents.forEach((eventType) =>
        renderer.on(eventType, ({ node }) => console.log(eventType, "node", node))
      );
      edgeEvents.forEach((eventType) =>
        renderer.on(eventType, ({ edge }) => console.log(eventType, "edge", edge))
      );
      stageEvents.forEach((eventType) =>
        renderer.on(eventType, (eventType) => console.log(eventType, "stage"))
      );
    },
  },
};

export const graphReducer = (state: IGraphState): IGraphState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
