<template>
  <div>
    <template v-if="graphState.status === GraphStatus.INITIAL">
      <b-button variant="outline-primary">GO</b-button>
    </template>
    <template v-if="graphState.status === GraphStatus.INFLIGHT">
      <div class="flex flex-row items-center justify-center gap-2 p-4">
        <b-spinner small variant="ttt"></b-spinner>
        <span>Loading packages...</span>
      </div>
    </template>
    <div
      id="sigma-container"
      ref="sigma-container"
      class="absolute top-0 left-0 w-full h-full m-0 p-0 overflow-hidden"
    ></div>
    <!-- <div v-if="graphState.status === GraphStatus.ERROR" class="p-2 text-red-500">
      Something went wrong.
    </div> -->
    <template v-if="graphState.status === GraphStatus.SUCCESS">
      <div class="absolute w-full bottom-0 left-0 p-2 flex flex-row justify-between items-center">
        <div class="text-sm">
          <template v-if="!graphState.selectedNodeId">
            Hover or click a node to view connections and details.
          </template>
        </div>

        <b-button-group>
          <b-button
            variant="primary"
            size="sm"
            @click="zoom({ graphComponentContext, operation: 'zoomIn' })"
            >+</b-button
          >
          <b-button
            variant="primary"
            size="sm"
            @click="zoom({ graphComponentContext, operation: 'zoomOut' })"
            >-</b-button
          >
        </b-button-group>
      </div>
    </template>
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
        ref="search-input"
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
        v-if="graphState.selectedNodeId"
        class="rounded bg-white shadow p-2 border border-gray-200 flex flex-col gap-2 overflow-auto toolkit-scroll"
      >
        <!-- <div>Node type: {{ selectedNode.attributes.obj.type }}</div>
        <hr /> -->
        <template v-if="selectedNode.attributes.obj.pkg">
          <div class="ttt-purple font-bold font-mono">
            {{ selectedNode.key }}
          </div>
          <hr />
          <div>Status: {{ selectedNode.attributes.obj.pkg.PackageState }}</div>
          <div>
            {{ getNormalizedPackageContentsDescription(selectedNode.attributes.obj.pkg) }}
          </div>
          <hr />
          <div>Sources:</div>
          <b-button
            size="sm"
            variant="outline-dark"
            @click="selectNode({ graphComponentContext, node: sourceNodeId })"
            v-for="sourceNodeId of sourceNodeIds"
            v-bind:key="sourceNodeId"
          >
            {{ sourceNodeId }}
          </b-button>
          <hr />
          <div>Children:</div>

          <b-button
            size="sm"
            variant="outline-dark"
            @click="selectNode({ graphComponentContext, node: childNodeId })"
            v-for="childNodeId of childNodeIds"
            v-bind:key="childNodeId"
          >
            {{ childNodeId }}
          </b-button>
          <!-- <hr />
          <div>History:</div> -->
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
import { getNormalizedPackageContentsDescription } from "@/utils/package";
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
      // demoMode: (state: IPluginState) => state.demoMode,
    }),
    selectedNode(): IGraphNode | null {
      if (store.state.graph.selectedNodeId) {
        return (
          store.state.graph.graphData.nodes.find(
            (x) => x.key === store.state.graph.selectedNodeId
          ) ?? null
        );
      }

      return null;
    },
    sourceNodeIds(): string[] {
      if (!store.state.graph.selectedNodeId) {
        return [];
      }

      const sourceNodeIds = this.$data.graphComponentContext.graph.inboundNeighbors(
        store.state.graph.selectedNodeId
      );

      return sourceNodeIds;
    },
    childNodeIds(): string[] {
      if (!store.state.graph.selectedNodeId) {
        return [];
      }

      return this.$data.graphComponentContext.graph.outboundNeighbors(
        store.state.graph.selectedNodeId
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
      zoom: `graph/${GraphActions.ZOOM}`,
    }),
    getNormalizedPackageContentsDescription,
  },
  async created() {},
  async mounted() {
    // const container = document.querySelector("#sigma-container") as HTMLElement;
    // const searchInput = document.querySelector("#search-input") as HTMLInputElement;

    // Instantiate sigma:
    const graph = new Graph();

    const renderer = new Sigma(graph, this.$refs["sigma-container"] as HTMLElement);

    const graphComponentContext: IGraphComponentContext = {
      renderer,
      graph,
      searchInput: this.$refs["search-input"] as HTMLInputElement,
      container: this.$refs["sigma-container"] as HTMLElement,
    };

    this.$data.graphComponentContext = graphComponentContext;

    await store.dispatch(`graph/${GraphActions.LOAD_DATA}`, { graphComponentContext });
    await store.dispatch(`graph/${GraphActions.INITIALIZE_GRAPH}`, { graphComponentContext });
    await store.dispatch(`graph/${GraphActions.RENDER_GRAPH}`, { graphComponentContext });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
