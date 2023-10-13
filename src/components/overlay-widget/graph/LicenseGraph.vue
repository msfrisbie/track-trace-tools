<template>
  <div>
    <template v-if="graphState.status === GraphStatus.INITIAL">
      <b-button variant="outline-primary" @click="render({ graphComponentContext })">GO</b-button>
    </template>
    <template v-if="graphState.status === GraphStatus.INFLIGHT">
      <div class="absolute top-0 w-full">
        <div class="flex flex-row items-center justify-center gap-2 p-4">
          <b-spinner small variant="ttt"></b-spinner>
          <span>Loading packages...</span>
        </div>
      </div>
    </template>
    <div id="sigma-container" class="w-full h-full m-0 p-0 overflow-hidden"></div>
    <div
      v-bind:class="{ display: graphState.status === GraphStatus.SUCCESS ? 'none' : 'flex' }"
      class="absolute right-0 top-0 p-2 flex flex-col items-stretch"
      style="width: 320px"
    >
      <input
        type="search"
        class="p-2"
        style="width: initial !important"
        id="search-input"
        list="suggestions"
        placeholder="Try searching for a node..."
      />
      <datalist id="suggestions">
        <option
          v-for="node of graphState.graphData.nodes"
          v-bind:key="node.key"
          :value="node.key"
        ></option>
      </datalist>

      <div>Selected node: {{ graphState.selectedNode }}</div>
      <div>Hovered node: {{ graphState.hoveredNode }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { GraphActions, GraphStatus } from "@/store/page-overlay/modules/graph/consts";
import { IGraphComponentContext } from "@/store/page-overlay/modules/graph/interfaces";
import Graph from "graphology";
import Sigma from "sigma";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "LicenseGraph",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      graphState: (state: IPluginState) => state.graph,
    }),
  },
  data() {
    return {
      GraphStatus,
      graphComponentContext: null,
    };
  },
  methods: {
    ...mapActions({
      loadData: `graph/${GraphActions.LOAD_DATA}`,
      initializeGraph: `graph/${GraphActions.INITIALIZE_GRAPH}`,
    }),
  },
  async created() {},
  async mounted() {
    const container = document.getElementById("sigma-container") as HTMLElement;
    const searchInput = document.getElementById("search-input") as HTMLInputElement;

    // Instantiate sigma:
    const graph = new Graph();

    const renderer = new Sigma(graph, container);

    const graphComponentContext: IGraphComponentContext = {
      renderer,
      graph,
      searchInput,
      container,
    };

    this.$data.graphComponentContext = graphComponentContext;

    await store.dispatch(`graph/${GraphActions.LOAD_DATA}`, { graphComponentContext });
    await store.dispatch(`graph/${GraphActions.INITIALIZE_GRAPH}`, { graphComponentContext });
    await store.dispatch(`graph/${GraphActions.RENDER_GRAPH}`, { graphComponentContext });

  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
