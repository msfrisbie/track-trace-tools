<template>
  <b-button
    id="screenshot-popover-target"
    variant="light"
    title="Take screenshot"
    @click="takeScreenshot($event)"
  >
    <!-- class="bg-gray-50 hover:bg-gray-200 rounded-full shadow-2xl border border-gray-400 h-16 w-16 flex items-center justify-center cursor-pointer" -->

    <font-awesome-icon icon="camera" size="2x" />

    <b-popover
      target="screenshot-popover-target"
      triggers="hover"
      placement="top"
      variant="light"
      ref="screenshot-popover"
      :disabled="trackedInteractions.dismissedScreenshotPopover"
      container="popover-container"
    >
      <template #title>
        <span class="text-base">New: <b>Screenshot Share</b></span>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>
          Take Metrc screenshots and get a unique link. Only people with the link can see the
          screenshot.
        </p>

        <b-button
          size="sm"
          variant="outline-primary"
          class="mb-2"
          @click="dismissScreenshotPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import { screenshotManager } from "@/modules/screenshot-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "ScreenshotButton",
  store,
  data() {
    return {};
  },
  computed: mapState(["trackedInteractions", "settings"]),
  methods: {
    dismissScreenshotPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedScreenshotPopover = true;

      // @ts-ignore
      this.$refs["screenshot-popover"].$emit("close");
      // @ts-ignore
      this.$refs["screenshot-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async takeScreenshot() {
      // if (!(await accountManager.accountEnabled())) {
      //   // if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
      //   //   // Do Firefox-related activities
      //   //   modalManager.dispatchModalEvent(ModalType.PERMISSIONS);
      //   // } else {
      //   //   messageBus.sendMessageToBackground(MessageType.OPEN_CONNECT_STANDALONE, {});
      //   // }
      //   return;
      // }

      screenshotManager.takeScreenshot({
        downloadFile: false,
        useBackground: true,
        useLegacyScreenshot: store.state.settings?.useLegacyScreenshot,
      });
    },
  },
});
</script>
