<template>
  <div v-if="packageSearchState.selectedPackageMetadata" class="flex flex-col items-center space-y-8 px-2 p-4">
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-row items-center space-x-4 text-center">
            <metrc-tag :label="getLabelOrError(packageSearchState.selectedPackageMetadata.packageData)"
              sideText="PACKAGE"></metrc-tag>
          </div>

          <b-badge class="text-lg" :variant="badgeVariant(packageSearchState.selectedPackageMetadata.packageData)">{{
    displayPackageState(packageSearchState.selectedPackageMetadata.packageData)
  }}</b-badge>
        </div>
      </div>

      <div v-show="isOnPackagesPage" @click.stop.prevent="
    setPackageLabelFilter(packageSearchState.selectedPackageMetadata.packageData)
    " class="flex flex-row items-center justify-center cursor-pointer h-full">
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <package-button-list :pkg="packageSearchState.selectedPackageMetadata.packageData"></package-button-list>
    </div>

    <recursive-json-table :jsonObject="packageSearchState.selectedPackageMetadata.packageData"></recursive-json-table>
  </div>
</template>

<script lang="ts">
import MetrcTag from "@/components/overlay-widget/shared/MetrcTag.vue";
import PackageButtonList from "@/components/overlay-widget/shared/PackageButtonList.vue";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import {
  MessageType,
  METRC_HOSTNAMES_LACKING_LAB_PDFS,
  ModalAction,
  ModalType,
  PackageSearchFilterKeys,
  PackageState,
} from "@/consts";
import { IUnionIndexedPackageData, IPluginState, ITransferPackageList } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { PACKAGE_TAB_REGEX } from "@/modules/page-manager/consts";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import {
  TransferBuilderActions,
  TransferBuilderGetters,
} from "@/store/page-overlay/modules/transfer-builder/consts";
import { copyToClipboard } from "@/utils/dom";
import { getLabelOrError } from "@/utils/package";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackageSearchResultDetail",
  store,
  components: { MetrcTag, RecursiveJsonTable, PackageButtonList },
  data(): {
    packageLabTestPdfEligible: boolean;
    activeTransferPackageList: ITransferPackageList | null;
  } {
    return {
      packageLabTestPdfEligible: !METRC_HOSTNAMES_LACKING_LAB_PDFS.includes(
        window.location.hostname
      ),
      activeTransferPackageList: null,
    };
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      flags: (state: IPluginState) => state.flags,
      packageSearchState: (state: IPluginState) => state.packageSearch,
    }),
    isOnPackagesPage() {
      return window.location.pathname.match(PACKAGE_TAB_REGEX);
    },
    ...mapGetters({
      isPackageInActiveList: `transferBuilder/${TransferBuilderGetters.IS_PACKAGE_IN_ACTIVE_LIST}`,
    }),
    t3plusEnabled() {
      return store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus;
    },
  },
  watch: {},
  methods: {
    getLabelOrError,
    ...mapActions({
      addPackageToTransferList: `transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`,
      removePackageFromTransferList: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
      setSplitSourcePackage: `splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`,
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
      setPackageHistorySourcePackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setExplorerData: `explorer/${ExplorerActions.SET_EXPLORER_DATA}`,
    }),
    openNewTransferBuilder() {
      analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });
    },
    async setPackageLabelFilter(pkg: IUnionIndexedPackageData) {
      analyticsManager.track(MessageType.SELECTED_PACKAGE);

      store.dispatch(
        `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
        {
          packageState: pkg.PackageState,
          packageSearchFilters: {
            [PackageSearchFilterKeys.LABEL]: getLabelOrError(pkg),
          },
        }
      );

      this.setShowSearchResults({ showSearchResults: false });
    },
    copyToClipboard(pkg: IUnionIndexedPackageData) {
      analyticsManager.track(MessageType.COPIED_TEXT, { value: getLabelOrError(pkg) });

      copyToClipboard(getLabelOrError(pkg));

      toastManager.openToast(`'${getLabelOrError(pkg)}' copied to clipboard`, {
        title: "Copied Tag",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
    badgeVariant(pkg: IUnionIndexedPackageData) {
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
    displayPackageState(pkg: IUnionIndexedPackageData) {
      return pkg.PackageState.replaceAll("_", " ");
    },
  },
});
</script>
