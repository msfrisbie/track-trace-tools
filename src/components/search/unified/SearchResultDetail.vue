<template>
  <div>
    <div
      v-if="searchResultTransferOrNull || searchResultPackageOrNull || searchResultPlantOrNull || searchResultTagOrNull"
      class="flex flex-col items-center space-y-8 px-2 p-4">
      <!-- <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr"> -->
      <!-- <div></div> -->

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <!-- Icon and Descriptor for Transfer or Package -->
          <div v-if="searchResultTransferOrNull || searchResultPackageOrNull"
            class="flex flex-col justify-center gap-1 items-center text-center w-20 text-sm my-2">
            <complex-icon
              :class="{ 'text-yellow-700': searchResultTransferOrNull, 'text-purple-700': searchResultPackageOrNull }"
              :primaryIconName="searchState.activeSearchResult.primaryIconName" primaryIconSize="xl"
              :secondaryIconName="searchState.activeSearchResult.secondaryIconName" secondaryIconSize="sm" />
            <div class="font-bold text-base">
              {{ searchState.activeSearchResult.primaryTextualDescriptor }}
            </div>
          </div>

          <!-- Main Content: Manifest, Package, Plant, or Tag -->
          <div class="flex flex-row items-center space-x-4 text-center">
            <div v-if="searchResultTransferOrNull" class="text-2xl text-yellow-800">
              Manifest {{ searchResultTransferOrNull.ManifestNumber }}
            </div>
            <metrc-tag v-if="searchResultPackageOrNull" :label="getLabelOrError(searchResultPackageOrNull)"
              sideText="PACKAGE" />
            <metrc-tag v-if="searchResultPlantOrNull" :label="searchResultPlantOrNull.Label" sideText="PLANT" />
            <metrc-tag v-if="searchResultTagOrNull" :label="searchResultTagOrNull.Label"
              :sideText="searchResultTagOrNull.TagTypeName" />
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <!-- <div v-show="isOnTransfersPage && searchResultTransferOrNull || isOnPackagesPage && searchResultPackageOrNull || isOnPlantsPage && searchResultPlantOrNull || isOnTagsPage && searchResultTagOrNull" @click.stop.prevent="handleFilterClick" class="flex flex-row items-center justify-center cursor-pointer h-full">
          <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
        </div>
      </div> -->

      <!-- Button List -->
      <div v-if="searchResultTransferOrNull || searchResultPackageOrNull" class="grid grid-cols-2 gap-2">
        <transfer-button-list v-if="searchResultTransferOrNull" :transfer="searchResultTransferOrNull" />
        <package-button-list v-if="searchResultPackageOrNull" :pkg="searchResultPackageOrNull" />
      </div>

      <!-- JSON Table -->
      <recursive-json-table
        :jsonObject="searchResultTransferOrNull || searchResultPackageOrNull || searchResultPlantOrNull || searchResultTagOrNull" />
    </div>
  </div>
</template>

