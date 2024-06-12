<template>
  <b-button id="print-popover-target" variant="primary" title="Print" class="relative" @click="openPrint($event)"
    style="padding: 0">
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      <font-awesome-icon icon="print" style="height: 26px"></font-awesome-icon>
    </div>

    <b-popover target="print-popover-target" triggers="hover" placement="top" variant="light" ref="print-popover"
      :disabled="trackedInteractions.dismissedPrintPopover" container="popover-container">
      <template #title>
        <span class="text-base">New: <b>Barcode Printing</b></span>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Select Metrc table rows to easily print barcodes.</p>

        <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissPrintPopover()">GOT IT</b-button>
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import { ModalAction, ModalType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { modalManager } from "@/modules/modal-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { LabelPrintActions } from "@/store/page-overlay/modules/label-print/consts";
import { ILabelData } from "@/store/page-overlay/modules/label-print/interfaces";
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
      const labelDataList: ILabelData[] = store.state.metrcTable.barcodeValues.map((x) => ({
        primaryValue: x,
        secondaryValue: null,
        tertiaryValue: null,
        count: 1
      }));

      await store.dispatch(`labelPrint/${LabelPrintActions.PUSH_LABELS}`, {
        labelDataList
      });

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/tags/print-tags",
      });
    },
  },
});
</script>
