<template>
  <div class="flex flex-row gap-2 floating-hover-reveal-container" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <template v-if="authState">
      <div class="flex flex-row gap-2 floating-hover-reveal-target">
        <bug-report-button class="floating-shadow" />

        <search-button class="floating-shadow"></search-button>

        <quick-script-button class="floating-shadow" />
      </div>

      <!-- TODO enable when T3+ signup is ready -->
      <plus-button v-if="!t3plus" class="floating-shadow" />

      <div class="relative">
        <builder-button class="floating-shadow" />
        <div
          v-if="notificationCount > 0"
          class="absolute bg-red-500 rounded-full text-white flex flex-col items-center justify-center text-center text-xs border border-white"
          style="width: 0.6rem; height: 0.6rem; bottom: -0.3rem; left: -0.3rem"
        ></div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import BugReportButton from "@/components/page-overlay/BugReportButton.vue";
import BuilderButton from "@/components/page-overlay/BuilderButton.vue";
import DebugButton from "@/components/page-overlay/DebugButton.vue";
import PlusButton from "@/components/page-overlay/PlusButton.vue";
import QuickScriptButton from "@/components/page-overlay/QuickScriptButton.vue";
import ScrollButton from "@/components/page-overlay/ScrollButton.vue";
import SearchButton from "@/components/page-overlay/SearchButton.vue";
import { IPluginState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "FloatingButtonContainer",
  store,
  components: {
    BuilderButton,
    QuickScriptButton,
    ScrollButton,
    DebugButton,
    SearchButton,
    PlusButton,
    BugReportButton,
  },
  async mounted() {},
  data() {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
      clientValues: (state: IPluginState) => state.client.values,
      t3plus: (state: IPluginState) => state.client.t3plus,
      debugMode: (state: IPluginState) => state.debugMode,
      notificationCount: (state: IPluginState) => state.announcements.notificationCount,
    }),
  },
  methods: {},
  watch: {},
});
</script>

<style type="text/scss" lang="scss" scoped>
// Override metrc bootstrap
#popover-container {
  .btn-group {
    border-radius: 4px;
    padding-top: 0;
  }
}

.floating-shadow {
  box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5) !important;
}

.floating-hover-reveal-target {
  // margin-right: -60px;
  transition: max-width visibility 0s;
  max-width: 0px;
  visibility: hidden;
  z-index: -1;
  transition-delay: 1.5s;
}

.floating-hover-reveal-container:hover .floating-hover-reveal-target {
  // margin-right: 0px;
  visibility: visible;
  max-width: 100vw;
  z-index: 0;
  transition-delay: 0s;
}
</style>
