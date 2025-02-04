<template>
  <fragment>
    <!-- <b-button size="sm" variant="outline-primary" @click.stop.prevent="transferPackage()" :disabled="!hasPlus">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="truck" />
        </div>

        <span>TRANSFER PACKAGE</span>

        <div class="aspect-square grid place-items-center">
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button> -->

    <b-button v-if="clientState.values.ENABLE_PACKAGE_HISTORY && pkg.PackageState !== PackageState.TRANSFERRED"
      size="sm" variant="outline-primary"
      @click.stop.prevent="setPackageHistorySourcePackage({ pkg }) && openPackageHistoryBuilder()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="sitemap" />
        </div>
        <span>PACKAGE HISTORY</span>
        <div style="width:30px"></div>
      </div>
    </b-button>

    <!-- <b-button
      size="sm"
      variant="outline-primary"
      @click.stop.prevent="openPackageGraph(getLabelOrError(pkg))"
      :disabled="!hasPlus"
      ><div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <b-badge variant="primary">T3+</b-badge>
        </div>
        <span>PACKAGE GRAPH</span>
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="project-diagram" />
        </div>
      </div>
    </b-button> -->

    <b-button size="sm" variant="outline-primary" :disabled="!hasPlus" @click.stop.prevent="
      setExplorerData({ packageLabel: getLabelOrError(pkg) }) && openMetrcExplorer()
      ">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="sitemap" />
        </div>

        <span>OPEN IN EXPLORER</span>
        <div class="aspect-square grid place-items-center">
          <b-badge variant="primary">T3+</b-badge>
        </div>
      </div>
    </b-button>

    <template v-if="isPackageEligibleForSplit">
      <b-button size="sm" variant="outline-primary" @click.stop.prevent="splitPackage()" :disabled="!hasPlus">
        <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
          <div class="aspect-square grid place-items-center">
            <font-awesome-icon icon="expand-alt" />
          </div>
          <span>SPLIT PACKAGE</span>

          <div class="aspect-square grid place-items-center">
            <b-badge variant="primary">T3+</b-badge>
          </div>
        </div>
      </b-button>
    </template>

    <template v-if="!packageMetadataLoaded">
      <b-button size="sm" variant="outline-primary" disabled class="flex flex-row items-center justify-center gap-2">
        <b-spinner small /> <span> Loading package test data...</span>
      </b-button>
    </template>

    <!-- <b-button size="sm" variant="outline-primary" @click.stop.prevent="printTag()">
      <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
        <div class="aspect-square grid place-items-center">
          <font-awesome-icon icon="print" />
        </div>

        <span>PRINT TAG</span>
        <div style="width:30px"></div>
      </div>
    </b-button> -->

    <template v-if="packageMetadataLoaded">
      <template v-if="displayPackageLabTestOptions">
        <template v-if="displayPackageLabTestPDFOptions">

          <b-button size="sm" variant="outline-primary" @click.stop.prevent="viewLabTests()">
            <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="file" />
              </div>

              <span>VIEW LAB TEST PDFS</span>
              <div style="width:30px"></div>
            </div>
          </b-button>

          <b-button size="sm" variant="outline-primary" @click.stop.prevent="printLabTests()">
            <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="print" />
              </div>

              <span>PRINT LAB TEST PDFS</span>
              <div style="width:30px"></div>
            </div>
          </b-button>

          <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadLabTestPdfs()">
            <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="file-download" />
              </div>
              <span>DOWNLOAD LAB TEST PDFS</span>

              <div style="width:30px"></div>
            </div>
          </b-button>
        </template>

        <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadLabTestCsv()">
          <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
            <div class="aspect-square grid place-items-center">
              <font-awesome-icon icon="file-csv" />
            </div>
            <span>DOWNLOAD LAB RESULTS CSV</span>
            <div style="width:30px"></div>
          </div>
        </b-button>
      </template>
    </template>
  </fragment>
</template>

