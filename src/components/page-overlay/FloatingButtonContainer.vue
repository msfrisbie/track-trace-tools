<template>
  <div class="flex flex-row gap-2 floating-hover-reveal-container" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <template v-if="authState">
      <div class="flex flex-row gap-2 floating-hover-reveal-target">
        <search-button class="floating-shadow"></search-button>

        <quick-script-button class="floating-shadow" />
      </div>

      <!-- TODO enable when T3+ signup is ready -->
      <plus-button v-if="false && !clientValues['ENABLE_T3PLUS']" class="floating-shadow" />

      <builder-button class="floating-shadow" />
    </template>
  </div>
</template>

<script lang="ts">
import BuilderButton from "@/components/page-overlay/BuilderButton.vue";
import DebugButton from "@/components/page-overlay/DebugButton.vue";
import QuickScriptButton from "@/components/page-overlay/QuickScriptButton.vue";
import SearchButton from "@/components/page-overlay/SearchButton.vue";
import ScrollButton from "@/components/page-overlay/ScrollButton.vue";
import PlusButton from "@/components/page-overlay/PlusButton.vue";
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { IPluginState } from "@/interfaces";

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
      debugMode: (state: IPluginState) => state.debugMode,
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
