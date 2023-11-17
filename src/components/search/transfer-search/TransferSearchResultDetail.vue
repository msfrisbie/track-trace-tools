<template>
  <div
    v-if="transferSearchState.selectedTransferMetadata"
    class="flex flex-col items-center space-y-8 px-2 p-4"
  >
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-row items-center space-x-4 text-center">
            <div class="text-2xl text-purple-800">
              Manifest
              {{ transferSearchState.selectedTransferMetadata.transferData.ManifestNumber }}
            </div>
          </div>

          <b-badge
            class="text-lg"
            :variant="badgeVariant(transferSearchState.selectedTransferMetadata.transferData)"
            >{{
              displayTransferState(transferSearchState.selectedTransferMetadata.transferData)
            }}</b-badge
          >
        </div>
      </div>

      <div
        v-show="isOnTransfersPage"
        @click.stop.prevent="
          setTransferManifestNumberFilter(transferSearchState.selectedTransferMetadata.transferData)
        "
        class="flex flex-row items-center justify-center cursor-pointer h-full"
      >
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <transfer-button-list
        :transfer="transferSearchState.selectedTransferMetadata.transferData"
      ></transfer-button-list>
    </div>

    <recursive-json-table
      :jsonObject="transferSearchState.selectedTransferMetadata.transferData"
    ></recursive-json-table>
  </div>
</template>

<script lang="ts">
import TransferButtonList from "@/components/overlay-widget/shared/TransferButtonList.vue";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import { MessageType, TransferState } from "@/consts";
import { IIndexedTransferData, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { TRANSFER_TAB_REGEX } from "@/modules/page-manager/consts";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { copyToClipboard } from "@/utils/dom";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

function isIsoDateToday(isodate: string): boolean {
  if (!isodate) {
    return false;
  }

  return new Date(isodate).toDateString() === new Date().toDateString();
}

function deliveryTimeDescriptor(isodate: string | null): string {
  if (!isodate) {
    return "";
  }

  const isToday: boolean = isIsoDateToday(isodate);

  const date = new Date(isodate);

  const timeDescriptor = date.toLocaleTimeString();
  const dateDescriptor = date.toLocaleDateString();

  if (isToday) {
    return `today at ${timeDescriptor}`;
  }
  return `${dateDescriptor} at ${timeDescriptor}`;
}

export default Vue.extend({
  name: "TransferSearchResultDetail",
  store,
  components: {
    // TransferIcon,
    RecursiveJsonTable,
    TransferButtonList,
  },
  computed: {
    ...mapState<IPluginState>({
      transferSearchState: (state: IPluginState) => state.transferSearch,
    }),
    isOnTransfersPage(): boolean {
      return !!window.location.pathname.match(TRANSFER_TAB_REGEX);
    },
    transferDescriptor() {
      const transfer: IIndexedTransferData = this.$data.transfer;

      switch (transfer.TransferState) {
        case TransferState.INCOMING:
          return transfer.ShipperFacilityName;
        case TransferState.OUTGOING:
        case TransferState.REJECTED:
          return transfer.DeliveryFacilities;
        default:
          return "Metrc Transfer";
      }
    },
    transferPackageSummary() {
      const transfer: IIndexedTransferData = this.$data.transfer;

      switch (transfer.TransferState) {
        case TransferState.INCOMING:
        case TransferState.OUTGOING:
          return `${transfer.PackageCount} packages`;
        case TransferState.REJECTED:
        default:
          return `${transfer.DeliveryPackageCount} packages`;
      }
    },
    transferNextCheckpoint() {
      const transfer: IIndexedTransferData = this.$data.transfer;

      switch (transfer.TransferState) {
        case TransferState.INCOMING:
          if (transfer.ReceivedDateTime) {
            return `Received ${deliveryTimeDescriptor(transfer.ReceivedDateTime)}`;
          }

          if (transfer.EstimatedArrivalDateTime) {
            return `Scheduled for delivery ${deliveryTimeDescriptor(
              transfer.EstimatedArrivalDateTime
            )}`;
          }

          return "Scheduled for delivery";
        case TransferState.OUTGOING:
          if (transfer.CreatedDateTime) {
            return `Created ${deliveryTimeDescriptor(transfer.CreatedDateTime)}`;
          }

          return "Scheduled for delivery";
        case TransferState.REJECTED:
          if (transfer.ReceivedDateTime) {
            return `Return received ${deliveryTimeDescriptor(transfer.ReceivedDateTime)}`;
          }

          if (transfer.EstimatedReturnDepartureDateTime) {
            return `Scheduled for return ${deliveryTimeDescriptor(
              transfer.EstimatedReturnDepartureDateTime
            )}`;
          }

          return "Scheduled for return";
        default:
          return "Scheduled for transfer";
      }
    },
  },
  data(): {} {
    return {};
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    async setTransferManifestNumberFilter(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      store.dispatch(
        `transferSearch/${TransferSearchActions.PARTIAL_UPDATE_TRANSFER_SEARCH_FILTERS}`,
        {
          transferState: transfer.TransferState,
          transferSearchFilters: {
            manifestNumber: transfer.ManifestNumber,
          },
        }
      );

      this.setShowSearchResults({ showSearchResults: false });
    },
    copyToClipboard(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.COPIED_TEXT, {
        value: transfer.ManifestNumber,
      });

      copyToClipboard(transfer.ManifestNumber);

      toastManager.openToast(`'${transfer.ManifestNumber}' copied to clipboard`, {
        title: "Copied Manifest #",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
    badgeVariant(transfer: IIndexedTransferData) {
      switch (transfer.TransferState as TransferState) {
        case TransferState.INCOMING:
          return "success";
        case TransferState.OUTGOING:
          return "primary";
        case TransferState.REJECTED:
          return "danger";
        case TransferState.OUTGOING_INACTIVE:
        case TransferState.INCOMING_INACTIVE:
          return "light";
        default:
          return null;
      }
    },
    displayTransferState(transfer: IIndexedTransferData) {
      return transfer.TransferState.replaceAll("_", " ");
    },
  },
});
</script>
