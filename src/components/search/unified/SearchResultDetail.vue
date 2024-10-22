<template>
  <div v-if="searchState.activeSearchResult">
    <div class="flex flex-col items-stretch w-full max-w-4xl gap-8 p-4">
      <!-- Header -->
      <div class="shadow-xl rounded-xl border border-gray-200 flex flex-col items-stretch overflow-hidden">
        <div :class="`flex flex-col items-center bg-${activeColorClassName}-700`"><span
            class="text-2xl font-bold text-white">
            {{ searchState.activeSearchResult.primaryStatusTextualDescriptor?.toLocaleUpperCase() }} {{
              searchState.activeSearchResult.primaryTextualDescriptor.toLocaleUpperCase() }}
          </span>
        </div>
        <hr />
        <div class="flex flex-col items-center gap-8 p-4">
          <div class="flex flex-col items-center gap-4 flex-grow">
            <div :class="`flex flex-row gap-2 items-center justify-center text-${activeColorClassName}-700`">
              <complex-icon :primaryIconName="searchState.activeSearchResult.primaryIconName" primaryIconSize="xl"
                :secondaryIconName="searchState.activeSearchResult.secondaryIconName" secondaryIconSize="sm" />

              <template v-if="searchState.activeSearchResult.isPrimaryIdentifierMetrcTag">
                <dual-color-tag :colorName="activeColorClassName" class="text-2xl"
                  :label="searchState.activeSearchResult.primaryTextualIdentifier" />
              </template>
              <template v-else>
                <span class="text-2xl">{{ searchState.activeSearchResult.primaryTextualIdentifier }}</span>
              </template>
            </div>

            <span class="text-xl">
              {{ searchState.activeSearchResult.secondaryTextualIdentifier }}
            </span>

            <!-- Metrc Tag -->
            <metrc-tag v-if="searchResultPackageOrNull" :label="getLabelOrError(searchResultPackageOrNull)"
              sideText="PACKAGE" />
            <metrc-tag v-if="searchResultPlantOrNull" :label="searchResultPlantOrNull.Label" sideText="PLANT" />
            <metrc-tag v-if="searchResultPlantBatchOrNull && searchState.activeSearchResult.isPrimaryIdentifierMetrcTag"
              :label="searchResultPlantBatchOrNull.Name" sideText="PLANT BATCH" />
            <metrc-tag v-if="searchResultTagOrNull" :label="searchResultTagOrNull.Label"
              :sideText="searchResultTagOrNull.TagTypeName" />

            <b-button-group>
              <b-button class="flex flex-row items-center gap-1" size="lg" variant="outline-success"
                v-if="enableShowInMetrc" @click="openInPage()">
                <font-awesome-icon icon="search"></font-awesome-icon>
                <span>SHOW IN METRC</span>
              </b-button>
              <b-button class="flex flex-row items-center gap-1" size="lg" variant="outline-primary"
                @click="openInNewTab()">
                <font-awesome-icon icon="external-link-alt"></font-awesome-icon>
                <span>OPEN IN NEW TAB</span>
              </b-button>
              <b-button class="flex flex-row items-center gap-1" size="lg" variant="outline-primary"
                @click="copyLink()">
                <font-awesome-icon icon="link"></font-awesome-icon>
                <span>COPY LINK</span>
              </b-button>
            </b-button-group>

            <!-- Button List -->
            <div v-if="searchResultTransferOrNull || searchResultPackageOrNull" class="grid grid-cols-2 gap-2">
              <transfer-button-list v-if="searchResultTransferOrNull" :transfer="searchResultTransferOrNull" />
              <package-button-list v-if="searchResultPackageOrNull" :pkg="searchResultPackageOrNull" />
            </div>
          </div>
        </div>
      </div>

      <!-- JSON Table -->
      <recursive-json-table
        :jsonObject="searchResultTransferOrNull || searchResultPackageOrNull || searchResultPlantOrNull || searchResultTagOrNull || searchResultHarvestOrNull || searchResultPlantBatchOrNull || searchResultSalesReceiptOrNull || searchResultItemOrNull || searchResultStrainOrNull" />

    </div>
  </div>
