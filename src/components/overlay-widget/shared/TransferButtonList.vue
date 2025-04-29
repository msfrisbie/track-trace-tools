<template>
  <fragment>
    <b-button size="sm" v-if="enableEditTransferButton" variant="outline-primary" @click.stop.prevent="editTransfer()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center"><font-awesome-icon icon="edit" /></div>
        <span>EDIT TRANSFER</span>
        <div style="width: 30px"></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="viewManifest()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center"><font-awesome-icon icon="file" /></div>
        <span>VIEW MANIFEST</span>
        <div style="width: 30px"></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="newTabManifest()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="external-link-alt" />
        </div>
        <span>MANIFEST IN NEW TAB</span>
        <div style="width: 30px"></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="printManifest()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center"><font-awesome-icon icon="print" /></div>
        <span>PRINT MANIFEST</span>
        <div style="width: 30px"></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadManifest()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="file-download" />
        </div>
        <span>DOWNLOAD MANIFEST</span>
        <div style="width: 30px"></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadSummary('CSV')"
      :disabled="!hasPlus || clientState.values.ENABLE_BULK_COA">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="file-csv" />
        </div>
        <span>DOWNLOAD SUMMARY CSV</span>
        <div>
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadSummary('XLSX')"
      :disabled="!hasPlus || clientState.values.ENABLE_BULK_COA">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="file-excel" />
        </div>
        <span>DOWNLOAD SUMMARY XLSX</span>
        <div>
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary"
      v-if="transfer && [TransferState.OUTGOING, TransferState.OUTGOING_INACTIVE].includes(transfer.TransferState)"
      @click.stop.prevent="addToInvoice()" :disabled="!hasPlus">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="file-invoice-dollar" />
        </div>
        <span>GENERATE INVOICE</span>
        <div>
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button>

    <!-- V2 scan sheet, dumps to reports -->
    <b-button size="sm" variant="outline-primary"
      v-if="transfer && [TransferState.INCOMING, TransferState.OUTGOING, TransferState.REJECTED].includes(transfer.TransferState)"
      @click.stop.prevent="addToScanSheet()" :disabled="!hasPlus">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="barcode" />
        </div>
        <span>CREATE SCAN SHEET</span>
        <div>
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button>

    <!-- Deprecated one-off -->
    <b-button size="sm" variant="outline-primary"
      v-if="transfer && ![TransferState.INCOMING, TransferState.OUTGOING, TransferState.REJECTED].includes(transfer.TransferState)"
      @click.stop.prevent="createScanSheetDeprecated()" :disabled="!hasPlus">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="barcode" />
        </div>
        <span>CREATE SCAN SHEET</span>
        <div>
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button>

    <template v-if="!transferMetadataLoaded">
      <b-button size="sm" variant="outline-primary" disabled class="flex flex-row items-center justify-center gap-2">
        <b-spinner small /> <span> Loading transfer test data...</span>
      </b-button>
    </template>

    <template v-if="transferMetadataLoaded">
      <template v-if="displayTransferLabTestPdfOptions">
        <b-button size="sm" :disabled="!transfer || !hasPlus" variant="outline-primary"
          @click.stop.prevent="downloadAllLabTestPdfs()">
          <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
            <div class="aspect-square grid place-items-center">
              <font-awesome-icon icon="file-download" />
            </div>
            <span>DOWNLOAD ALL LAB TEST PDFS</span>

            <div>
              <b-badge variant="primary">T3+</b-badge>
            </div>
          </div>
        </b-button>
      </template>

      <template v-if="displayTransferLabTestCsvOptions">
        <b-button size="sm" :disabled="!transfer || !hasPlus" variant="outline-primary"
          @click.stop.prevent="downloadAllLabTestCsvs()">
          <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
            <div class="aspect-square grid place-items-center">
              <font-awesome-icon icon="file-csv" />
            </div>
            <span>DOWNLOAD ALL LAB TEST RESULT CSVS</span>

            <div>
              <b-badge variant="primary">T3+</b-badge>
            </div>
          </div>
        </b-button>
      </template>
    </template>
  </fragment>
</template>

