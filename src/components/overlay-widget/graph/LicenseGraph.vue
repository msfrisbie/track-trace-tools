<template>
  <div>
    <template v-if="graphState.status === GraphStatus.INITIAL">
      <b-button variant="outline-primary">GO</b-button>
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
      v-bind:class="{
        flex: graphState.status === GraphStatus.SUCCESS,
        hidden: graphState.status !== GraphStatus.SUCCESS,
      }"
      class="absolute right-0 top-0 p-2 flex-col gap-2 items-stretch"
      style="width: 320px; max-height: 100%"
    >
      <input
        type="search"
        class="p-2 shadow border border-gray-200"
        style="width: initial !important"
        id="search-input"
        list="suggestions"
        placeholder="Search for a package label..."
      />
      <datalist id="suggestions">
        <option
          v-for="node of graphState.graphData.nodes"
          v-bind:key="node.key"
          :value="node.key"
        ></option>
      </datalist>

      <div
        v-if="graphState.selectedNode"
        class="rounded bg-white shadow p-2 border border-gray-200 flex flex-col gap-2 overflow-auto toolkit-scroll"
      >
        <!-- <div>Node type: {{ selectedNode.attributes.obj.type }}</div>
        <hr /> -->
        <template v-if="selectedNode.attributes.obj.pkg">
          <div class="ttt-purple font-bold font-mono">
            {{ selectedNode.attributes.obj.pkg.Label }}
          </div>
          <hr />
          <div>Status: {{ selectedNode.attributes.obj.pkg.PackageState }}</div>
          <div>
            {{ selectedNode.attributes.obj.pkg.Quantity }}
            {{ selectedNode.attributes.obj.pkg.UnitOfMeasureAbbreviation }}
            {{ selectedNode.attributes.obj.pkg.Item.Name }}
          </div>
          <hr />
          <div>Sources:</div>
          <b-button
            size="sm"
            variant="outline-dark"
            @click="selectNode({ graphComponentContext, node: sourceNode })"
            v-for="sourceNode of sourceNodes"
            v-bind:key="sourceNode"
          >
            {{ sourceNode }}
          </b-button>
          <hr />
          <div>Children:</div>

          <b-button
            size="sm"
            variant="outline-dark"
            @click="selectNode({ graphComponentContext, node: childNode })"
            v-for="childNode of childNodes"
            v-bind:key="childNode"
          >
            {{ childNode }}
          </b-button>
          <hr />
          <div>History:</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { GraphActions, GraphStatus } from "@/store/page-overlay/modules/graph/consts";
import { IGraphComponentContext, IGraphNode } from "@/store/page-overlay/modules/graph/interfaces";
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
    selectedNode(): IGraphNode | null {
      if (store.state.graph.selectedNode) {
        return (
          store.state.graph.graphData.nodes.find((x) => x.key === store.state.graph.selectedNode) ??
          null
        );
      }

      return null;
    },
    sourceNodes(): string[] {
      if (!store.state.graph.selectedNode) {
        return [];
      }

      const sourceNodes = this.$data.graphComponentContext.graph.inboundNeighbors(
        store.state.graph.selectedNode
      );

      console.log({ sourceNodes });

      return sourceNodes;
    },
    childNodes(): string[] {
      if (!store.state.graph.selectedNode) {
        return [];
      }

      return this.$data.graphComponentContext.graph.outboundNeighbors(
        store.state.graph.selectedNode
      );
    },
  },
  data() {
    return {
      GraphStatus,
      graphComponentContext: null,
    };
  },
  methods: {
    ...mapActions({
      selectNode: `graph/${GraphActions.SELECT_NODE}`,
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
