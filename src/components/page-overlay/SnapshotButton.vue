<template>
  <b-button
    variant="primary"
    @click="openBuilder($event)"
    title="Toolbox"
    id="snapshot-popover-target"
    style="padding: 0"
  >
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      <font-awesome-icon icon="camera" style="height: 26px"></font-awesome-icon>
    </div>

    <b-popover
      target="snapshot-popover-target"
      triggers="hover"
      placement="top"
      variant="light"
      ref="snapshot-popover"
      :disabled="trackedInteractions.dismissedSnapshotPopover"
      container="popover-container"
    >
      <template #title>
        <div class="flex flex-row items-center space-x-2">
          <font-awesome-icon icon="camera" style="height: 26px"></font-awesome-icon>
          <span class="text-base font-bold">REPORT</span>
        </div>
      </template>

      <div class="flex flex-col space-y-2 text-base" style="min-width: 200px">
        <p>Generate reports of your Metrc data in Google Sheets.</p>

        <a
          class="underline text-purple-600"
          href="https://docs.google.com/spreadsheets/d/1fxBfjBUhFt6Gj7PpbQO8DlT1e76DIDtTwiq_2A5tHCU/edit?usp=sharing"
          target="_blank"
          >Example report</a
        >
        <a class="underline text-purple-600" href="https://youtu.be/JBR21XSKK3I" target="_blank"
          >How do I make a report?</a
        >

        <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissSnapshotPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "BuilderButton",
  store,
  components: {
    // TrackTraceToolsLogo,
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
      activeProject: null,
    };
  },
  methods: {
    dismissSnapshotPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(this.$store.state.trackedInteractions));

      trackedInteractions.dismissedSnapshotPopover = true;

      // @ts-ignore
      this.$refs["snapshot-popover"].$emit("close");
      // @ts-ignore
      this.$refs["snapshot-popover"].$emit("disable");

      this.$store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openBuilder() {
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/google-sheets-export",
      });
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
