<template>
  <div class="flex flex-row gap-2 floating-hover-reveal-container" id="popover-container">
    <scroll-button />

    <template v-if="debugMode">
      <debug-button />
    </template>

    <template v-if="pluginAuth.authState">
      <div class="flex flex-row gap-2 floating-hover-reveal-target">
        <b-button
          title="Search survey"
          variant="primary"
          class="floating-shadow"
          style="padding: 0"
          href="https://forms.gle/HnGn8hAN9tMXK3fp9"
          target="_blank"
        >
          <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
            <font-awesome-icon icon="poll" style="height: 26px"></font-awesome-icon>
          </div>
        </b-button>

        <!-- <snapshot-button class="floating-shadow" /> -->

        <quick-script-button class="floating-shadow" />
      </div>

      <builder-button class="floating-shadow" />
    </template>

    <!-- <primary-toolkit-button /> -->
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
