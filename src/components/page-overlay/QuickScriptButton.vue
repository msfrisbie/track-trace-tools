<template>
  <b-dropdown
    dropup
    no-caret
    variant="primary"
    title="Quick Scripts"
    id="quick-script-popover-target"
    class="cursor-pointer"
    style="padding: 0"
  >
    <template #button-content>
      <div style="width: 26px" class="flex flex-col items-center">
        <font-awesome-icon icon="bolt" style="height: 26px"></font-awesome-icon>
      </div>
    </template>

    <b-dropdown-item
      v-for="quickScript of quickScripts"
      v-bind:key="quickScript.id"
      @click="runQuickScript(quickScript)"
      >{{ quickScript.name }}</b-dropdown-item
    >
    <b-popover
      target="quick-script-popover-target"
      triggers="hover"
      placement="top"
      variant="light"
      ref="quick-script-popover"
      :disabled="trackedInteractions.dismissedQuickScriptsPopover"
      container="popover-container"
    >
      <template #title>
        <div class="flex flex-row items-center space-x-2">
          <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
          <span class="text-base font-bold">QUICK SCRIPTS</span>
        </div>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Common Metrc actions that can be done in a single click.</p>

        <b-button
          size="sm"
          variant="outline-primary"
          class="mb-2"
          @click="dismissQuickScriptPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-dropdown>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { QUICK_SCRIPTS, runQuickScript } from "@/utils/quick-scripts";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "QuickScriptButton",
  store,
  components: {
    TrackTraceToolsLogo,
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      trackedInteractions: (state: any) => state.trackedInteractions,
      metrcStatusData: (state: any) => state.metrcStatusData,
      settings: (state: any) => state.settings,
    }),
  },
  data() {
    return {
      quickScripts: QUICK_SCRIPTS,
    };
  },
  methods: {
    runQuickScript,
    dismissQuickScriptPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(this.$store.state.trackedInteractions));

      trackedInteractions.dismissedQuickScriptsPopover = true;

      // @ts-ignore
      this.$refs["quick-script-popover"].$emit("close");
      // @ts-ignore
      this.$refs["quick-script-popover"].$emit("disable");

      this.$store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
  },
  async created() {},
});
</script>

<style type="text/scss" lang="scss">
// Override metrc bootstrap
#popover-container {
  .btn-group {
    border-radius: 4px;
    padding-top: 0;
  }
}
</style>
