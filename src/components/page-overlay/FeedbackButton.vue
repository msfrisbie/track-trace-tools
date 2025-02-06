<template>
  <b-button variant="primary" title="Send T3 Feedback" id="feedback-popover-target" class="cursor-pointer"
    style="padding: 0" href="https://forms.gle/9J5UMXN4FkAZQ5wH9" target="_blank">
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      <font-awesome-icon icon="comment" style="height: 26px"></font-awesome-icon>
    </div>

    <b-popover target="feedback-popover-target" triggers="hover" placement="top" variant="light" ref="feedback-popover"
      :disabled="trackedInteractions.dismissedFeedbackPopover" container="popover-container">
      <template #title>
        <div class="flex flex-row items-center space-x-2">
          <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
          <span class="text-base font-bold">SEND T3 FEEDBACK</span>
        </div>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p class="font-bold">Send T3 feedback to the developer.</p>

        <p> Ideas, new features you want added, current features you'd like changed or
          removed.</p>

        <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissFeedbackPopover()">GOT IT</b-button>
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
  name: "FeedbackButton",
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
    dismissFeedbackPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedFeedbackPopover = true;

      // @ts-ignore
      this.$refs["feedback-popover"].$emit("close");
      // @ts-ignore
      this.$refs["feedback-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
  },
  async created() { },
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
