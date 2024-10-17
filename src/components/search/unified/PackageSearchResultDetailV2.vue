<template>
  <div v-if="searchResultPackageOrNull" class="flex flex-col items-center space-y-8 px-2 p-4">
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-col justify-center gap-1 items-center text-center w-20 text-sm my-2">
            <complex-icon class="text-purple-700" :primaryIconName="searchState.activeSearchResult.primaryIconName"
              primaryIconSize="xl" :secondaryIconName="searchState.activeSearchResult.secondaryIconName"
              secondaryIconSize="sm"></complex-icon>

            <div class="font-bold text-base">
              {{ searchState.activeSearchResult.primaryTextualDescriptor }}
            </div>
          </div>

          <div class="flex flex-row items-center space-x-4 text-center">
            <metrc-tag :label="getLabelOrError(searchResultPackageOrNull)" sideText="PACKAGE"></metrc-tag>
          </div>

          <!-- <b-badge class="text-lg" :variant="badgeVariant(searchResultPackageOrNull)">{{
            displayPackageState(searchResultPackageOrNull)
            }}</b-badge> -->
        </div>
      </div>

      <div v-show="isOnPackagesPage" @click.stop.prevent="setPackageLabelFilter(searchResultPackageOrNull)"
        class="flex flex-row items-center justify-center cursor-pointer h-full">
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <package-button-list :pkg="searchResultPackageOrNull"></package-button-list>
    </div>

    <recursive-json-table :jsonObject="searchResultPackageOrNull"></recursive-json-table>
  </div>
</template>

<script lang="ts">
import ComplexIcon from "@/components/overlay-widget/shared/ComplexIcon.vue";
import MetrcTag from "@/components/overlay-widget/shared/MetrcTag.vue";
import PackageButtonList from "@/components/overlay-widget/shared/PackageButtonList.vue";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import {
  MessageType,
  METRC_HOSTNAMES_LACKING_LAB_PDFS,
  MetrcGridId,
  ModalAction,
  ModalType,
  PackageState,
} from "@/consts";
import { IPluginState, ITransferPackageList, IUnionIndexedPackageData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { PACKAGE_TAB_REGEX } from "@/modules/page-manager/consts";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { clearFilters, setFilter } from "@/modules/page-manager/search-utils";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { copyToClipboard } from "@/utils/dom";
import { getLabelOrError } from "@/utils/package";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackageSearchResultDetailV2",
  store,
  components: { MetrcTag, RecursiveJsonTable, PackageButtonList, ComplexIcon },
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
      searchState: (state: IPluginState) => state.search,
    }),
    searchResultPackageOrNull(): IUnionIndexedPackageData | null {
      return (
        (store.state.search.activeSearchResult?.pkg ||
          store.state.search.activeSearchResult?.transferPkg) ??
        null
      );
    },
    isOnPackagesPage() {
      return window.location.pathname.match(PACKAGE_TAB_REGEX);
    },
    ...mapGetters({}),
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

      this.setShowSearchResults({ showSearchResults: false });

      let metrcGridId: MetrcGridId;
      switch (pkg.PackageState) {
        case PackageState.ACTIVE:
          metrcGridId = MetrcGridId.PACKAGES_ACTIVE;
          break;
        case PackageState.ON_HOLD:
          metrcGridId = MetrcGridId.PACKAGES_ON_HOLD;
          break;
        case PackageState.INACTIVE:
          metrcGridId = MetrcGridId.PACKAGES_INACTIVE;
          break;
        case PackageState.IN_TRANSIT:
          metrcGridId = MetrcGridId.PACKAGES_IN_TRANSIT;
          break;
        case PackageState.TRANSFERRED:
          metrcGridId = MetrcGridId.PACKAGES_TRANSFERRED;
          break;
        default:
          throw new Error(`Unexpected package state: ${pkg.PackageState}`);
      }

      await pageManager.clickTabWithGridIdIfExists(metrcGridId);

      // await pageManager.clickSettleDelay();

      await clearFilters(metrcGridId);

      // await pageManager.clickSettleDelay();

      // await new Promise((resolve) => setTimeout(resolve, 1000));

      const label = getLabelOrError(pkg);

      if (pkg.PackageState === PackageState.TRANSFERRED) {
        setFilter(metrcGridId, "PackageLabel", label);
      } else {
        setFilter(metrcGridId, "Label", label);
      }
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
