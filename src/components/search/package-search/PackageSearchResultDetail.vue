<template>
  <div v-if="pkg" class="flex flex-col items-center space-y-8 px-2 p-4">
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-row items-center space-x-4 text-center">
            <metrc-tag :label="pkg.Label" sideText="PACKAGE"></metrc-tag>
          </div>

          <b-badge :variant="badgeVariant(pkg)">{{ displayPackageState(pkg) }}</b-badge>
        </div>
      </div>

      <div
        v-show="isOnPackagesPage"
        @click.stop.prevent="setPackageLabelFilter(pkg)"
        class="flex flex-row items-center justify-center cursor-pointer h-full"
      >
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <template v-if="t3plusEnabled">
        <b-button
          class="w-full flex flex-row items-center justify-between space-x-4"
          variant="outline-primary"
          @click.stop.prevent="
            setPackageHistorySourcePackage({ pkg }) && openPackageHistoryBuilder()
          "
        >
          <span>PACKAGE HISTORY</span>
          <font-awesome-icon icon="sitemap" />
        </b-button>

        <b-button
          class="w-full flex flex-row items-center justify-between space-x-4"
          variant="outline-primary"
          @click.stop.prevent="
            setExplorerData({ packageLabel: getLabelOrError(pkg) }) && openMetrcExplorer()
          "
        >
          <span>OPEN IN EXPLORER</span>
          <font-awesome-icon icon="sitemap" />
        </b-button>
      </template>

      <template v-if="isIdentityEligibleForTransferToolsImpl">
        <template v-if="isPackageEligibleForTransfer">
          <b-button
            class="w-full flex flex-row items-center justify-between space-x-4"
            variant="outline-primary"
            @click.stop.prevent="addPackageToTransferList({ pkg }) && openNewTransferBuilder()"
          >
            <span>CREATE TRANSFER</span>
            <font-awesome-icon icon="plus" />
          </b-button>
        </template>
      </template>

      <template v-if="isIdentityEligibleForSplitToolsImpl">
        <template v-if="isPackageEligibleForSplit">
          <b-button
            variant="outline-primary"
            @click.stop.prevent="setSplitSourcePackage({ pkg }) && openSplitPackageBuilder()"
            class="w-full flex flex-row items-center justify-between space-x-4"
          >
            <span>SPLIT PACKAGE</span>
            <font-awesome-icon icon="expand-alt" />
          </b-button>
        </template>
      </template>

      <template v-if="packageLabTestPdfEligible && pkg.LabTestingStateName === 'TestPassed'">
        <div class="flex flex-col space-y-2">
          <b-button
            variant="outline-primary"
            @click.stop.prevent="viewLabResult(pkg)"
            class="w-full flex flex-row items-center justify-between space-x-4"
          >
            <span>VIEW LAB TEST</span>
            <font-awesome-icon icon="file" />
          </b-button>

          <b-button
            variant="outline-primary"
            @click.stop.prevent="printLabResult(pkg)"
            class="w-full flex flex-row items-center justify-between space-x-4"
          >
            <span>PRINT LAB TEST</span>
            <font-awesome-icon icon="print" />
          </b-button>

          <b-button
            variant="outline-primary"
            class="w-full flex flex-row items-center justify-between space-x-4"
            @click.stop.prevent="downloadLabResult(pkg)"
          >
            <span>DOWNLOAD LAB TEST</span>
            <font-awesome-icon icon="file-download" />
          </b-button>
        </div>
      </template>
    </div>

    <recursive-json-table :jsonObject="pkg"></recursive-json-table>
  </div>
</template>

<script lang="ts">
import MetrcTag from "@/components/overlay-widget/shared/MetrcTag.vue";
import PackageIcon from "@/components/search/package-search/PackageIcon.vue";
import {
  MessageType,
  METRC_HOSTNAMES_LACKING_LAB_PDFS,
  ModalAction,
  ModalType,
  PackageState,
} from "@/consts";
import { IIndexedPackageData, ITransferPackageList } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { PACKAGE_TAB_REGEX } from "@/modules/page-manager/consts";
import { searchManager } from "@/modules/search-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import {
  TransferBuilderActions,
  TransferBuilderGetters,
} from "@/store/page-overlay/modules/transfer-builder/consts";
import {
  isIdentityEligibleForSplitTools,
  isIdentityEligibleForTransferTools,
} from "@/utils/access-control";
import { copyToClipboard, printPdfFromUrl } from "@/utils/dom";
import { downloadLabTests, getLabelOrError, getLabTestUrlsFromPackage } from "@/utils/package";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";

