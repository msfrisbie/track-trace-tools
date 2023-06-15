<template>
  <div
    class="border-purple-300"
    v-bind:class="{
      'bg-white': selected,
    }"
    @mouseenter="selectTransfer(transfer)"
    @click.stop.prevent="setTransferManifestNumberFilter(transfer)"
  >
    <div class="flex flex-row items-center space-x-6 cursor-pointer p-4">
      <div
        class="flex flex-column-shim flex-col space-y-2"
        v-bind:class="{ 'font-bold': selected }"
      >
        <div class="text-xl text-purple-700">
          {{ transferDescriptor }}
        </div>
        <div class="text-gray-700 text-lg">
          {{ transfer.ManifestNumber
          }}<!-- - {{ transferPackageSummary }} -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType, TransferFilterIdentifiers, TransferState } from "@/consts";
import { IIndexedTransferData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { MutationType } from "@/mutation-types";
import Vue from "vue";

export default Vue.extend({
  name: "TransferSearchResultPreview",
  props: {
    transfer: Object as () => IIndexedTransferData,
    selected: Boolean,
    idx: Number,
  },
  computed: {
    transferDescriptor() {
      switch (this.transfer.TransferState) {
        case TransferState.INCOMING:
          return this.transfer.ShipperFacilityName;
        case TransferState.OUTGOING:
        case TransferState.REJECTED:
          return this.transfer.DeliveryFacilities;
        default:
          return "Metrc Transfer";
      }
    },
    transferPackageSummary() {
      switch (this.transfer.TransferState) {
        case TransferState.INCOMING:
        case TransferState.OUTGOING:
          return `${this.transfer.PackageCount} packages`;
        case TransferState.REJECTED:
        default:
          return `${this.transfer.DeliveryPackageCount} packages`;
      }
    },
  },
  methods: {
    selectTransfer(transfer: IIndexedTransferData) {
      this.$emit("selected-transfer", transfer);
    },
    async setTransferManifestNumberFilter() {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      switch (this.$props.transfer.TransferState as TransferState) {
        case TransferState.INCOMING:
          await pageManager.clickTabStartingWith(pageManager.transferTabs, "Incoming");
          break;
        case TransferState.OUTGOING:
          await pageManager.clickTabStartingWith(pageManager.transferTabs, "Outgoing");
          break;
        case TransferState.REJECTED:
          await pageManager.clickTabStartingWith(pageManager.transferTabs, "Rejected");
          break;
        default:
          return null;
      }

      pageManager.setTransferFilter(
        TransferFilterIdentifiers.ManifestNumber,
        // @ts-ignore
        this.$props.transfer.ManifestNumber
      );

      this.$store.commit(`transferSearch/${MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, false);
    },
  },
});
</script>
