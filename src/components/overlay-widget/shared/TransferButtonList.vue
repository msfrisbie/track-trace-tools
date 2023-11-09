<template>
  <fragment>
    <b-button
      size="sm"
      v-if="enableEditTransferButton"
      variant="outline-primary"
      @click.stop.prevent="editTransfer()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>EDIT TRANSFER</span>

        <div class="aspect-square grid place-items-center"><font-awesome-icon icon="edit" /></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="viewManifest()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>VIEW MANIFEST</span>

        <div class="aspect-square grid place-items-center"><font-awesome-icon icon="file" /></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="newTabManifest()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>MANIFEST IN NEW TAB</span>

        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="external-link-alt" />
        </div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="printManifest()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>PRINT MANIFEST</span>

        <div class="aspect-square grid place-items-center"><font-awesome-icon icon="print" /></div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadManifest()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>DOWNLOAD MANIFEST</span>

        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="file-download" />
        </div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadSummary()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>DOWNLOAD SUMMARY</span>

        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="file-csv" />
        </div>
      </div>
    </b-button>

    <b-button size="sm" variant="outline-primary" @click.stop.prevent="createScanSheet()"
      ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
        <span>CREATE SCAN SHEET</span>

        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="barcode" />
        </div>
      </div>
    </b-button>

    <template v-if="!transferMetadataLoaded">
      <b-button
        size="sm"
        variant="outline-primary"
        disabled
        class="flex flex-row items-center justify-center gap-2"
      >
        <b-spinner small /> <span> Loading transfer test data...</span>
      </b-button>
    </template>

    <template v-if="transferMetadataLoaded">
      <template v-if="displayTransferLabTestPdfOptions">
        <b-button
          size="sm"
          :disabled="!transfer || (!clientValues['ENABLE_T3PLUS'] && !t3plus)"
          variant="outline-primary"
          @click.stop.prevent="downloadAllLabTestPdfs()"
          ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
            <span>DOWNLOAD ALL LAB TEST PDFS</span>

            <div class="aspect-square grid place-items-center">
              <font-awesome-icon icon="file-download" />
            </div>
          </div>
        </b-button>
      </template>

      <template v-if="displayTransferLabTestCsvOptions">
        <b-button
          size="sm"
          :disabled="!transfer || (!clientValues['ENABLE_T3PLUS'] && !t3plus)"
          variant="outline-primary"
          @click.stop.prevent="downloadAllLabTestCsvs()"
          ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
            <span>DOWNLOAD ALL LAB TEST RESULT CSVS</span>

            <div class="aspect-square grid place-items-center">
              <font-awesome-icon icon="file-csv" />
            </div>
          </div>
        </b-button>
      </template>
    </template>
  </fragment>
</template>

<script lang="ts">
import { MessageType, ModalAction, ModalType, TransferState } from "@/consts";
import { IIndexedTransferData, IPluginState, ITransferMetadata } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { ReportsActions, ReportType } from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { downloadFileFromUrl, printPdfFromUrl } from "@/utils/dom";
import { downloadLabTestCsv, downloadLabTestPdfs, getLabelOrError } from "@/utils/package";
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
      clientValues: (state: IPluginState) => state.client.values,
      t3plus: (state: IPluginState) => state.client.t3plus,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
    }),
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
      transferMetadata: null,
    };
  },
  methods: {
    getLabelOrError,
    ...mapActions({
      addPackageToTransferList: `transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`,
      removePackageFromTransferList: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
      setSplitSourcePackage: `splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`,
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setSearchType: `search/${SearchActions.SET_SEARCH_TYPE}`,
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
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "editTransfer" });

      await this.setTransferForUpdate({ transferForUpdate: this.$props.transfer });

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });

      analyticsManager.track(MessageType.CLICKED_EDIT_TRANSFER);
      this.dismiss();
    },
    viewManifest() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "viewManifest" });

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: [this.manifestUrl],
      });
      analyticsManager.track(MessageType.CLICKED_VIEW_MANIFEST_BUTTON);
      this.dismiss();
    },
    newTabManifest() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "newTabManifest" });

      window.open(this.manifestUrl, "_blank");
      this.dismiss();
    },
    printManifest() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "printManifest" });

      printPdfFromUrl({ urls: [this.manifestUrl], modal: true });

      analyticsManager.track(MessageType.CLICKED_PRINT_MANIFEST_BUTTON);
      this.dismiss();
    },
    downloadManifest() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadManifest" });

      downloadFileFromUrl({
        url: this.manifestUrl,
        filename: `Manifest_${this.$props.transfer.ManifestNumber}.pdf`,
      });

      analyticsManager.track(MessageType.CLICKED_DOWNLOAD_MANIFEST_BUTTON);
      this.dismiss();
    },
    async downloadSummary() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadSummary" });

      toastManager.info("Generating transfer summary CSV...");

      const reportConfig: IReportConfig = {
        authState: await authManager.authStateOrError(),
        exportFormat: "CSV",
        [ReportType.SINGLE_TRANSFER]: {
          manifestNumber: this.$props.transfer.ManifestNumber as string,
          fields: null,
        },
      };

      store.dispatch(`reports/${ReportsActions.GENERATE_REPORT}`, { reportConfig });

      this.dismiss();
    },
    async downloadAllLabTestCsvs() {
      // Show message immediately inflight...
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadAllLabTestCsvs" });

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
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadAllLabTestPdfs" });

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

      const mergedPdfs: string[] = [
        ...new Set(
          (this.$data.transferMetadata as ITransferMetadata).packagesTestResults.map(
            (x) => x.testResultPdfUrls
          )
        ),
      ].flat();

      toastManager.openToast(`Finished downloading ${mergedPdfs.length} COAs`, {
        title: "Success",
        autoHideDelay: 3000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      this.dismiss();
    },
    async createScanSheet() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "createScanSheet" });

      await createScanSheet(
        parseInt(this.$props.transfer.ManifestNumber!, 10),
        this.$props.transfer.ManifestNumber.padStart(10, "0")
      );

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
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
