<template>
  <div v-if="transfer" class="flex flex-col items-center space-y-8 px-2 p-4">
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-row items-center space-x-4 text-center">
            <transfer-icon :transfer="transfer" class="text-5xl" />

            <div class="text-2xl">
              {{ transferPackageSummary }}
            </div>
          </div>

          <b-badge :variant="badgeVariant(transfer)">{{ displayTransferState(transfer) }}</b-badge>
        </div>
      </div>

      <div
        v-show="isOnTransfersPage"
        @click.stop.prevent="setTransferManifestNumberFilter(transfer)"
        class="flex flex-row items-center justify-center cursor-pointer h-full"
      >
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <div class="text-3xl text-purple-800 text-center">
      {{ transferDescriptor }}
    </div>

    <div class="flex flex-col space-y-2">
      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="viewManifest(transfer)"
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>VIEW MANIFEST</span>
        <font-awesome-icon icon="file" />
      </b-button>

      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="downloadManifest(transfer)"
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>DOWNLOAD MANIFEST</span>
        <font-awesome-icon icon="file-download" />
      </b-button>

      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="printManifest(transfer)"
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>PRINT MANIFEST</span>
        <font-awesome-icon icon="print" />
      </b-button>

      <b-button
        variant="outline-primary"
        size="sm"
        style="width: 100%"
        @click.stop.prevent="createScanSheet(transfer)"
        class="flex flex-row items-center justify-between space-x-4"
      >
        <span>CREATE SCAN SHEET</span>
        <font-awesome-icon icon="barcode" />
      </b-button>

      <!-- <b-button
        variant="outline-secondary"
        size="sm"
        @click.stop.prevent="setTransferManifestNumberFilter(transfer)"
        >SHOW IN METRC</b-button
      > -->

      <!-- <b-button
        variant="outline-secondary"
        size="sm"
        @click.stop.prevent="copyToClipboard(transfer)"
        >COPY MANIFEST #</b-button
      > -->
    </div>

    <table class="text-lg">
      <tr class="cursor-pointer hover:bg-purple-50" @click.stop.prevent="copyToClipboard(transfer)">
        <td class="text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="file" />
        </td>
        <td class="p-2">Manifest {{ transfer.ManifestNumber }}</td>
      </tr>
      <tr>
        <td class="text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="clock" />
        </td>
        <td class="p-2">{{ transferNextCheckpoint }}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import TransferIcon from "@/components/transfer-search-widget/TransferIcon.vue";
import {
  MessageType,
  ModalAction,
  ModalType,
  TransferFilterIdentifiers,
  TransferState,
} from "@/consts";
import { IIndexedTransferData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { pageManager, TRANSFER_TAB_REGEX } from "@/modules/page-manager.module";
import { ISelectedTransferMetadata, searchManager } from "@/modules/search-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { copyToClipboard, downloadFileFromUrl, printPdfFromUrl } from "@/utils/dom";
import { createScanSheet } from "@/utils/transfer";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Vue from "vue";

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
  components: { TransferIcon },
  created() {
    searchManager.selectedTransfer
      .asObservable()
      .pipe(takeUntil(this.$data.destroyed$))
      .subscribe(
        (selectedTransferMetadata: ISelectedTransferMetadata | null) =>
          (this.$data.transfer = selectedTransferMetadata
            ? selectedTransferMetadata.transferData
            : null)
      );
  },
  computed: {
    isOnTransfersPage() {
      return window.location.pathname.match(TRANSFER_TAB_REGEX);
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
    // transferStatusDescriptor() {
    //   const transfer: IIndexedTransferData = this.$data.transfer;

    //   switch (transfer.TransferState) {
    //     case TransferState.INCOMING:
    //     case TransferState.OUTGOING:
    //       if (!!transfer.ActualArrivalDateTime) {
    //         return "Delivered";
    //       }

    //       if (!!transfer.ActualDepartureDateTime) {
    //         return "In Transit";
    //       }

    //       return "Scheduled";
    //     case TransferState.REJECTED:
    //       if (!!transfer.ActualReturnArrivalDateTime) {
    //         return "Returned";
    //       }

    //       if (!!transfer.ActualReturnDepartureDateTime) {
    //         return "In Transit";
    //       }

    //       return "Scheduled";
    //     default:
    //       return "Scheduled";
    //   }
    // },
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
    // transferNextCheckpointTime() {
    //   const transfer: IIndexedTransferData = this.$data.transfer;

    //   switch (transfer.TransferState) {
    //     case TransferState.INCOMING:
    //     case TransferState.OUTGOING:
    //       return `${transfer.PackageCount} packages`;
    //     case TransferState.REJECTED:
    //     default:
    //       return `${transfer.DeliveryPackageCount} packages`;
    //   }
    // },
  },
  beforeDestroy() {
    this.$data.destroyed$.next(null);
  },
  data(): {
    destroyed$: Subject<void>;
    transfer: IIndexedTransferData | null;
  } {
    return {
      destroyed$: new Subject(),
      transfer: null,
    };
  },
  methods: {
    async setTransferManifestNumberFilter(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      switch (transfer.TransferState as TransferState) {
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
        transfer.ManifestNumber
      );

      this.$store.commit(MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS, false);
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
      this.$store.commit(MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS, false);
    },
    downloadManifest(transfer: IIndexedTransferData) {
      const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${transfer.ManifestNumber}`;

      downloadFileFromUrl({
        url: manifestUrl,
        filename: `Manifest_${transfer.ManifestNumber}.pdf`,
      });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_DOWNLOAD_BUTTON);
      this.$store.commit(MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS, false);
    },
    printManifest(transfer: IIndexedTransferData) {
      const manifestUrl = `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${transfer.ManifestNumber}`;

      printPdfFromUrl({ urls: [manifestUrl], modal: true });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_PRINT_BUTTON);
      this.$store.commit(MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS, false);
    },
    async createScanSheet(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.CLICKED_TOOLKIT_CREATE_SCAN_SHEET_BUTTON);

      await createScanSheet(transfer.Id, transfer.ManifestNumber);

      this.$store.commit(MutationType.SET_SHOW_TRANSFER_SEARCH_RESULTS, false);
    },
    badgeVariant(transfer: IIndexedTransferData) {
      // @ts-ignore
      switch (transfer.TransferState as TransferState) {
        case TransferState.INCOMING:
          return "success";
        case TransferState.OUTGOING:
          return "primary";
        case TransferState.REJECTED:
          return "danger";
        default:
          return null;
      }
    },
    displayTransferState(transfer: IIndexedTransferData) {
      // @ts-ignore
      return transfer.TransferState;
    },
  },
});
</script>