export default Vue.extend({
  name: "PackageSearchResultDetail",
  store,
  components: { MetrcTag, RecursiveJsonTable },
  async created() {
    searchManager.selectedPackage
      .asObservable()
      .pipe(takeUntil(this.$data.destroyed$))
      .subscribe(
        (selectedPackageMetatdata) =>
          (this.$data.pkg = selectedPackageMetatdata ? selectedPackageMetatdata.packageData : null)
      );
  },
  beforeDestroy() {
    this.$data.destroyed$.next(null);
  },
  data(): {
    packageLabTestPdfEligible: boolean;
    destroyed$: Subject<void>;
    pkg: IIndexedPackageData | null;
    activeTransferPackageList: ITransferPackageList | null;
  } {
    return {
      packageLabTestPdfEligible: !METRC_HOSTNAMES_LACKING_LAB_PDFS.includes(
        window.location.hostname
      ),
      destroyed$: new Subject(),
      pkg: null,
      activeTransferPackageList: null,
    };
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      flags: (state: any) => state.flags,
    }),
    isOnPackagesPage() {
      return window.location.pathname.match(PACKAGE_TAB_REGEX);
    },
    isPackageEligibleForTransfer(): boolean {
      return this.$data.pkg.PackageState === PackageState.ACTIVE;
    },
    isIdentityEligibleForTransferToolsImpl(): boolean {
      return isIdentityEligibleForTransferTools({
        hostname: window.location.hostname,
      });
    },
    isPackageEligibleForSplit(): boolean {
      return this.$data.pkg.PackageState === PackageState.ACTIVE;
    },
    isIdentityEligibleForSplitToolsImpl(): boolean {
      return isIdentityEligibleForSplitTools({
        identity: this.authState?.identity,
        hostname: window.location.hostname,
      });
    },
    ...mapGetters({
      isPackageInActiveList: `transferBuilder/${TransferBuilderGetters.IS_PACKAGE_IN_ACTIVE_LIST}`,
    }),
    t3plusEnabled() {
      return clientBuildManager.assertValues(["ENABLE_T3PLUS"]);
    },
  },
  watch: {},
  methods: {
    getLabelOrError,
    ...mapActions({
      addPackageToTransferList: `transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`,
      removePackageFromTransferList: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
      setSplitSourcePackage: `splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`,
      setShowPackageSearchResults: `packageSearch/${PackageSearchActions.SET_SHOW_PACKAGE_SEARCH_RESULTS}`,
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
      setPackageHistorySourcePackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setExplorerData: `explorer/${ExplorerActions.SET_EXPLORER_DATA}`,
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
    openNewTransferBuilder() {
      analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });
    },
    openSplitPackageBuilder() {
      analyticsManager.track(MessageType.SPLIT_PACKAGE_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/package/split-package",
      });
    },
    async setPackageLabelFilter(pkg: IIndexedPackageData) {
      analyticsManager.track(MessageType.SELECTED_PACKAGE);

      this.$store.dispatch(
        `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
        {
          packageState: pkg.PackageState,
          packageSearchFilters: {
            label: pkg.Label,
          },
        }
      );

      this.setShowPackageSearchResults({ showPackageSearchResults: false });
    },
    copyToClipboard(pkg: IIndexedPackageData) {
      analyticsManager.track(MessageType.COPIED_TEXT, { value: pkg.Label });

      copyToClipboard(pkg.Label);

      toastManager.openToast(`'${pkg.Label}' copied to clipboard`, {
        title: "Copied Tag",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
    badgeVariant(pkg: IIndexedPackageData) {
      switch (pkg.PackageState) {
        case PackageState.ACTIVE:
          return "success";
        case PackageState.INACTIVE:
          return "danger";
        case PackageState.IN_TRANSIT:
          return "dark";
        default:
          return null;
      }
    },
    displayPackageState(pkg: IIndexedPackageData) {
      switch (pkg.PackageState) {
        case PackageState.IN_TRANSIT:
          return PackageState.IN_TRANSIT;
        default:
          return pkg.PackageState;
      }
    },
    async viewLabResult(pkg: IIndexedPackageData) {
      const urls = await getLabTestUrlsFromPackage({ pkg });

      if (!urls[0]) {
        return;
      }

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: urls,
      });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_VIEW_LAB_TEST_BUTTON);
      this.setShowPackageSearchResults({ showPackageSearchResults: false });
    },
    async printLabResult(pkg: IIndexedPackageData) {
      const urls = await getLabTestUrlsFromPackage({ pkg });

      if (!urls[0]) {
        return;
      }

      printPdfFromUrl({ urls, modal: true });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_PRINT_LAB_TEST_BUTTON);
      this.setShowPackageSearchResults({ showPackageSearchResults: false });
    },
    async downloadLabResult(pkg: IIndexedPackageData) {
      downloadLabTests({ pkg });

      analyticsManager.track(MessageType.CLICKED_TOOLKIT_DOWNLOAD_LAB_TEST_BUTTON);
      this.setShowPackageSearchResults({ showPackageSearchResults: false });
    },
    async upsertPackage({ pkg }: { pkg: IIndexedPackageData }) {},
  },
});
</script>