<script lang="ts">
import { AnalyticsEvent, ModalAction, ModalType, PackageState } from "@/consts";
import { IPluginState, IUnionIndexedPackageData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { printPdfFromUrl } from "@/utils/dom";
import {
  downloadLabTestCsv,
  downloadLabTestPdfs,
  generatePackageMetadata,
  getLabelOrError,
} from "@/utils/package";
import { hasPlusImpl } from "@/utils/plus";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "PackageButtonList",
  store,
  router,
  props: {
    pkg: Object as () => IUnionIndexedPackageData,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      clientState: (state: IPluginState) => state.client,
      t3plus: (state: IPluginState) => state.client.t3plus,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    packageMetadataLoaded(): boolean {
      return !!this.$data.packageMetadata;
    },
    displayPackageLabTestOptions(): boolean {
      if (!this.$data.packageMetadata) {
        return false;
      }

      return this.$data.packageMetadata.testResults.length > 0;
    },
    displayPackageLabTestPDFOptions(): boolean {
      if (!this.$data.packageMetadata) {
        return false;
      }

      return this.$data.packageMetadata.testResultPdfUrls.length > 0;
    },
    isPackageEligibleForSplit(): boolean {
      return this.$props.pkg?.PackageState === PackageState.ACTIVE;
    },
  },
  data() {
    return {
      packageMetadata: null,
      PackageState
    };
  },
  methods: {
    getLabelOrError,
    ...mapActions({
      addPackageToTransferList: `transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`,
      removePackageFromTransferList: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
      setSplitSourcePackage: `splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`,
      setPackageHistorySourcePackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setExplorerData: `explorer/${ExplorerActions.SET_EXPLORER_DATA}`,
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
    }),
    openPackageHistoryBuilder() {
      analyticsManager.track(AnalyticsEvent.OPENED_PACKAGE_HISTORY, {
        source: "CONTEXT_MENU",
      });
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/package/history",
      });
    },
    openMetrcExplorer() {
      analyticsManager.track(AnalyticsEvent.OPENED_METRC_EXPLORER, {
        source: "CONTEXT_MENU",
      });
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/metrc-explorer",
      });
    },
    openPackageGraph(query: string) {
      analyticsManager.track(AnalyticsEvent.OPENED_GRAPH, {
        source: "CONTEXT_MENU",
      });

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/graph",
      });

      // store.dispatch(`graph/${GraphActions.SET_SEARCH_QUERY}`, { query });
      this.dismiss();
    },
    dismiss() {
      modalManager.dispatchContextMenuEvent(null);
    },
    transferPackage() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "transferPackage" });

      this.addPackageToTransferList({ pkg: this.$props.pkg });

      analyticsManager.track(AnalyticsEvent.STARTED_TRANSFER_FROM_INLINE_BUTTON, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });
      this.dismiss();
    },
    splitPackage() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "splitPackage" });

      this.setSplitSourcePackage({ pkg: this.$props.pkg });

      analyticsManager.track(AnalyticsEvent.SPLIT_PACKAGE_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/package/split-package",
      });
      this.dismiss();
    },
    // async printTag() {
    //   analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "printTag" });

    //   const labelDataList: ILabelData[] = [
    //     {
    //       count: 1,
    //       primaryValue: getLabelOrError(this.$props.pkg),
    //       secondaryValue: null,
    //       tertiaryValue: null,
    //       licenseNumber: this.$props.pkg.LicenseNumber,
    //       packageState: this.$props.pkg.PackageState,
    //       plantState: null,
    //       plantBatchState: null
    //     }
    //   ];

    //   toastManager.openToast(`Added ${this.$props.pkg.Label} to print list`, {
    //     title: "Success",
    //     autoHideDelay: 3000,
    //     variant: "primary",
    //     appendToast: true,
    //     toaster: "ttt-toaster",
    //     solid: true,
    //   });

    //   store.dispatch(`labelPrint/${LabelPrintActions.PUSH_LABELS}`, {
    //     labelDataList
    //   });

    //   this.dismiss();
    // },
    async viewLabTests() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "viewLabTests" });

      const labTestData = await generatePackageMetadata({ pkg: this.$props.pkg });

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: labTestData.testResultPdfUrls,
      });
      analyticsManager.track(AnalyticsEvent.CLICKED_VIEW_LAB_TEST_BUTTON);
      this.dismiss();
    },
    async printLabTests() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "printLabTests" });

      const labTestData = await generatePackageMetadata({ pkg: this.$props.pkg });

      printPdfFromUrl({ urls: labTestData.testResultPdfUrls, modal: true });

      analyticsManager.track(AnalyticsEvent.CLICKED_PRINT_LAB_TEST_BUTTON);
      this.dismiss();
    },
    downloadLabTestPdfs() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "downloadLabTestPdfs" });

      downloadLabTestPdfs({ pkg: this.$props.pkg });

      analyticsManager.track(AnalyticsEvent.CLICKED_DOWNLOAD_LAB_TEST_BUTTON);
      this.dismiss();
    },
    downloadLabTestCsv() {
      analyticsManager.track(AnalyticsEvent.CONTEXT_MENU_SELECT, { event: "downloadLabTestCsv" });

      downloadLabTestCsv({ pkg: this.$props.pkg });

      analyticsManager.track(AnalyticsEvent.CLICKED_DOWNLOAD_LAB_TEST_BUTTON);
      this.dismiss();
    },
  },
  watch: {
    pkg: {
      immediate: true,
      async handler(newValue, oldValue) {
        this.$data.packageMetadata = null;
        if (newValue) {
          this.$data.packageMetadata = await generatePackageMetadata({ pkg: newValue });
        }
      },
    },
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
