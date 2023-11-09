<template>
  <fragment>
    <template v-if="isIdentityEligibleForTransferToolsImpl">
      <b-button size="sm" variant="outline-primary" @click.stop.prevent="transferPackage()"
        ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
          <span>TRANSFER PACKAGE</span>
          <div class="aspect-square grid place-items-center">
            <font-awesome-icon icon="truck" />
          </div>
        </div>
      </b-button>
    </template>

    <template v-if="clientValues['ENABLE_T3PLUS'] || t3plus">
      <b-button
        size="sm"
        variant="outline-primary"
        class="aspect-square grid place-items-center"
        @click.stop.prevent="setPackageHistorySourcePackage({ pkg }) && openPackageHistoryBuilder()"
        ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
          <span>PACKAGE HISTORY</span>
          <div class="aspect-square grid place-items-center">
            <font-awesome-icon icon="sitemap" />
          </div>
        </div>
      </b-button>

      <b-button
        size="sm"
        variant="outline-primary"
        class="aspect-square grid place-items-center"
        @click.stop.prevent="
          setExplorerData({ packageLabel: getLabelOrError(pkg) }) && openMetrcExplorer()
        "
        ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
          <span>OPEN IN EXPLORER</span>
          <div class="aspect-square grid place-items-center">
            <font-awesome-icon icon="sitemap" />
          </div>
        </div>
      </b-button>
    </template>

    <template v-if="isIdentityEligibleForSplitToolsImpl && isPackageEligibleForSplit">
      <b-button size="sm" variant="outline-primary" @click.stop.prevent="splitPackage()"
        ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
          <span>SPLIT PACKAGE</span>
          <div class="aspect-square grid place-items-center">
            <font-awesome-icon icon="expand-alt" />
          </div>
        </div>
      </b-button>
    </template>

    <template v-if="!packageMetadataLoaded">
      <b-button
        size="sm"
        variant="outline-primary"
        disabled
        class="flex flex-row items-center justify-center gap-2"
      >
        <b-spinner small /> <span> Loading package test data...</span>
      </b-button>
    </template>

    <template v-if="packageMetadataLoaded">
      <template v-if="displayPackageLabTestOptions">
        <template v-if="displayPackageLabTestPDFOptions">
          <b-button size="sm" variant="outline-primary" @click.stop.prevent="viewLabTests()"
            ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
              <span>VIEW LAB TEST PDFS</span>
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="file" />
              </div>
            </div>
          </b-button>

          <b-button size="sm" variant="outline-primary" @click.stop.prevent="printLabTests()"
            ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
              <span>PRINT LAB TEST PDFS</span>
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="print" />
              </div>
            </div>
          </b-button>

          <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadLabTestPdfs()"
            ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
              <span>DOWNLOAD LAB TEST PDFS</span>
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="file-download" />
              </div>
            </div>
          </b-button>
        </template>

        <b-button size="sm" variant="outline-primary" @click.stop.prevent="downloadLabTestCsv()"
          ><div class="w-full grid grid-cols-2 gap-2" style="grid-template-columns: 1fr auto">
            <span>DOWNLOAD LAB RESULTS CSV</span>
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
import { MessageType, ModalAction, ModalType, PackageState } from "@/consts";
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
import {
  isIdentityEligibleForSplitTools,
  isIdentityEligibleForTransferTools,
} from "@/utils/access-control";
import { printPdfFromUrl } from "@/utils/dom";
import {
  downloadLabTestCsv,
  downloadLabTestPdfs,
  generatePackageMetadata,
  getLabelOrError,
} from "@/utils/package";
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
      clientValues: (state: IPluginState) => state.client.values,
      t3plus: (state: IPluginState) => state.client.t3plus,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
    }),
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
    isIdentityEligibleForTransferToolsImpl(): boolean {
      return isIdentityEligibleForTransferTools({
        hostname: window.location.hostname,
      });
    },
    isPackageEligibleForSplit(): boolean {
      return this.$props.pkg?.PackageState === PackageState.ACTIVE;
    },
    isIdentityEligibleForSplitToolsImpl(): boolean {
      return isIdentityEligibleForSplitTools({
        identity: store.state.pluginAuth.authState?.identity || null,
        hostname: window.location.hostname,
      });
    },
  },
  data() {
    return {
      packageMetadata: null,
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
      analyticsManager.track(MessageType.OPENED_PACKAGE_HISTORY, {
        source: "CONTEXT_MENU",
      });
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/package/history",
      });
    },
    openMetrcExplorer() {
      analyticsManager.track(MessageType.OPENED_METRC_EXPLORER, {
        source: "CONTEXT_MENU",
      });
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/metrc-explorer",
      });
    },
    dismiss() {
      modalManager.dispatchContextMenuEvent(null);
    },
    transferPackage() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "transferPackage" });

      this.addPackageToTransferList({ pkg: this.$props.pkg });

      analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_INLINE_BUTTON, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });
      this.dismiss();
    },
    splitPackage() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "splitPackage" });

      this.setSplitSourcePackage({ pkg: this.$props.pkg });

      analyticsManager.track(MessageType.SPLIT_PACKAGE_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/package/split-package",
      });
      this.dismiss();
    },
    async viewLabTests() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "viewLabTests" });

      const labTestData = await generatePackageMetadata({ pkg: this.$props.pkg });

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: labTestData.testResultPdfUrls,
      });
      analyticsManager.track(MessageType.CLICKED_VIEW_LAB_TEST_BUTTON);
      this.dismiss();
    },
    async printLabTests() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "printLabTests" });

      const labTestData = await generatePackageMetadata({ pkg: this.$props.pkg });

      printPdfFromUrl({ urls: labTestData.testResultPdfUrls, modal: true });

      analyticsManager.track(MessageType.CLICKED_PRINT_LAB_TEST_BUTTON);
      this.dismiss();
    },
    downloadLabTestPdfs() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadLabTestPdfs" });

      downloadLabTestPdfs({ pkg: this.$props.pkg });

      analyticsManager.track(MessageType.CLICKED_DOWNLOAD_LAB_TEST_BUTTON);
      this.dismiss();
    },
    downloadLabTestCsv() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadLabTestCsv" });

      downloadLabTestCsv({ pkg: this.$props.pkg });

      analyticsManager.track(MessageType.CLICKED_DOWNLOAD_LAB_TEST_BUTTON);
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
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