<script lang="ts">
import ComplexIcon from "@/components/overlay-widget/shared/ComplexIcon.vue";
import MetrcTag from "@/components/overlay-widget/shared/MetrcTag.vue";
import PackageButtonList from "@/components/overlay-widget/shared/PackageButtonList.vue";
import TransferButtonList from "@/components/overlay-widget/shared/TransferButtonList.vue";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import { MessageType, METRC_HOSTNAMES_LACKING_LAB_PDFS, MetrcGridId, ModalAction, ModalType, PackageState, TransferState } from "@/consts";
import { IIndexedPlantData, IIndexedTagData, IIndexedTransferData, IPluginState, ITransferPackageList, IUnionIndexedPackageData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { PACKAGE_TAB_REGEX, PLANTS_TAB_REGEX, TAG_TAB_REGEX, TRANSFER_TAB_REGEX } from "@/modules/page-manager/consts";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { clearFilters, setFilter } from "@/modules/page-manager/search-utils";
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions } from "@/store/page-overlay/modules/example/consts";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import { copyToClipboard } from "@/utils/dom";
import { getLabelOrError } from "@/utils/package";
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
          if (transfer.ReceivedDateTime) {
            return `Received ${deliveryTimeDescriptor(transfer.ReceivedDateTime)}`;
          }

          if (transfer.EstimatedArrivalDateTime) {
            return `Scheduled for delivery ${deliveryTimeDescriptor(
              transfer.EstimatedArrivalDateTime
            )}`;
          }

          return "Scheduled for delivery";
        case TransferState.OUTGOING:
          if (transfer.CreatedDateTime) {
            return `Created ${deliveryTimeDescriptor(transfer.CreatedDateTime)}`;
          }

          return "Scheduled for delivery";
        case TransferState.REJECTED:
          if (transfer.ReceivedDateTime) {
            return `Return received ${deliveryTimeDescriptor(transfer.ReceivedDateTime)}`;
          }

          if (transfer.EstimatedReturnDepartureDateTime) {
            return `Scheduled for return ${deliveryTimeDescriptor(
              transfer.EstimatedReturnDepartureDateTime
            )}`;
          }

          return "Scheduled for return";
        default:
          return "Scheduled for transfer";
      }
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
    //
    // Transfer
    //
    async setTransferManifestNumberFilter(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      let metrcGridId: MetrcGridId;
      switch (transfer.TransferState) {
        case TransferState.INCOMING:
          metrcGridId = MetrcGridId.TRANSFERS_INCOMING;
          break;
        case TransferState.INCOMING_INACTIVE:
          metrcGridId = MetrcGridId.TRANSFERS_INCOMING_INACTIVE;
          break;
        case TransferState.OUTGOING:
          metrcGridId = MetrcGridId.TRANSFERS_OUTGOING;
          break;
        case TransferState.OUTGOING_INACTIVE:
          metrcGridId = MetrcGridId.TRANSFERS_OUTGOING_INACTIVE;
          break;
        case TransferState.REJECTED:
          metrcGridId = MetrcGridId.TRANSFERS_REJECTED;
          break;
        default:
          throw new Error(`Unexpected transfer state: ${transfer.TransferState}`);
      }

      await pageManager.clickTabWithGridIdIfExists(metrcGridId);

      await pageManager.clickSettleDelay();

      clearFilters(metrcGridId);

      await pageManager.clickSettleDelay();

      setFilter(metrcGridId, 'ManifestNumber', transfer.ManifestNumber);

      store.dispatch(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, { showSearchResults: false });
    },
    displayTransferState(transfer: IIndexedTransferData) {
      return transfer.TransferState.replaceAll("_", " ");
    },
    //
    // Package
    //
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

      await clearFilters(metrcGridId);

      const label = getLabelOrError(pkg);

      if (pkg.PackageState === PackageState.TRANSFERRED) {
        setFilter(metrcGridId, "PackageLabel", label);
      } else {
        setFilter(metrcGridId, "Label", label);
      }
    },
    displayPackageState(pkg: IUnionIndexedPackageData) {
      return pkg.PackageState.replaceAll("_", " ");
    },
    //
    // Plants
    //
    async setPlantLabelFilter(plant: IIndexedPlantData) {
      analyticsManager.track(MessageType.SELECTED_PLANT);

      store.dispatch(`plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`, {
        plantState: plant.PlantState,
        plantSearchFilters: {
          label: plant.Label,
        },
      });

      this.setShowSearchResults({ showSearchResults: false });
    },
    displayPlantState(plant: IIndexedPlantData) {
      return plant.PlantState.replaceAll("_", " ");
    },
    //
    // Tags
    //
    async setTagLabelFilter(tag: IIndexedTagData) {
      analyticsManager.track(MessageType.SELECTED_TAG);

      store.dispatch(`tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`, {
        tagState: tag.TagState,
        tagSearchFilters: {
          label: tag.Label,
        },
      });

      this.setShowSearchResults({ showSearchResults: false });
    },
    displayTagState(tag: IIndexedTagData) {
      return tag.TagState.replaceAll("_", " ");
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
