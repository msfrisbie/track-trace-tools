<template>
  <div class="flex flex-col justify-start items-stretch gap-4 text-center">
    <div class="grid grid-cols-2 gap-2" style="grid-template-columns: 120px 1fr">
      <div class="col-span-2 pb-6">
        <facility-picker theme="light" :showButtons="false" :navigateOnSelect="false"
          @facilityHit="selectFacility($event)"></facility-picker>
      </div>
      <template v-if="hasPackagesPermissions !== false">
        <div class="pb-2 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          PACKAGES
        </div>
        <dashboard-card class="col-start-1" title="ACTIVE" :count="activePackageCount"
          :loading="activePackageCount === null" :url="activePackagesUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="activePackages.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="pkg.Id" v-for="[idx, pkg] of activePackages.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic text-nowrap">{{ isotimeToTimeAgoExpression(pkg.LastModified) }}</b-td>
                  <b-td class="font-bold">{{ pkg.Label.slice(-8) }}</b-td>
                  <b-td>{{ pkg.Quantity }} {{ pkg.UnitOfMeasureAbbreviation }}</b-td>
                  <b-td>{{ pkg.Item.Name }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="activePackages.length < activePackageCount">
              <span>{{ activePackageCount - activePackages.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent package activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePackageCount"
          :loading="inactivePackageCount === null" :url="inactivePackagesUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="IN TRANSIT" :count="intransitPackageCount"
          :loading="intransitPackageCount === null" :url="intransitPackagesUrl"></dashboard-card>
      </template>

      <template v-if="hasTransfersPermissions !== false">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          INCOMING TRANSFERS
        </div>
        <dashboard-card class="col-start-1" title="INCOMING" :count="incomingTransferCount"
          :loading="incomingTransferCount === null" :url="incomingTransfersUrl"></dashboard-card>
        <div class="row-span-2 overflow-auto" style="height: 14rem">
          <template v-if="incomingTransfers.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="transfer.Id" v-for="[idx, transfer] of incomingTransfers.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic text-nowrap">{{ isotimeToTimeAgoExpression(transfer.LastModified) }}</b-td>
                  <b-td class="font-bold">{{ transfer.ManifestNumber }}</b-td>
                  <b-td>{{ transfer.ShipperFacilityName }}</b-td>
                  <b-td>{{ transfer.PackageCount }} packages</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>
            <template v-if="incomingTransfers.length < incomingTransferCount">
              <span>{{ incomingTransferCount - incomingTransfers.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent incoming transfer activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="incomingTransferCount"
          :loading="incomingTransferCount === null" :url="incomingTransfersUrl"></dashboard-card>

        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          OUTGOING TRANSFERS
        </div>
        <dashboard-card class="col-start-1" title="OUTGOING" :count="outgoingTransferCount"
          :loading="outgoingTransferCount === null" :url="outgoingTransfersUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="outgoingTransfers.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="transfer.Id" v-for="[idx, transfer] of outgoingTransfers.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic text-nowrap">{{ isotimeToTimeAgoExpression(transfer.LastModified) }}</b-td>
                  <b-td class="font-bold">{{ transfer.ManifestNumber }}</b-td>
                  <b-td>{{ transfer.RecipientFacilityName }}</b-td>
                  <b-td>{{ transfer.PackageCount }} packages</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="outgoingTransfers.length < outgoingTransferCount">
              <span>{{ outgoingTransferCount - outgoingTransfers.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent outgoing transfer activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="REJECTED" :count="rejectedTransferCount"
          :loading="rejectedTransferCount === null" :url="rejectedTransfersUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="outgoingTransferCount"
          :loading="outgoingTransferCount === null" :url="outgoingTransfersUrl"></dashboard-card>
      </template>

      <template v-if="hasPlantBatchesPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          PLANT BATCHES
        </div>
        <dashboard-card class="col-start-1" title="ACTIVE" :count="activePlantBatchCount"
          :loading="activePlantBatchCount === null" :url="activePlantBatchesUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePlantBatchCount"
          :loading="inactivePlantBatchCount === null" :url="inactivePlantBatchesUrl"></dashboard-card>
      </template>

      <template v-if="hasItemsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          ITEMS
        </div>
        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeItemsCount" :loading="activeItemsCount === null"
          :url="activeItemsUrl"></dashboard-card>
      </template>

      <template v-if="hasStrainsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          STRAINS
        </div>
        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeStrainsCount"
          :loading="activeStrainsCount === null" :url="activeStrainsUrl"></dashboard-card>
      </template>

      <template v-if="hasPlantsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          VEGETATIVE
        </div>

        <dashboard-card class="col-start-1" title="VEGETATIVE" :count="vegetativePlantCount"
          :loading="vegetativePlantCount === null" :url="vegetativePlantsUrl"></dashboard-card>

        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          FLOWERING
        </div>
        <dashboard-card class="col-start-1" title="FLOWERING" :count="floweringPlantCount"
          :loading="floweringPlantCount === null" :url="floweringPlantsUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePlantCount"
          :loading="inactivePlantCount === null" :url="inactivePlantsUrl"></dashboard-card>
      </template>

      <template v-if="hasHarvestsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          HARVESTS
        </div>

        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeHarvestCount"
          :loading="activeHarvestCount === null" :url="activeHarvestsUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactiveHarvestCount"
          :loading="inactiveHarvestCount === null" :url="inactiveHarvestsUrl"></dashboard-card>

      </template>

      <template v-if="hasTagsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          TAGS
        </div>

        <dashboard-card class="col-start-1" title="AVAILABLE" :count="availableTagCount"
          :loading="availableTagCount === null" :url="availableTagsUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="USED" :count="usedTagCount" :loading="usedTagCount === null"
          :url="usedTagsUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="VOIDED" :count="voidedTagCount" :loading="voidedTagCount === null"
          :url="voidedTagsUrl"></dashboard-card>
      </template>

      <template v-if="hasSalesPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          SALES
        </div>

        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeSalesCount" :loading="activeSalesCount === null"
          :url="activeSalesUrl"></dashboard-card>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactiveSalesCount"
          :loading="inactiveSalesCount === null" :url="inactiveSalesUrl"></dashboard-card>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import FacilityPicker from "@/components/shared/FacilityPicker.vue";
import { ActiveTabId } from "@/consts";
import { IPageMetrcFacilityData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { isotimeToTimeAgoExpression } from "@/utils/time";
import { navigationUrl } from "@/utils/url";
import Vue from "vue";
import { mapState } from "vuex";
import DashboardCard from "./DashboardCard.vue";

const initialState = {
  // Items
  hasItemsPermissions: null,
  activeItems: [],
  activeItemsCount: null,
  inactiveItemsCount: null,
  // Strains
  hasStrainsPermissions: null,
  activeStrains: [],
  activeStrainsCount: null,
  inactiveStrainsCount: null,
  // Plant Batches
  hasPlantBatchesPermissions: null,
  activePlantBatches: [],
  activePlantBatchCount: null,
  inactivePlantBatchCount: null,
  // Plants
  hasPlantsPermissions: null,
  vegetativePlants: [],
  vegetativePlantCount: null,
  floweringPlants: [],
  floweringPlantCount: null,
  inactivePlantCount: null,
  // Harvests
  hasHarvestsPermissions: null,
  activeHarvests: [],
  activeHarvestCount: null,
  inactiveHarvestCount: null,
  // Packages
  hasPackagesPermissions: null,
  activePackages: [],
  activePackageCount: null,
  inactivePackageCount: null,
  intransitPackageCount: null,
  // Transfers
  hasTransfersPermissions: null,
  incomingTransfers: [],
  incomingTransferCount: null,
  outgoingTransfers: [],
  outgoingTransferCount: null,
  rejectedTransferCount: null,
  // Tags
  hasTagsPermissions: null,
  availableTags: [],
  availableTagCount: null,
  usedTagCount: null,
  voidedTagCount: null,
  // Sales
  hasSalesPermissions: null,
  activeSales: [],
  activeSalesCount: null,
  inactiveSalesCount: null,
};

export default Vue.extend({
  name: "BuilderDashboard",
  store,
  router,
  props: {},
  components: {
    FacilityPicker,
    DashboardCard,
  },
  computed: {
    ...mapState(["authState"]),
    activePlantBatchesUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PLANTS_PLANTBATCHES_ACTIVE);
    },
    inactivePlantBatchesUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PLANTS_PLANTBATCHES_INACTIVE);
    },
    vegetativePlantsUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PlANTS_PLANTS_VEGETATIVE);
    },
    floweringPlantsUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PlANTS_PLANTS_FLOWERING);
    },
    inactivePlantsUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PlANTS_PLANTS_INACTIVE);
    },
    activeHarvestsUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PlANTS_HARVESTED_ACTIVE);
    },
    inactiveHarvestsUrl(): string {
      return this.tabKeyUrl("plants", ActiveTabId.PlANTS_HARVESTED_INACTIVE);
    },
    activePackagesUrl(): string {
      return this.tabKeyUrl("packages", ActiveTabId.PACKAGES_ACTIVE);
    },
    inactivePackagesUrl(): string {
      return this.tabKeyUrl("packages", ActiveTabId.PACKAGES_INACTIVE);
    },
    intransitPackagesUrl(): string {
      return this.tabKeyUrl("packages", ActiveTabId.PACKAGES_INTRANSIT);
    },
    incomingTransfersUrl(): string {
      return this.tabKeyUrl("transfers/licensed", ActiveTabId.TRANSFERS_INCOMING);
    },
    outgoingTransfersUrl(): string {
      return this.tabKeyUrl("transfers/licensed", ActiveTabId.TRANSFERS_OUTGOING);
    },
    rejectedTransfersUrl(): string {
      return this.tabKeyUrl("transfers/licensed", ActiveTabId.TRANSFERS_REJECTED);
    },
    availableTagsUrl(): string {
      return this.tabKeyUrl("admin/tags", ActiveTabId.TAGS_AVAILABLE);
    },
    usedTagsUrl(): string {
      return this.tabKeyUrl("admin/tags", ActiveTabId.TAGS_USED);
    },
    voidedTagsUrl(): string {
      return this.tabKeyUrl("admin/tags", ActiveTabId.TAGS_VOIDED);
    },
    activeSalesUrl(): string {
      return this.tabKeyUrl("sales/receipts", ActiveTabId.SALES_ACTIVE);
    },
    inactiveSalesUrl(): string {
      return this.tabKeyUrl("sales/receipts", ActiveTabId.SALES_INACTIVE);
    },
    activeItemsUrl(): string {
      return this.tabKeyUrl("admin/items");
    },
    activeStrainsUrl(): string {
      return this.tabKeyUrl("admin/strains");
    },
  },
  data() {
    return {
      ActiveTabId,
      activeFacility: null,
      ...initialState,
    };
  },
  methods: {
    isotimeToTimeAgoExpression,
    selectFacility(facility: IPageMetrcFacilityData) {
      this.$data.activeFacility = facility;
    },
    async selectFacilityImpl(facility: IPageMetrcFacilityData) {
      if (!facility) {
        return;
      }

      await authManager.authStateOrError();

      for (const [key, value] of Object.entries(initialState)) {
        this.$data[key] = value;
      }

      const dataLoader = await getDataLoaderByLicense(facility.licenseNumber);

      dataLoader.activePlantBatchCount().then((count: number | null) => {
        this.$data.activePlantBatchCount = count || 0;
      });
      dataLoader.inactivePlantBatchCount().then((count: number | null) => {
        this.$data.inactivePlantBatchCount = count || 0;
      });
      dataLoader.vegetativePlantCount().then((count: number | null) => {
        this.$data.vegetativePlantCount = count || 0;
      });
      dataLoader.floweringPlantCount().then((count: number | null) => {
        this.$data.floweringPlantCount = count || 0;
      });
      dataLoader.inactivePlantCount().then((count: number | null) => {
        this.$data.inactivePlantCount = count || 0;
      });
      dataLoader.activeHarvestCount().then((count: number | null) => {
        this.$data.activeHarvestCount = count || 0;
      });
      dataLoader.inactiveHarvestCount().then((count: number | null) => {
        this.$data.inactiveHarvestCount = count || 0;
      });

      // Packages
      dataLoader.metrcRequestManagerOrError.getActivePackages(dataLoader.recentActivityPayload).then(
        ({ data }) => {
          this.$data.hasPackagesPermissions = true;
          this.$data.activePackageCount = data.Total ?? 0;
          this.$data.activePackages = data.Data;
        },
        (error) => {
          this.$data.hasPackagesPermissions = false;
        }
      );

      dataLoader.inactivePackageCount().then((count: number | null) => {
        this.$data.inactivePackageCount = count || 0;
      });
      dataLoader.intransitPackageCount().then((count: number | null) => {
        this.$data.intransitPackageCount = count || 0;
      });

      // Transfers
      dataLoader.metrcRequestManagerOrError.getIncomingTransfers(dataLoader.recentActivityPayload).then(
        ({ data }) => {
          this.$data.hasTransfersPermissions = true;
          this.$data.incomingTransferCount = data.Total ?? 0;
          this.$data.incomingTransfers = data.Data;
        },
        (error) => {
          this.$data.hasTransfersPermissions = false;
        }
      );

      dataLoader.metrcRequestManagerOrError.getOutgoingTransfers(dataLoader.recentActivityPayload).then(
        ({ data }) => {
          this.$data.hasTransfersPermissions = true;
          this.$data.outgoingTransferCount = data.Total ?? 0;
          this.$data.outgoingTransfers = data.Data;
        },
        (error) => {
          this.$data.hasTransfersPermissions = false;
        }
      );

      dataLoader.rejectedTransferCount().then((count: number | null) => {
        this.$data.rejectedTransferCount = count || 0;
      });

      // Tags
      dataLoader.availableTagCount().then((count: number | null) => {
        this.$data.availableTagCount = count || 0;
      });
      dataLoader.usedTagCount().then((count: number | null) => {
        this.$data.usedTagCount = count || 0;
      });
      dataLoader.voidedTagCount().then((count: number | null) => {
        this.$data.voidedTagCount = count || 0;
      });
      dataLoader.activeSalesCount().then((count: number | null) => {
        this.$data.activeSalesCount = count || 0;
      });
      dataLoader.inactiveSalesCount().then((count: number | null) => {
        this.$data.inactiveSalesCount = count || 0;
      });
    },
    tabKeyUrl(subPath: string, activeTabId?: ActiveTabId): string {
      const license = this.$data.activeFacility?.licenseNumber;

      const hashValues: any = activeTabId ? {
        activeTabId,
      } : {};

      return navigationUrl(`/industry/${license}/${subPath}`, {
        hashValues,
      });
    },
  },
  watch: {
    activeFacility: {
      immediate: true,
      async handler(newValue: IPageMetrcFacilityData | null, oldValue) {
        if (!newValue) {
          return;
        }

        this.selectFacilityImpl(newValue);
      },
    },
  },
  async created() { },
  async mounted() {
    this.$data.activeFacility = await facilityManager.activeFacilityOrError();

    this.selectFacilityImpl(this.$data.activeFacility);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
