<template>
  <div
    v-if="authState && !settings.hideFacilityPicker"
    style="width: 540px; padding-top: 1px"
    id="facility-popover-target"
    class="ttt-wrapper facilities-dropdown"
  >
    <facility-picker />

    <div id="facility-popover-container"></div>

    <b-popover
      target="facility-popover-target"
      triggers="hover"
      placement="bottom"
      variant="light"
      ref="facility-popover"
      :disabled="trackedInteractions.dismissedFacilityPopover"
      container="facility-popover-container"
    >
      <template #title>
        <div class="flex flex-row items-center space-x-2">
          <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
          <span class="text-base font-bold">FACILITY AUTOCOMPLETE</span>
        </div>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Easiliy search for and select your facilities.</p>

        <p>This can be disabled in toolkit settings.</p>

        <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissFacilityPopover()"
          >GOT IT</b-button
        >

        <!-- <b-button
          size="sm"
          variant="outline-dark"
          class="mb-2"
          @click="openSettings()"
          >OPEN SETTINGS</b-button
        > -->
      </div>
    </b-popover>
  </div>
</template>

<script lang="ts">
import FacilityPicker from "@/components/shared/FacilityPicker.vue";
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { ToolkitView } from "@/consts";
import { authManager } from "@/modules/auth-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "FloatingFacilityPicker",
  store,
  components: {
    FacilityPicker,
    TrackTraceToolsLogo,
  },
  data() {
    return {
      authState: null,
    };
  },
  computed: {
    ...mapState(["trackedInteractions", "settings"]),
  },
  async mounted() {
    this.$data.authState = await authManager.authStateOrNull();
  },
  methods: {
    openSettings() {
      store.commit(MutationType.TOGGLE_EXPANDED_OVERLAY);
      pageManager.setExpandedClass();
      store.commit(MutationType.SELECT_VIEW, ToolkitView.SETTINGS);
    },
    dismissFacilityPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedFacilityPopover = true;

      // @ts-ignore
      this.$refs["facility-popover"].$emit("close");
      // @ts-ignore
      this.$refs["facility-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
