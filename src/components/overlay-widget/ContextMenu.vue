<template>
  <div style="min-width: 280px" class="w-full flex flex-col items-stretch space-y-4">
    <b-button-group vertical>
      <template v-if="contextMenuEvent && contextMenuEvent.packageTag">
        <template v-if="pkg">
          <b-dropdown variant="outline-primary" no-caret>
            <template #button-content>
              <div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>FILTER...</span>
                <div></div>
                <div class=""><font-awesome-icon icon="filter" /></div>
              </div>
            </template>

            <b-dropdown-item
              class="text-lg"
              @click.stop.prevent="filterPackages({ label: pkg.Label })"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Tag:</span> <span class="font-bold">{{ pkg.Label }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              @click.stop.prevent="filterPackages({ itemName: pkg.Item.Name })"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Item:</span> <span class="font-bold">{{ pkg.Item.Name }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              v-if="pkg.LocationName"
              @click.stop.prevent="filterPackages({ locationName: pkg.LocationName })"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Location:</span> <span class="font-bold">{{ pkg.LocationName }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              v-if="pkg.Item.StrainName"
              @click.stop.prevent="filterPackages({ itemStrainName: pkg.Item.StrainName })"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Strain:</span> <span class="font-bold">{{ pkg.Item.StrainName }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              @click.stop.prevent="filterPackages({ sourcePackageLabel: pkg.SourcePackageLabels })"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Source tag:</span>
                <span class="font-bold">{{ pkg.SourcePackageLabels.slice(0, 30) }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              @click.stop.prevent="
                filterPackages({ productionBatchNumber: pkg.ProductionBatchNumber })
              "
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>PB #:</span>
                <span class="font-bold">{{ pkg.ProductionBatchNumber.slice(0, 30) }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              @click.stop.prevent="
                filterPackages({ sourceProductionBatchNumbers: pkg.SourceProductionBatchNumbers })
              "
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Source PB #:</span>
                <span class="font-bold">{{ pkg.SourceProductionBatchNumbers.slice(0, 30) }}</span>
              </div></b-dropdown-item
            >
            <b-dropdown-item
              class="text-lg"
              v-if="pkg.SourceHarvestNames"
              @click.stop.prevent="filterPackages({ sourceHarvestName: pkg.SourceHarvestNames })"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Harvest:</span>
                <span class="font-bold">{{ pkg.SourceHarvestNames.slice(0, 30) }}</span>
              </div></b-dropdown-item
            >
          </b-dropdown>

          <template v-if="isIdentityEligibleForTransferToolsImpl">
            <b-button variant="outline-primary" class="" @click.stop.prevent="transferPackage()"
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>TRANSFER PACKAGE</span>
                <div></div>
                <div class=""><font-awesome-icon icon="truck" /></div>
              </div>
            </b-button>
          </template>

          <template v-if="clientValues['ENABLE_T3PLUS'] || t3plus">
            <b-button
              variant="outline-primary"
              class=""
              @click.stop.prevent="
                setPackageHistorySourcePackage({ pkg }) && openPackageHistoryBuilder()
              "
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>PACKAGE HISTORY</span>
                <div></div>
                <div class=""><font-awesome-icon icon="sitemap" /></div>
              </div>
            </b-button>

            <b-button
              variant="outline-primary"
              class=""
              @click.stop.prevent="
                setExplorerData({ packageLabel: getLabelOrError(pkg) }) && openMetrcExplorer()
              "
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>OPEN IN EXPLORER</span>
                <div></div>
                <div class=""><font-awesome-icon icon="sitemap" /></div>
              </div>
            </b-button>
          </template>

          <template v-if="isIdentityEligibleForSplitToolsImpl && isPackageEligibleForSplit">
            <b-button variant="outline-primary" class="" @click.stop.prevent="splitPackage()"
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>SPLIT PACKAGE</span>
                <div></div>
                <div class=""><font-awesome-icon icon="expand-alt" /></div>
              </div>
            </b-button>
          </template>

          <template v-if="labTestUrls.length > 0">
            <b-button variant="outline-primary" class="" @click.stop.prevent="viewLabTests()"
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>VIEW LAB TESTS</span>
                <div></div>
                <div class=""><font-awesome-icon icon="file" /></div>
              </div>
            </b-button>

            <b-button variant="outline-primary" class="" @click.stop.prevent="printLabTests()"
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>PRINT LAB TESTS</span>
                <div></div>
                <div class=""><font-awesome-icon icon="print" /></div>
              </div>
            </b-button>

            <b-button variant="outline-primary" class="" @click.stop.prevent="downloadLabTests()"
              ><div
                class="grid grid-cols-2 place-items-center"
                style="grid-template-columns: auto 1fr auto"
              >
                <span>DOWNLOAD LAB TESTS</span>
                <div></div>
                <div class=""><font-awesome-icon icon="file-download" /></div>
              </div>
            </b-button>
          </template>
        </template>

        <template v-if="!pkg && !packageLoadError">
          <div class="w-full h-10 flex flex-row justify-center items-center">
            <b-spinner class="ttt-purple" small />
          </div>
        </template>
      </template>

      <template v-if="contextMenuEvent && contextMenuEvent.manifestNumber">
        <b-button
          v-if="enableEditTransferButton"
          variant="outline-primary"
          class=""
          @click.stop.prevent="editTransfer()"
          ><div
            class="grid grid-cols-2 place-items-center"
            style="grid-template-columns: auto 1fr auto"
          >
            <span>EDIT TRANSFER</span>
            <div></div>
            <div class=""><font-awesome-icon icon="edit" /></div>
          </div>
        </b-button>

        <b-button variant="outline-primary" class="" @click.stop.prevent="viewManifest()"
          ><div
            class="grid grid-cols-2 place-items-center"
            style="grid-template-columns: auto 1fr auto"
          >
            <span>VIEW MANIFEST</span>
            <div></div>
            <div class=""><font-awesome-icon icon="file" /></div>
          </div>
        </b-button>

        <b-button variant="outline-primary" class="" @click.stop.prevent="newTabManifest()"
          ><div
            class="grid grid-cols-2 place-items-center"
            style="grid-template-columns: auto 1fr auto"
          >
            <span>MANIFEST IN NEW TAB</span>
            <div></div>
            <div class=""><font-awesome-icon icon="external-link-alt" /></div>
          </div>
        </b-button>

        <b-button variant="outline-primary" class="" @click.stop.prevent="printManifest()"
          ><div
            class="grid grid-cols-2 place-items-center"
            style="grid-template-columns: auto 1fr auto"
          >
            <span>PRINT MANIFEST</span>
            <div></div>
            <div class=""><font-awesome-icon icon="print" /></div>
          </div>
        </b-button>

        <b-button variant="outline-primary" class="" @click.stop.prevent="downloadManifest()"
          ><div
            class="grid grid-cols-2 place-items-center"
            style="grid-template-columns: auto 1fr auto"
          >
            <span>DOWNLOAD MANIFEST</span>
            <div></div>
            <div class=""><font-awesome-icon icon="file-download" /></div>
          </div>
        </b-button>

        <b-button variant="outline-primary" class="" @click.stop.prevent="createScanSheet()"
          ><div
            class="grid grid-cols-2 place-items-center"
            style="grid-template-columns: auto 1fr auto"
          >
            <span>CREATE SCAN SHEET</span>
            <div></div>
            <div class=""><font-awesome-icon icon="barcode" /></div>
          </div>
        </b-button>

        <b-dropdown variant="outline-primary" no-caret :disabled="!transfer">
          <template #button-content>
            <div
              class="grid grid-cols-2 place-items-center"
              style="grid-template-columns: auto 1fr auto"
            >
              <span>SEARCH...</span>
              <div></div>
              <div class=""><font-awesome-icon icon="search" /></div>
            </div>
          </template>

          <template v-if="transfer">
            <b-dropdown-item
              class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.ManifestNumber)"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Manifest #:</span>
                <span class="font-bold">{{ transfer.ManifestNumber }}</span>
              </div></b-dropdown-item
            >

            <b-dropdown-item
              v-if="transfer.DeliveryFacilities"
              class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.DeliveryFacilities)"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Delivery Facility:</span>
                <span class="font-bold">{{ transfer.DeliveryFacilities }}</span>
              </div></b-dropdown-item
            >

            <b-dropdown-item
              v-if="transfer.RecipientFacilityLicenseNumber"
              class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.RecipientFacilityLicenseNumber)"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Recipient Facility:</span>
                <span class="font-bold">{{ transfer.RecipientFacilityLicenseNumber }}</span>
              </div></b-dropdown-item
            >

            <b-dropdown-item
              v-if="transfer.ShipperFacilityLicenseNumber"
              class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.ShipperFacilityLicenseNumber)"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Shipper Facility:</span>
                <span class="font-bold">{{ transfer.ShipperFacilityLicenseNumber }}</span>
              </div></b-dropdown-item
            >

            <b-dropdown-item
              v-if="transfer.TransporterFacilityLicenseNumber"
              class="text-lg"
              @click.stop.prevent="searchTransfer(transfer.TransporterFacilityLicenseNumber)"
              ><div class="flex flex-row space-x-2 justify-between flex-nowrap">
                <span>Transporter Facility:</span>
                <span class="font-bold">{{ transfer.TransporterFacilityLicenseNumber }}</span>
              </div></b-dropdown-item
            >
          </template>
        </b-dropdown>
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
import { MessageType, ModalAction, ModalType, PackageState, TransferState } from "@/consts";
import {
  IIndexedPackageData,
  IIndexedTransferData,
  IPackageSearchFilters,
  IPluginState,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { IContextMenuEvent, modalManager } from "@/modules/modal-manager.module";
import { searchManager } from "@/modules/search-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExplorerActions } from "@/store/page-overlay/modules/explorer/consts";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import {
  isIdentityEligibleForSplitTools,
  isIdentityEligibleForTransferTools,
} from "@/utils/access-control";
import { downloadFileFromUrl, printPdfFromUrl } from "@/utils/dom";
import { downloadLabTests, getLabelOrError, getLabTestUrlsFromPackage } from "@/utils/package";
import { createScanSheet } from "@/utils/transfer";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "ContextMenu",
  store,
  router,
  props: {
    contextMenuEvent: Object as () => IContextMenuEvent,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      clientValues: (state: IPluginState) => state.client.values,
      t3plus: (state: IPluginState) => state.client.t3plus,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
    }),
    enableEditTransferButton() {
      if ((this.$data.transfer as IIndexedTransferData)?.TransferState !== TransferState.OUTGOING) {
        return false;
      }

      if (!store.state.client.values["ENABLE_TRANSFER_EDIT"]) {
        return false;
      }

      return true;
    },
    isIdentityEligibleForTransferToolsImpl(): boolean {
      return isIdentityEligibleForTransferTools({
        hostname: window.location.hostname,
      });
    },
    isPackageEligibleForSplit(): boolean {
      return this.$data.pkg?.PackageState === PackageState.ACTIVE;
    },
    isIdentityEligibleForSplitToolsImpl(): boolean {
      return isIdentityEligibleForSplitTools({
        identity: store.state.pluginAuth.authState?.identity || null,
        hostname: window.location.hostname,
      });
    },
    manifestUrl(): string {
      return `${window.location.origin}/reports/transfers/${store.state.pluginAuth?.authState?.license}/manifest?id=${this.contextMenuEvent?.manifestNumber}`;
    },
    manifestNumber(): string | undefined {
      return this.contextMenuEvent?.manifestNumber;
    },
  },
  data() {
    return {
      pkg: null as IIndexedPackageData | null,
      transfer: null as IIndexedTransferData | null,
      transferState: null,
      labTestUrls: [],
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
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setSearchType: `search/${SearchActions.SET_SEARCH_TYPE}`,
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      setPackageHistorySourcePackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setExplorerData: `explorer/${ExplorerActions.SET_EXPLORER_DATA}`,
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      setTransferForUpdate: `transferBuilder/${TransferBuilderActions.SET_TRANSFER_FOR_UPDATE}`,
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
    filterPackages(packageSearchFilters: IPackageSearchFilters) {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, {
        event: "filterPackage",
        packageSearchFilters,
      });

      analyticsManager.track(MessageType.CLICKED_SEARCH_PACKAGE_BUTTON);

      this.dismiss();

      this.partialUpdatePackageSearchFilters({
        packageSearchFilters: packageSearchFilters,
      });

      this.setSearchType({ searchType: "PACKAGES" });
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

      this.$data.labTestUrls = [];
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
          this.$data.labTestUrls = await getLabTestUrlsFromPackage({
            pkg: this.$data.pkg,
            showZeroResultsError: false,
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
    transferPackage() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "transferPackage" });

      this.addPackageToTransferList({ pkg: this.$data.pkg });

      analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_INLINE_BUTTON, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });
      this.dismiss();
    },
    splitPackage() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "splitPackage" });

      this.setSplitSourcePackage({ pkg: this.$data.pkg });

      analyticsManager.track(MessageType.SPLIT_PACKAGE_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/package/split-package",
      });
      this.dismiss();
    },
    viewLabTests() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "viewLabTests" });

      modalManager.dispatchModalEvent(ModalType.DOCUMENT, ModalAction.OPEN, {
        documentUrls: this.$data.labTestUrls,
      });
      analyticsManager.track(MessageType.CLICKED_VIEW_LAB_TEST_BUTTON);
      this.dismiss();
    },
    printLabTests() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "printLabTests" });

      printPdfFromUrl({ urls: this.$data.labTestUrls, modal: true });

      analyticsManager.track(MessageType.CLICKED_PRINT_LAB_TEST_BUTTON);
      this.dismiss();
    },
    downloadLabTests() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "downloadLabTests" });

      downloadLabTests({ pkg: this.$data.pkg });

      analyticsManager.track(MessageType.CLICKED_DOWNLOAD_LAB_TEST_BUTTON);
      this.dismiss();
    },
    async editTransfer() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "editTransfer" });

      await this.setTransferForUpdate({ transferForUpdate: this.$data.transfer });

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
        filename: `Manifest_${this.contextMenuEvent.manifestNumber}.pdf`,
      });

      analyticsManager.track(MessageType.CLICKED_DOWNLOAD_MANIFEST_BUTTON);
      this.dismiss();
    },
    async createScanSheet() {
      analyticsManager.track(MessageType.CONTEXT_MENU_SELECT, { event: "createScanSheet" });

      await createScanSheet(
        parseInt(this.contextMenuEvent.manifestNumber!),
        this.contextMenuEvent.zeroPaddedManifestNumber!
      );

      this.dismiss();
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
  async created() {},
  async mounted() {
    this.refreshOAuthState({});
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
