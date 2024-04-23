<template>
  <div class="border-purple-300" v-bind:class="{
    'bg-white': selected,
  }" @mouseenter="selectTransfer(transfer)" @click.stop.prevent="setTransferManifestNumberFilter()">
    <div class="flex flex-row items-center space-x-6 cursor-pointer p-4">
      <div class="flex flex-column-shim flex-col space-y-2" v-bind:class="{ 'font-bold': selected }">
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
import { MessageType, MetrcGridId, TransferFilterIdentifiers, TransferState } from '@/consts';
import { IIndexedTransferData } from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { pageManager } from '@/modules/page-manager/page-manager.module';
import store from '@/store/page-overlay/index';
import { SearchActions } from '@/store/page-overlay/modules/search/consts';
import Vue from 'vue';

export default Vue.extend({
  name: 'TransferSearchResultPreview',
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
          return 'Metrc Transfer';
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
      this.$emit('selected-transfer', transfer);
    },
    async setTransferManifestNumberFilter() {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      let metrcGridId: MetrcGridId;

      switch (this.$props.transfer.TransferState as TransferState) {
        case TransferState.INCOMING:
          metrcGridId = MetrcGridId.TRANSFERS_INCOMING;
          break;
        case TransferState.INCOMING_INACTIVE:
          metrcGridId = MetrcGridId.TRANSFERS_INCOMING_INACTIVE;
          break;
        case TransferState.OUTGOING:
          metrcGridId = MetrcGridId.TRANSFERS_OUTGOING;
          break;
        case TransferState.OUTGOING_INACTIVE:
          metrcGridId = MetrcGridId.TRANSFERS_OUTGOING_INACTIVE;
          break;
        case TransferState.REJECTED:
          metrcGridId = MetrcGridId.TRANSFERS_REJECTED;
          break;
        default:
          return;
      }

      await pageManager.clickTabWithGridId(metrcGridId);

      pageManager.setFilter(
        metrcGridId,
        TransferFilterIdentifiers.ManifestNumber,
        this.$props.transfer.ManifestNumber,
      );

      store.commit(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, { showSearchResults: false });
    },
  },
});
</script>
