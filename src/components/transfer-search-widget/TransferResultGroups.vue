<template>
  <div>
    <transfer-search-results-group
      :transfers="incomingTransfers"
      sectionName="incoming transfer"
      :transferFilterIdentifier="null"
      :sectionPriority="0"
      :expanded="false"
      :previewLength="3"
    />

    <transfer-search-results-group
      :transfers="outgoingTransfers"
      sectionName="outgoing transfer"
      :transferFilterIdentifier="null"
      :sectionPriority="1"
      :expanded="false"
      :previewLength="3"
    />

    <transfer-search-results-group
      :transfers="rejectedTransfers"
      sectionName="rejected transfer"
      :transferFilterIdentifier="null"
      :sectionPriority="2"
      :expanded="false"
      :previewLength="3"
    />

    <!-- All results -->
    <!-- <transfer-search-results-group
      :transfers="transfers"
      sectionName="transfer"
      :transferFilterIdentifier="null"
      :sectionPriority="3"
      :expanded="false"
      :previewLength="3"
    /> -->
  </div>
</template>


<script lang="ts">
import Vue from "vue";
import { MutationType } from "@/mutation-types";
import { IIndexedTransferData } from "@/interfaces";
import {
  MessageType,
  TransferFilterIdentifiers,
  TransferState,
} from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import { mapState } from "vuex";
import TransferSearchResultsGroup from "@/components/transfer-search-widget/TransferSearchResultsGroup.vue";
import TransferSearchFiltersVue from "./TransferSearchFilters.vue";
import { searchManager } from "@/modules/search-manager.module";

export default Vue.extend({
  name: "TransferResultGroups",
  props: {
    transfers: Array as () => IIndexedTransferData[],
  },
  components: { TransferSearchResultsGroup },
  computed: {
    incomingTransfers() {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) =>
          transferData.TransferState === TransferState.INCOMING
      );

      return transfers;
    },
    outgoingTransfers() {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) =>
          transferData.TransferState === TransferState.OUTGOING
      );

      return transfers;
    },
    rejectedTransfers() {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) =>
          transferData.TransferState === TransferState.REJECTED
      );

      return transfers;
    },
    ...mapState(["transferSearchFilters", "transferQueryString"]),
  },
  methods: {
    async setTransferManifestNumberFilter() {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      switch (this.$props.transfer.TransferState as TransferState) {
        case TransferState.INCOMING:
          await pageManager.clickTabStartingWith(
            pageManager.transferTabs,
            "Incoming"
          );
          break;
        case TransferState.OUTGOING:
          await pageManager.clickTabStartingWith(
            pageManager.transferTabs,
            "Outgoing"
          );
          break;
        case TransferState.REJECTED:
          await pageManager.clickTabStartingWith(
            pageManager.transferTabs,
            "Rejected"
          );
          break;
        default:
          return null;
      }

      pageManager.setTransferFilter(
        TransferFilterIdentifiers.ManifestNumber,
        // @ts-ignore
        this.$props.transfer.ManifestNumber
      );

      this.$store.commit(MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS, false);
    },
  },
});
</script>