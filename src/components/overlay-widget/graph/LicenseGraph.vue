<template>
  <div>
    <template v-if="inflight">
      <div class="absolute top-0 w-full">
        <div class="flex flex-row items-center justify-center">
          <span>Loading packages...</span>
          <b-spinner small></b-spinner>
        </div>
      </div>
    </template>
    <div id="sigma-container"></div>
    <div id="search">
      <input
        type="search"
        id="search-input"
        list="suggestions"
        placeholder="Try searching for a node..."
      />
      <datalist id="suggestions">
        <option v-for="node of data.nodes" v-bind:key="node.label" :value="node.label"></option>
      </datalist>
    </div>
  </div>
</template>

<script lang="ts">
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  edgeReducer,
  GraphData,
  hoverRenderer,
  labelRenderer,
  nodeReducer,
  setHoveredNode,
  setSearchQuery,
  State,
} from "@/utils/graph";
import Graph from "graphology";
import Sigma from "sigma";
import Vue from "vue";
import { mapState } from "vuex";
// import NodeProgramBorder from "./node.border";

export default Vue.extend({
  name: "LicenseGraph",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      inflight: false,
      data: {
        nodes: [],
        edges: [],
      },
    };
  },
  methods: {
    async loadData() {
      const activePackages = await primaryDataLoader.activePackages();

      const packageLabels = new Set(activePackages.map((x) => x.Label));

      const packageGraphData: GraphData = {
        nodes: activePackages.map((pkg) => ({
          key: pkg.Label,
          attributes: {
            size: 4,
            label: pkg.Label,
            color: "#cccccc",
          },
        })),
        edges: [],
      };

      for (const [i, pkg] of activePackages.entries()) {
        for (const [j, sourcePkgLabel] of pkg.SourcePackageLabels.split(",").entries()) {
          if (packageLabels.has(sourcePkgLabel)) {
            packageGraphData.edges.push({
              key: `${pkg.Label}::${j}`,
              source: sourcePkgLabel,
              target: pkg.Label,
              attributes: {
                size: 4,
                type: "arrow",
                label: "Source",
              },
            });
          }
        }
      }

      // this.$data.data = data;
      this.$data.data = packageGraphData;
    },
    async render() {
      this.$data.inflight = true;

      await this.loadData();

      // Taken from https://codesandbox.io/s/github/jacomyal/sigma.js/tree/main/examples/use-reducers

      // Examples: https://github.com/jacomyal/sigma.js/#installation

      // Retrieve some useful DOM elements:
      const container = document.getElementById("sigma-container") as HTMLElement;
      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      // const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;

      // Instantiate sigma:
      const graph = new Graph();
      // @ts-ignore
      graph.import(this.$data.data);

      // @ts-ignore
      graph.nodes().forEach((node, i) => {
        // @ts-ignore
        graph.setNodeAttribute(node, "x", Math.random() * 2);
        // @ts-ignore
        graph.setNodeAttribute(node, "y", Math.random());
      });

      const renderer = new Sigma(graph, container);

      const state: State = { searchQuery: "" };

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

      this.$data.inflight = false;

      // Bind search input interactions:
      searchInput.addEventListener("input", () => {
        setSearchQuery(state, graph, renderer, searchInput, searchInput.value || "");
      });
      searchInput.addEventListener("blur", () => {
        setSearchQuery(state, graph, renderer, searchInput, "");
      });

      // Bind graph interactions:
      renderer.on("enterNode", ({ node }) => {
        setHoveredNode(graph, state, renderer, node);
      });
      renderer.on("leaveNode", () => {
        setHoveredNode(graph, state, renderer, undefined);
      });

      renderer.setSetting("nodeReducer", (node, data) => nodeReducer(state, node, data));

      renderer.setSetting("edgeReducer", (edge, data) => edgeReducer(state, edge, data));

      // Examples of override functions
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/demo/src/canvas-utils.ts#L34

      // Override options
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/src/settings.ts#L12
      renderer.setSetting("hoverRenderer", hoverRenderer);

      renderer.setSetting("labelRenderer", labelRenderer);

      // https://github.com/jacomyal/sigma.js/blob/main/examples/custom-rendering/index.ts
      // renderer.setSetting("nodeProgramClasses", {
      //   image: getNodeProgramImage(),
      // });
    },
  },
  async created() {},
  async mounted() {
    this.render();
  },
});
</script>

<style type="text/scss" lang="scss" scoped>
#sigma-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#search {
  position: absolute;
  right: 1em;
  top: 1em;
}
</style>
