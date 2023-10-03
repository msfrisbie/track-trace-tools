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
      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="
          viewManifest(transferSearchState.selectedTransferMetadata.transferData)
        "
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>VIEW MANIFEST</span>
        <font-awesome-icon icon="file" />
      </b-button>

      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="
          downloadManifest(transferSearchState.selectedTransferMetadata.transferData)
        "
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>DOWNLOAD MANIFEST</span>
        <font-awesome-icon icon="file-download" />
      </b-button>

      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="
          printManifest(transferSearchState.selectedTransferMetadata.transferData)
        "
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>PRINT MANIFEST</span>
        <font-awesome-icon icon="print" />
      </b-button>

      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="
          createScanSheet(transferSearchState.selectedTransferMetadata.transferData)
        "
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>CREATE SCAN SHEET</span>
        <font-awesome-icon icon="barcode" />
      </b-button>
    </div>

    <recursive-json-table
      :jsonObject="transferSearchState.selectedTransferMetadata.transferData"
    ></recursive-json-table>
  </div>
</template>

<script lang="ts">
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import {
  MessageType,
  ModalAction,
  ModalType,
  TransferFilterIdentifiers,
  TransferState,
} from "@/consts";
import { IIndexedTransferData, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { TRANSFER_TAB_REGEX } from "@/modules/page-manager/consts";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { copyToClipboard, downloadFileFromUrl, printPdfFromUrl } from "@/utils/dom";
import { createScanSheet } from "@/utils/transfer";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Vue from "vue";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { mapActions, mapState } from "vuex";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";

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
  } else {
    return `${dateDescriptor} at ${timeDescriptor}`;
  }
}

export default Vue.extend({
  name: "TransferSearchResultDetail",
  store,
  components: {
    // TransferIcon,
    RecursiveJsonTable,
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
          if (!!transfer.ReceivedDateTime) {
            return `Received ${deliveryTimeDescriptor(transfer.ReceivedDateTime)}`;
          }

          if (!!transfer.EstimatedArrivalDateTime) {
            return `Scheduled for delivery ${deliveryTimeDescriptor(
              transfer.EstimatedArrivalDateTime
            )}`;
          }

          return "Scheduled for delivery";
        case TransferState.OUTGOING:
          if (!!transfer.CreatedDateTime) {
            return `Created ${deliveryTimeDescriptor(transfer.CreatedDateTime)}`;
          }

          return "Scheduled for delivery";
        case TransferState.REJECTED:
          if (!!transfer.ReceivedDateTime) {
            return `Return received ${deliveryTimeDescriptor(transfer.ReceivedDateTime)}`;
          }

          if (!!transfer.EstimatedReturnDepartureDateTime) {
            return `Scheduled for return ${deliveryTimeDescriptor(
              transfer.EstimatedReturnDepartureDateTime
            )}`;
          }

          return "Scheduled for return";
        default:
          return `Scheduled for transfer`;
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
    viewManifest(transfer: IIndexedTransferData) {
      const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${transfer.ManifestNumber}`;

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: [manifestUrl],
      });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_VIEW_MANIFEST_BUTTON);
      store.commit(`transferSearch/${MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, false);
    },
    downloadManifest(transfer: IIndexedTransferData) {
      const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${transfer.ManifestNumber}`;

      downloadFileFromUrl({
        url: manifestUrl,
        filename: `Manifest_${transfer.ManifestNumber}.pdf`,
      });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_DOWNLOAD_BUTTON);
      store.commit(`transferSearch/${MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, false);
    },
    printManifest(transfer: IIndexedTransferData) {
      const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${transfer.ManifestNumber}`;

      printPdfFromUrl({ urls: [manifestUrl], modal: true });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_PRINT_BUTTON);
      store.commit(`transferSearch/${MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, false);
    },
    async createScanSheet(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.CLICKED_TOOLKIT_CREATE_SCAN_SHEET_BUTTON);

      await createScanSheet(transfer.Id, transfer.ManifestNumber);

      store.commit(`transferSearch/${MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS}`, false);
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
