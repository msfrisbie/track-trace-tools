<template>
  <div class="flex flex-row gap-2 floating-hover-reveal-container" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <template v-if="authState">
      <div class="flex flex-row gap-2 floating-hover-reveal-target">
        <div class="relative">
          <bug-report-button class="floating-shadow" />
        </div>

        <div class="relative">
          <feedback-button class="floating-shadow" />
        </div>

        <div class="relative">
          <search-button class="floating-shadow" />
        </div>

        <div class="relative">
          <quick-script-button class="floating-shadow" />
        </div>

        <div v-if="notificationCount === 0" class="relative">
          <announcements-button class="floating-shadow" />
        </div>

        <div class="relative">
          <print-button></print-button>
        </div>
      </div>

      <div v-if="!hasPlus" class="relative">
        <plus-button class="floating-shadow" />
      </div>

      <div v-if="notificationCount > 0" class="relative">
        <announcements-button class="floating-shadow" />
      </div>

      <div class="relative">
        <builder-button class="floating-shadow" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import AnnouncementsButton from "@/components/page-overlay/AnnouncementsButton.vue";
import BugReportButton from "@/components/page-overlay/BugReportButton.vue";
import BuilderButton from "@/components/page-overlay/BuilderButton.vue";
import DebugButton from "@/components/page-overlay/DebugButton.vue";
import PlusButton from "@/components/page-overlay/PlusButton.vue";
import PrintButton from "@/components/page-overlay/PrintButton.vue";
import QuickScriptButton from "@/components/page-overlay/QuickScriptButton.vue";
import ScrollButton from "@/components/page-overlay/ScrollButton.vue";
import SearchButton from "@/components/page-overlay/SearchButton.vue";
import { IPluginState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { hasPlusImpl } from "@/utils/plus";
import Vue from "vue";
import { mapState } from "vuex";
import FeedbackButton from "./FeedbackButton.vue";

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
    FeedbackButton,
    PrintButton,
    AnnouncementsButton,
  },
  async mounted() { },
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
      metrcTableState: (state: IPluginState) => state.metrcTable,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
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
