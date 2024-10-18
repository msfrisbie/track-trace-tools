<template>
  <div style="min-width: 280px" class="w-full flex flex-col items-stretch space-y-4">
    <b-button-group vertical>
      <template v-if="contextMenuEvent && contextMenuEvent.packageTag">
        <template v-if="pkg">
          <b-dropdown variant="outline-primary" size="sm" no-caret>
            <template #button-content>
              <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
                <div class="aspect-square grid place-items-center">
                  <font-awesome-icon icon="filter" />
                </div>
                <span>FILTER...</span>

                <div></div>
              </div>
            </template>

            <b-dropdown-item class="text-lg" @click.stop.prevent="filterPackages(pkg.Label)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Tag:</span> <span class="font-bold">{{ pkg.Label }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" @click.stop.prevent="filterPackages(pkg.Item.Name)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Item:</span> <span class="font-bold">{{ pkg.Item.Name }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" v-if="pkg.LocationName"
              @click.stop.prevent="filterPackages(pkg.LocationName)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Location:</span> <span class="font-bold">{{ pkg.LocationName }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" v-if="pkg.Item.StrainName"
              @click.stop.prevent="filterPackages(pkg.Item.StrainName)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Strain:</span> <span class="font-bold">{{ pkg.Item.StrainName }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" @click.stop.prevent="filterPackages(pkg.SourcePackageLabels)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Source tag:</span>
                <span class="font-bold">{{ pkg.SourcePackageLabels.slice(0, 30) }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" @click.stop.prevent="
              filterPackages(pkg.ProductionBatchNumber)
              ">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>PB #:</span>
                <span class="font-bold">{{ pkg.ProductionBatchNumber.slice(0, 30) }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" @click.stop.prevent="
              filterPackages(pkg.SourceProductionBatchNumbers)
              ">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Source PB #:</span>
                <span class="font-bold">{{ pkg.SourceProductionBatchNumbers.slice(0, 30) }}</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item class="text-lg" v-if="pkg.SourceHarvestNames"
              @click.stop.prevent="filterPackages(pkg.SourceHarvestNames)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Harvest:</span>
                <span class="font-bold">{{ pkg.SourceHarvestNames.slice(0, 30) }}</span>
              </div>
            </b-dropdown-item>
          </b-dropdown>

          <package-button-list :pkg="pkg"></package-button-list>
        </template>

        <template v-if="!pkg && !packageLoadError">
          <div class="w-full h-10 flex flex-row justify-center items-center">
            <b-spinner class="ttt-purple" small />
          </div>
        </template>
      </template>

      <template v-if="contextMenuEvent && contextMenuEvent.manifestNumber">
        <b-dropdown variant="outline-primary" no-caret size="sm" :disabled="!transfer">
          <template #button-content>
            <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr auto">
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon icon="filter" />
              </div>
              <span>FILTER...</span>
              <div></div>
            </div>
          </template>

          <template v-if="transfer">
            <b-dropdown-item class="text-lg" @click.stop.prevent="searchTransfer(transfer.ManifestNumber)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Manifest #:</span>
                <span class="font-bold">{{ transfer.ManifestNumber }}</span>
              </div>
            </b-dropdown-item>

            <b-dropdown-item v-if="transfer.DeliveryFacilities" class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.DeliveryFacilities)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Delivery Facility:</span>
                <span class="font-bold">{{ transfer.DeliveryFacilities }}</span>
              </div>
            </b-dropdown-item>

            <b-dropdown-item v-if="transfer.RecipientFacilityLicenseNumber" class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.RecipientFacilityLicenseNumber)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Recipient Facility:</span>
                <span class="font-bold">{{ transfer.RecipientFacilityLicenseNumber }}</span>
              </div>
            </b-dropdown-item>

            <b-dropdown-item v-if="transfer.ShipperFacilityLicenseNumber" class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.ShipperFacilityLicenseNumber)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Shipper Facility:</span>
                <span class="font-bold">{{ transfer.ShipperFacilityLicenseNumber }}</span>
              </div>
            </b-dropdown-item>

            <b-dropdown-item v-if="transfer.TransporterFacilityLicenseNumber" class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.TransporterFacilityLicenseNumber)">
              <div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Transporter Facility:</span>
                <span class="font-bold">{{ transfer.TransporterFacilityLicenseNumber }}</span>
              </div>
            </b-dropdown-item>
          </template>
        </b-dropdown>

        <transfer-button-list :transfer="transfer"></transfer-button-list>
      </template>
    </b-button-group>

    <template v-if="packageLoadError">
      <div class="text-center text-red-800">Unable to load package</div>
    </template>

    <template v-if="transferLoadError">
      <div class="text-center text-red-800">Unable to load transfer</div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageButtonList from "@/components/overlay-widget/shared/PackageButtonList.vue";
