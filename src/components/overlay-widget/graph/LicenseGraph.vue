<template>
  <div>
    <template v-if="graphState.inflight">
      <div class="absolute top-0 w-full">
        <div class="flex flex-row items-center justify-center gap-2 p-4">
          <b-spinner small variant="ttt"></b-spinner>
          <span>Loading packages...</span>
        </div>
      </div>
    </template>
    <div id="sigma-container" class="w-full h-full m-0 p-0 overflow-hidden"></div>
    <div
      v-bind:class="{ display: graphState.inflight ? 'none' : 'flex' }"
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
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { GraphActions } from "@/store/page-overlay/modules/graph/consts";
import Vue from "vue";
import { mapState } from "vuex";

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
    return {};
  },
  methods: {},
  async created() {},
async mounted() {
    store.dispatch(`graph/${GraphActions.LOAD_AND_RENDER}`);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
