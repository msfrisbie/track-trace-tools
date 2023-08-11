<template>
  <div class="flex flex-row gap-2 floating-hover-reveal-container" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <template v-if="pluginAuth.authState">
      <div class="flex flex-row gap-2 floating-hover-reveal-target">
        <search-button class="floating-shadow"></search-button>

        <quick-script-button class="floating-shadow" />
      </div>

      <!-- TODO enable when T3+ signup is ready -->
      <plus-button v-if="false && !hasT3plus" class="floating-shadow" />

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
  async mounted() {
    this.checkT3plus();
  },
  data() {
    return {
      hasT3plus: true,
    };
  },
  computed: {
    ...mapState(["pluginAuth", "trackedInteractions", "settings", "debugMode"]),
  },
  methods: {
    checkT3plus() {
      this.$data.hasT3plus = clientBuildManager.assertValues(["ENABLE_T3PLUS"]);
    },
  },
  watch: {
    "settings.licenseKey": {
      immediate: true,
      handler() {
        this.checkT3plus();
      },
    },
  },
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
