<template>
  <div class="flex flex-row gap-2 floating-hover-reveal-container" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <!-- <b-button-group
      style="box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5)"
      class="relative flex flex-row gap-4"
    > -->
    <template v-if="pluginAuth.authState">
      <quick-script-button
        style="box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5)"
        class="floating-hover-reveal-target"
      ></quick-script-button>

      <builder-button style="box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5)" />
    </template>

    <!-- <primary-toolkit-button /> -->
    <!-- </b-button-group> -->
  </div>
</template>

<script lang="ts">
import BuilderButton from "@/components/page-overlay/BuilderButton.vue";
import DebugButton from "@/components/page-overlay/DebugButton.vue";
import QuickScriptButton from "@/components/page-overlay/QuickScriptButton.vue";
import ScrollButton from "@/components/page-overlay/ScrollButton.vue";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "FloatingButtonContainer",
  store,
  components: {
    BuilderButton,
    QuickScriptButton,
    // PrimaryToolkitButton,
    // ListingsButton,
    ScrollButton,
    DebugButton,
  },
  async mounted() {},
  data() {
    return {};
  },
  computed: {
    ...mapState(["pluginAuth", "trackedInteractions", "settings", "debugMode"]),
  },
  methods: {},
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

.floating-hover-reveal-target {
  margin-right: -60px;
  transition: margin-right 0.1s ease-in-out;
  z-index: -1;
  transition-delay: 1.5s;
}

.floating-hover-reveal-container:hover .floating-hover-reveal-target {
  margin-right: 0px;
  z-index: 0;
  transition-delay: 0s;
}
</style>
