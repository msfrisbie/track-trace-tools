<template>
  <b-button
    variant="primary"
    title="Quick Scripts"
    id="bug-report-popover-target"
    class="cursor-pointer"
    style="padding: 0"
    href="https://docs.google.com/forms/d/e/1FAIpQLSd2hQFwtXyv1Bco9nHN9d4tEqkgbhe3w-WdbZAemBCTD_19VQ/viewform?usp=sf_link"
    target="_blank"
  >
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      <font-awesome-icon icon="exclamation-triangle" style="height: 26px"></font-awesome-icon>
    </div>

    <b-popover
      target="bug-report-popover-target"
      triggers="hover"
      placement="top"
      variant="light"
      ref="bug-report-popover"
      :disabled="trackedInteractions.dismissedBugReportsPopover"
      container="popover-container"
    >
      <template #title>
        <div class="flex flex-row items-center space-x-2">
          <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
          <span class="text-base font-bold">REPORT A PROBLEM</span>
        </div>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Report problems with T3 diretly to the developer.</p>

        <b-button
          size="sm"
          variant="outline-primary"
          class="mb-2"
          @click="dismissBugReportPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "BugReportButton",
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
    return {};
  },
  methods: {
    dismissBugReportPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedBugReportsPopover = true;

      // @ts-ignore
      this.$refs["bug-report-popover"].$emit("close");
      // @ts-ignore
      this.$refs["bug-report-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
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