<script lang="ts">
import { AnalyticsEvent, ModalAction, ModalType, TransferState } from "@/consts";
import { IIndexedTransferData, IPluginState, ITransferMetadata } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { ReportType, ReportsActions, ReportsGetters, ReportsMutations } from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig, IReportOption } from "@/store/page-overlay/modules/reports/interfaces";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { downloadFileFromUrl, printPdfFromUrl } from "@/utils/dom";
import { downloadLabTestCsv, downloadLabTestPdfs, getLabelOrError } from "@/utils/package";
import { hasPlusImpl } from "@/utils/plus";
import { createScanSheet, generateTransferMetadata } from "@/utils/transfer";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "TransferButtonList",
  store,
  router,
  props: {
    transfer: Object as () => IIndexedTransferData,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      clientState: (state: IPluginState) => state.client,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    transferMetadataLoaded(): boolean {
      return !!this.$data.transferMetadata;
    },
    displayTransferLabTestPdfOptions(): boolean {
      return !!(this.$data.transferMetadata as ITransferMetadata)?.packagesTestResults.find(
        (x) => x.testResultPdfUrls.length > 0
      );
    },
    displayTransferLabTestCsvOptions(): boolean {
      return !!(this.$data.transferMetadata as ITransferMetadata)?.packagesTestResults.find(
        (x) => x.testResults.length > 0
      );
    },
    enableEditTransferButton(): boolean {
      if (
        (this.$props.transfer as IIndexedTransferData)?.TransferState !== TransferState.OUTGOING
      ) {
        return false;
      }

      if (!store.state.client.values.ENABLE_TRANSFER_EDIT) {
        return false;
      }

      return true;
    },
    manifestUrl(): string {
      return `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${this.$props.transfer.ManifestNumber}`;
    },
  },
  data() {
    return {
      TransferState,
      transferMetadata: null,
    };
  },
  methods: {
    getLabelOrError,
    ...mapActions({
      addPackageToTransferList: `transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`,
      removePackageFromTransferList: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
      setSplitSourcePackage: `splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`,
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      setPackageHistorySourcePackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setExplorerData: `explorer/${ExplorerActions.SET_EXPLORER_DATA}`,
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      setTransferForUpdate: `transferBuilder/${TransferBuilderActions.SET_TRANSFER_FOR_UPDATE}`,
    }),
    dismiss() {
      modalManager.dispatchContextMenuEvent(null);
    },
    async editTransfer() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "editTransfer" });

      await this.setTransferForUpdate({ transferForUpdate: this.$props.transfer });

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });

      analyticsManager.track(AnalyticsEvent.CLICKED_EDIT_TRANSFER);
      this.dismiss();
    },
    viewManifest() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "viewManifest" });

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: [this.manifestUrl],
      });
      analyticsManager.track(AnalyticsEvent.CLICKED_VIEW_MANIFEST_BUTTON);
      this.dismiss();
    },
    newTabManifest() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "newTabManifest" });

      window.open(this.manifestUrl, "_blank");
      this.dismiss();
    },
    printManifest() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "printManifest" });

      printPdfFromUrl({ urls: [this.manifestUrl], modal: true });

      analyticsManager.track(AnalyticsEvent.CLICKED_PRINT_MANIFEST_BUTTON);
      this.dismiss();
    },
    downloadManifest() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "downloadManifest" });

      downloadFileFromUrl({
        url: this.manifestUrl,
        filename: `Manifest_${this.$props.transfer.ManifestNumber}.pdf`,
      });

      analyticsManager.track(AnalyticsEvent.CLICKED_DOWNLOAD_MANIFEST_BUTTON);
      this.dismiss();
    },
    async downloadSummary(exportFormat: 'CSV' | 'GOOGLE_SHEETS' | 'XLSX' = 'CSV') {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "downloadSummary" });

      toastManager.info("Generating transfer summary CSV...");

      try {
        const reportConfig: IReportConfig = {
          authState: await authManager.authStateOrError(),
          exportFormat,
          fileDeliveryFormat: "DOWNLOAD",
          [ReportType.SINGLE_TRANSFER]: {
            manifestNumber: this.$props.transfer.ManifestNumber as string,
            fields: null,
          },
        };

        store.dispatch(`reports/${ReportsActions.GENERATE_REPORT}`, { reportConfig });
      } catch {
        toastManager.error("Failed to generate summary CSV");
      }

      this.dismiss();
    },
    async downloadAllLabTestCsvs() {
      // Show message immediately inflight...
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "downloadAllLabTestCsvs" });

      toastManager.openToast("Downloading all available lab results from this transfer...", {
        title: "Download in progress",
        autoHideDelay: 3000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      for (const pkg of (this.$data.transferMetadata as ITransferMetadata).packages) {
        await downloadLabTestCsv({ pkg });
      }

      const testedPackageCount: number = (
        this.$data.transferMetadata as ITransferMetadata
      ).packagesTestResults.filter((x) => x.testResults.length > 0).length;

      toastManager.openToast(`Finished downloading ${testedPackageCount} test result CSVs`, {
        title: "Success",
        autoHideDelay: 3000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      this.dismiss();
    },
    async downloadAllLabTestPdfs() {
      // Show message immediately inflight...
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "downloadAllLabTestPdfs" });

      toastManager.openToast("Downloading all available COAs from this transfer...", {
        title: "Download in progress",
        autoHideDelay: 3000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      for (const pkg of (this.$data.transferMetadata as ITransferMetadata).packages) {
        await downloadLabTestPdfs({ pkg });
      }

      const mergedFileIds: number[] = [
        ...new Set(
          (this.$data.transferMetadata as ITransferMetadata).packagesTestResults
            .flatMap((x) => x.fileIds)
        ),
      ];

      console.log(mergedFileIds);

      toastManager.openToast(`Finished downloading ${mergedFileIds.length} COAs`, {
        title: "Success",
        autoHideDelay: 3000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      this.dismiss();
    },
    async createScanSheetDeprecated() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "createScanSheet" });

      await createScanSheet(
        parseInt(this.$props.transfer.ManifestNumber!, 10),
        this.$props.transfer.ManifestNumber.padStart(10, "0")
      );

      this.dismiss();
    },
    async addToInvoice() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "addToInvoice" });

      // Enable scan report if not already enabled
      store.commit(`reports/${ReportsMutations.REPORTS_MUTATION}`, {
        selectedReports: [store.getters[`reports/${ReportsGetters.REPORT_OPTIONS}`].find((x: IReportOption) => x.value === ReportType.INVOICE)]
      });

      // Load the transfers
      await store.dispatch(`reports/${ReportsActions.UPDATE_DYNAMIC_REPORT_DATA}`, { reportType: ReportType.INVOICE });

      // Select this transfer
      const reportFormFilters = store.state.reports.reportFormFilters;

      const transfer: IIndexedTransferData = this.$props.transfer;

      switch (transfer.TransferState) {
        case TransferState.OUTGOING:
          const outgoingTransfer = reportFormFilters[ReportType.INVOICE]!.allOutgoingTransfers.find(
            (x) => x.ManifestNumber === transfer.ManifestNumber
          )!;

          reportFormFilters[ReportType.INVOICE]!.selectedOutgoingTransfer = outgoingTransfer;
          store.commit(`reports/${ReportsMutations.REPORTS_MUTATION}`, {
            reportFormFilters
          });
          break;

        default:
          console.error(`Unexpected TransferState: ${transfer.TransferState}`);
          break;
      }

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/google-sheets-export",
      });

      this.dismiss();
    },
    async addToScanSheet() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "addToScanSheet" });

      // Enable scan report if not already enabled
      if (!store.state.reports.selectedReports.find((x: IReportOption) => x.value === ReportType.SCAN_SHEET)) {
        store.commit(`reports/${ReportsMutations.REPORTS_MUTATION}`, {
          selectedReports: [...store.state.reports.selectedReports, store.getters[`reports/${ReportsGetters.REPORT_OPTIONS}`].find((x: IReportOption) => x.value === ReportType.SCAN_SHEET)]
        });
      }

      // Load the transfers
      await store.dispatch(`reports/${ReportsActions.UPDATE_DYNAMIC_REPORT_DATA}`, { reportType: ReportType.SCAN_SHEET });

      // Select this transfer
      const reportFormFilters = store.state.reports.reportFormFilters;

      const transfer: IIndexedTransferData = this.$props.transfer;

      switch (transfer.TransferState) {
        case TransferState.INCOMING:
          const incomingTransfer = reportFormFilters[ReportType.SCAN_SHEET]!.allIncomingTransfers.find(
            (x) => x.ManifestNumber === transfer.ManifestNumber
          );
          if (
            incomingTransfer &&
            !reportFormFilters[ReportType.SCAN_SHEET]!.selectedIncomingTransfers.find(
              (x) => x.Id === incomingTransfer.Id
            )
          ) {
            reportFormFilters[ReportType.SCAN_SHEET]!.selectedIncomingTransfers.push(incomingTransfer);
            store.commit(`reports/${ReportsMutations.REPORTS_MUTATION}`, {
              reportFormFilters
            });
          }
          break;

        case TransferState.OUTGOING:
          const outgoingTransfer = reportFormFilters[ReportType.SCAN_SHEET]!.allOutgoingTransfers.find(
            (x) => x.ManifestNumber === transfer.ManifestNumber
          );
          if (
            outgoingTransfer &&
            !reportFormFilters[ReportType.SCAN_SHEET]!.selectedOutgoingTransfers.find(
              (x) => x.Id === outgoingTransfer.Id
            )
          ) {
            reportFormFilters[ReportType.SCAN_SHEET]!.selectedOutgoingTransfers.push(outgoingTransfer);
            store.commit(`reports/${ReportsMutations.REPORTS_MUTATION}`, {
              reportFormFilters
            });
          }
          break;

        case TransferState.REJECTED:
          const rejectedTransfer = reportFormFilters[ReportType.SCAN_SHEET]!.allRejectedTransfers.find(
            (x) => x.ManifestNumber === transfer.ManifestNumber
          );
          if (
            rejectedTransfer &&
            !reportFormFilters[ReportType.SCAN_SHEET]!.selectedRejectedTransfers.find(
              (x) => x.Id === rejectedTransfer.Id
            )
          ) {
            reportFormFilters[ReportType.SCAN_SHEET]!.selectedRejectedTransfers.push(rejectedTransfer);
            store.commit(`reports/${ReportsMutations.REPORTS_MUTATION}`, {
              reportFormFilters
            });
          }
          break;

        default:
          console.error(`Unexpected TransferState: ${transfer.TransferState}`);
          break;
      }

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/google-sheets-export",
      });

      this.dismiss();
    },
  },
  watch: {
    transfer: {
      immediate: true,
      async handler(newValue, oldValue) {
        this.$data.transferMetadata = null;
        if (newValue) {
          this.$data.transferMetadata = await generateTransferMetadata({
            transfer: newValue,
            loadPackageTestData: true,
          });
        }
      },
    },
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
