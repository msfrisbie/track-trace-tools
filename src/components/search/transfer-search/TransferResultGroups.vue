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

    <transfer-search-results-group
      :transfers="incomingInactiveTransfers"
      sectionName="incoming inactive transfer"
      :transferFilterIdentifier="null"
      :sectionPriority="3"
      :expanded="false"
      :previewLength="3"
    />

    <transfer-search-results-group
      :transfers="outgoingInactiveTransfers"
      sectionName="outgoing inactive transfer"
      :transferFilterIdentifier="null"
      :sectionPriority="4"
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
import Vue from 'vue';
import { MutationType } from '@/mutation-types';
import { IIndexedTransferData, IPluginState } from '@/interfaces';
import { MessageType, TransferFilterIdentifiers, TransferState } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { pageManager } from '@/modules/page-manager/page-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import { copyToClipboard } from '@/utils/dom';
import { mapState } from 'vuex';
import TransferSearchResultsGroup from '@/components/search/transfer-search/TransferSearchResultsGroup.vue';
import { searchManager } from '@/modules/search-manager.module';
import store from '@/store/page-overlay/index';
import TransferSearchFiltersVue from './TransferSearchFilters.vue';

export default Vue.extend({
  name: 'TransferResultGroups',
  props: {
    transfers: Array as () => IIndexedTransferData[],
  },
  components: { TransferSearchResultsGroup },
  computed: {
    incomingTransfers(): IIndexedTransferData[] {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) => transferData.TransferState === TransferState.INCOMING,
      );

      return transfers;
    },
    outgoingTransfers(): IIndexedTransferData[] {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) => transferData.TransferState === TransferState.OUTGOING,
      );

      return transfers;
    },
    incomingInactiveTransfers(): IIndexedTransferData[] {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) => transferData.TransferState === TransferState.INCOMING_INACTIVE,
      );

      return transfers;
    },
    outgoingInactiveTransfers(): IIndexedTransferData[] {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) => transferData.TransferState === TransferState.OUTGOING_INACTIVE,
      );

      return transfers;
    },
    rejectedTransfers(): IIndexedTransferData[] {
      const transfers = this.transfers.filter(
        (transferData: IIndexedTransferData) => transferData.TransferState === TransferState.REJECTED,
      );

      return transfers;
    },
    deliveryFacilitiesTransfers(): IIndexedTransferData[] {
      const transfers = this.transfers.filter((transferData: IIndexedTransferData) => transferData.DeliveryFacilities.includes(store.state.search.queryString));

      return transfers;
    },
    ...mapState<IPluginState>({
      transferSearchState: (state: IPluginState) => state.transferSearch,
    }),
  },
  methods: {},
});
</script>