import TransferButtonList from "@/components/overlay-widget/shared/TransferButtonList.vue";
import { MessageType } from "@/consts";
import {
  IIndexedPackageData,
  IIndexedTransferData,
  IPluginState
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { IContextMenuEvent, modalManager } from "@/modules/modal-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { generatePackageMetadata, getLabelOrError } from "@/utils/package";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "ContextMenu",
  store,
  router,
  props: {
    contextMenuEvent: Object as () => IContextMenuEvent,
  },
  components: {
    PackageButtonList,
    TransferButtonList,
  },
  computed: {
    ...mapState<IPluginState>({
      clientValues: (state: IPluginState) => state.client.values,
      t3plus: (state: IPluginState) => state.client.t3plus,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
    }),
    manifestNumber(): string | undefined {
      return this.contextMenuEvent?.manifestNumber;
    },
  },
  data() {
    return {
      pkg: null as IIndexedPackageData | null,
      transfer: null as IIndexedTransferData | null,
      transferState: null,
      packageLoadError: false,
      transferLoadError: false,
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
    filterPackages(text: string) {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, {
        event: "filterPackage",
      });
      this.setShowSearchResults({ showSearchResults: true });
      store.dispatch(`search/${SearchActions.SET_QUERY_STRING}`, { queryString: text });
      this.dismiss();
    },
    searchTransfer(text: string) {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "searchTransfer", text });

      this.setShowSearchResults({ showSearchResults: true });
      store.dispatch(`search/${SearchActions.SET_QUERY_STRING}`, { queryString: text });
      this.dismiss();
    },
    reset() {
      this.$data.pkg = null;
      this.$data.transfer = null;
      this.$data.packageLoadError = false;
      this.$data.transferLoadError = false;
    },
    async updatePackage() {
      this.reset();

      if (this.contextMenuEvent?.packageTag) {
        const promises: Promise<any>[] = [
          primaryDataLoader.activePackage(this.contextMenuEvent.packageTag).then((pkg) => {
            this.$data.pkg = pkg;
          }),
          primaryDataLoader.inactivePackage(this.contextMenuEvent.packageTag).then((pkg) => {
            this.$data.pkg = pkg;
          }),
          primaryDataLoader.inTransitPackage(this.contextMenuEvent.packageTag).then((pkg) => {
            this.$data.pkg = pkg;
          }),
        ];

        await Promise.allSettled(promises);

        if (this.$data.pkg) {
          this.$data.packageLabResultData = await generatePackageMetadata({
            pkg: this.$data.pkg,
          });
        } else {
          this.$data.packageLoadError = true;
        }
      }
    },
    async updateTransfer() {
      this.reset();

      if (this.contextMenuEvent?.manifestNumber) {
        this.$data.transfer = null;

        const handler = (transfer: IIndexedTransferData) => {
          if (!this.$data.transfer) {
            this.$data.transfer = transfer;
          }
        };

        await Promise.allSettled([
          primaryDataLoader.incomingTransfer(this.contextMenuEvent.manifestNumber).then(handler),
          primaryDataLoader
            .incomingInactiveTransfer(this.contextMenuEvent.manifestNumber)
            .then(handler),
          primaryDataLoader.outgoingTransfer(this.contextMenuEvent.manifestNumber).then(handler),
          primaryDataLoader
            .outgoingInactiveTransfer(this.contextMenuEvent.manifestNumber)
            .then(handler),
          primaryDataLoader.rejectedTransfer(this.contextMenuEvent.manifestNumber).then(handler),
          primaryDataLoader.layoverTransfer(this.contextMenuEvent.manifestNumber).then(handler),
        ]);

        if (!this.$data.transfer) {
          this.$data.transferLoadError = true;
        }
      }
    },
  },
  watch: {
    contextMenuEvent: {
      immediate: true,
      handler() {
        this.updatePackage();
        this.updateTransfer();
      },
    },
  },
  async created() { },
  async mounted() {
    this.refreshOAuthState({});
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
