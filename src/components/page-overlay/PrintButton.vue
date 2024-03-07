<template>
  <b-button
    id="print-popover-target"
    variant="primary"
    title="Print"
    class="relative"
    @click="openPrint($event)"
    style="padding: 0"
  >
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      <font-awesome-icon icon="print" style="height: 26px"></font-awesome-icon>
    </div>

    <b-popover
      target="print-popover-target"
      triggers="hover"
      placement="top"
      variant="light"
      ref="print-popover"
      :disabled="trackedInteractions.dismissedPrintPopover"
      container="popover-container"
    >
      <template #title>
        <span class="text-base">New: <b>Barcode Printing</b></span>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Select Metrc table rows to easily print barcodes.</p>

        <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissPrintPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import { MessageType, OPTIONS_REDIRECT_KEY, PRINT_DATA_KEY } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { messageBus } from "@/modules/message-bus.module";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PrintButton",
  store,
  data() {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      trackedInteractions: (state: IPluginState) => state.trackedInteractions,
      metrcTableState: (state: IPluginState) => state.metrcTable,
    }),
  },
  methods: {
    dismissPrintPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedPrintPopover = true;

      // @ts-ignore
      this.$refs["print-popover"].$emit("close");
      // @ts-ignore
      this.$refs["print-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openPrint() {
      if (store.state.metrcTable.barcodeValues.length === 0) {
        toastManager.openToast(
          "No tagged items selected. Select tagged items (packages, plants) in a Metrc table to print",
          {
            title: "T3 Tag Print Error",
            autoHideDelay: 5000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );

        return;
      }

      await chrome.storage.local.set({
        [PRINT_DATA_KEY]: store.state.metrcTable.barcodeValues,
        [OPTIONS_REDIRECT_KEY]: "/print.html",
      });

      analyticsManager.track(MessageType.PRINT_TAGS);

      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE);
    },
  },
});
</script>