</template>

<script lang="ts">
import ComplexIcon from "@/components/overlay-widget/shared/ComplexIcon.vue";
import DualColorTag from "@/components/overlay-widget/shared/DualColorTag.vue";
import MetrcTag from "@/components/overlay-widget/shared/MetrcTag.vue";
import PackageButtonList from "@/components/overlay-widget/shared/PackageButtonList.vue";
import TransferButtonList from "@/components/overlay-widget/shared/TransferButtonList.vue";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import { MessageType, METRC_HOSTNAMES_LACKING_LAB_PDFS } from "@/consts";
import { IIndexedHarvestData, IIndexedItemData, IIndexedPlantBatchData, IIndexedPlantData, IIndexedSalesReceiptData, IIndexedStrainData, IIndexedTagData, IIndexedTransferData, IPluginState, ITransferPackageList, IUnionIndexedPackageData, URLHashData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { ITEMS_TAB_REGEX, PACKAGE_TAB_REGEX, PLANTS_TAB_REGEX, SALES_TAB_REGEX, STRAINS_TAB_REGEX, TAG_TAB_REGEX, TRANSFER_TAB_REGEX } from "@/modules/page-manager/consts";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { clearGridFilters, setFilter } from "@/modules/page-manager/search-utils";
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions } from "@/store/page-overlay/modules/example/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { copyToClipboard } from "@/utils/dom";
import { getLabelOrError } from "@/utils/package";
import { encodeHashData } from "@/utils/url";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

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
  name: "SearchResultDetail",
  store,
  router,
  props: {},
  components: {
    RecursiveJsonTable,
    TransferButtonList,
    ComplexIcon,
    MetrcTag,
    PackageButtonList,
    DualColorTag
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      flags: (state: IPluginState) => state.flags,
      searchState: (state: IPluginState) => state.search,
    }),
    ...mapGetters({
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    }),
    activeColorClassName(): string {
      if (!store.state.search.activeSearchResult!.isActive) {
        return 'gray';
      }

      return store.state.search.activeSearchResult!.colorClassName;
    },
    //
    // Transfers
    //
    searchResultTransferOrNull(): IIndexedTransferData | null {
      return (
        (store.state.search.activeSearchResult?.incomingTransfer ||
          store.state.search.activeSearchResult?.outgoingTransfer) ??
        null
      );
    },
    isOnTransfersPage(): boolean {
      return !!window.location.pathname.match(TRANSFER_TAB_REGEX);
    },
    //
    // Packages
    //
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
    //
    // Plants
    //
    searchResultPlantOrNull(): IIndexedPlantData | null {
      return store.state.search.activeSearchResult?.plant ?? null;
    },
    isOnPlantsPage(): boolean {
      return !!window.location.pathname.match(PLANTS_TAB_REGEX);
    },
    //
    // Tags
    //
    searchResultTagOrNull(): IIndexedTagData | null {
      return store.state.search.activeSearchResult?.tag ?? null;
    },
    isOnTagsPage() {
      return window.location.pathname.match(TAG_TAB_REGEX);
    },
    //
    // Harvest
    //
    searchResultHarvestOrNull(): IIndexedHarvestData | null {
      return store.state.search.activeSearchResult?.harvest ?? null;
    },
    //
    // Plant Batches
    //
    searchResultPlantBatchOrNull(): IIndexedPlantBatchData | null {
      return store.state.search.activeSearchResult?.plantBatch ?? null;
    },
    //
    // Sales Receipt
    //
    searchResultSalesReceiptOrNull(): IIndexedSalesReceiptData | null {
      return store.state.search.activeSearchResult?.salesReceipt ?? null;
    },
    isOnSalesPage() {
      return window.location.pathname.match(SALES_TAB_REGEX);
    },
    //
    // Strain + Item
    //
    searchResultItemOrNull(): IIndexedItemData | null {
      return store.state.search.activeSearchResult?.item ?? null;
    },
    searchResultStrainOrNull(): IIndexedStrainData | null {
      return store.state.search.activeSearchResult?.strain ?? null;
    },
    enableShowInMetrc(): boolean {
      const activeSearchResult = store.state.search.activeSearchResult!;

      if (!activeSearchResult) {
        return false;
      }

      // Plants Page
      if (activeSearchResult.plant && !!window.location.pathname.match(PLANTS_TAB_REGEX)) {
        return true;
      }

      if (activeSearchResult.harvest && !!window.location.pathname.match(PLANTS_TAB_REGEX)) {
        return true;
      }

      if (activeSearchResult.plantBatch && !!window.location.pathname.match(PLANTS_TAB_REGEX)) {
        return true;
      }

      // Packages Page
      if (activeSearchResult.pkg && !!window.location.pathname.match(PACKAGE_TAB_REGEX)) {
        return true;
      }

      if (activeSearchResult.transferPkg && !!window.location.pathname.match(PACKAGE_TAB_REGEX)) {
        return true;
      }

      // Transfers Page
      if (activeSearchResult.incomingTransfer && !!window.location.pathname.match(TRANSFER_TAB_REGEX)) {
        return true;
      }

      if (activeSearchResult.outgoingTransfer && !!window.location.pathname.match(TRANSFER_TAB_REGEX)) {
        return true;
      }

      // Sales Page
      if (activeSearchResult.salesReceipt && !!window.location.pathname.match(SALES_TAB_REGEX)) {
        return true;
      }

      // Tags Page
      if (activeSearchResult.tag && !!window.location.pathname.match(TAG_TAB_REGEX)) {
        return true;
      }

      // Items Page
      if (activeSearchResult.item && !!window.location.pathname.match(ITEMS_TAB_REGEX)) {
        return true;
      }

      // Strains Page
      if (activeSearchResult.strain && !!window.location.pathname.match(STRAINS_TAB_REGEX)) {
        return true;
      }

      return false;
    }
    //
  },
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
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    getLabelOrError,
    //
    // Transfer
    //
    async openInPage() {
      analyticsManager.track(MessageType.SELECTED_SEARCH_RESULT);

      const activeSearchResult = store.state.search.activeSearchResult;

      if (!activeSearchResult) {
        throw new Error('Active search result is not defined');
      }

      await pageManager.clickTabWithGridIdIfExists(activeSearchResult!.uniqueMetrcGridId);

      await pageManager.clickSettleDelay();

      clearGridFilters(activeSearchResult!.uniqueMetrcGridId);

      await pageManager.clickSettleDelay();

      setFilter(activeSearchResult!.uniqueMetrcGridId, activeSearchResult!.primaryField, activeSearchResult!.primaryTextualIdentifier);

      store.dispatch(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, { showSearchResults: false });
    },
    async openInNewTab() {
      window.open(this.getLink(), "_blank");
    },
    async copyLink() {
      const activeSearchResult = store.state.search.activeSearchResult;

      if (!activeSearchResult) {
        throw new Error('Active search result is not defined');
      }

      const link: string = this.getLink();

      analyticsManager.track(MessageType.COPIED_TEXT, { value: link });

      copyToClipboard(link);

      toastManager.openToast(`${activeSearchResult.primaryTextualIdentifier} link copied to clipboard`, {
        title: "Copied Link",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
    getLink(): string {
      const activeSearchResult = store.state.search.activeSearchResult;

      if (!activeSearchResult) {
        throw new Error('Active search result is not defined');
      }

      const hashData: URLHashData = {
        activeUniqueMetrcGridId: activeSearchResult.uniqueMetrcGridId,
        metrcGridFilters: {
          [activeSearchResult.uniqueMetrcGridId]: {
            [activeSearchResult!.primaryField]: activeSearchResult!.primaryTextualIdentifier
          }
        }
      };

      return `${window.location.origin}${activeSearchResult.path}#${encodeHashData(hashData)}`;
    },
  },
  async created() { },
  async mounted() { },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) { },
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
