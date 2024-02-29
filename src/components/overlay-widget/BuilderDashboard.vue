<template>
  <div class="flex flex-col justify-start items-stretch gap-4 text-center">
    <div class="grid grid-cols-2 gap-2" style="grid-template-columns: 180px 1fr;">
      <div class="col-span-2 flex flex-row justic=fy-between items-center">
        <div>&lt;</div>
        <div>{{ currentLicense }}</div>
        <div>&gt;</div>
      </div>
      <div class="pb-2 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">
        PACKAGES
      </div>
      <dashboard-card class="col-start-1" title="ACTIVE" :count="activePackageCount"
        :loading="activePackageCount === null" :url="activePackagesUrl"></dashboard-card>

      <div class="row-span-3">
        {{ activePackages }}
        <b-table striped hover :items="activePackages"></b-table>
      </div>
      <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePackageCount"
        :loading="inactivePackageCount === null" :url="inactivePackagesUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="IN TRANSIT" :count="intransitPackageCount"
        :loading="intransitPackageCount === null" :url="intransitPackagesUrl"></dashboard-card>
      <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">
        TRANSFERS
      </div>
      <dashboard-card class="col-start-1" title="INCOMING" :count="incomingTransferCount"
        :loading="incomingTransferCount === null" :url="incomingTransfersUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="OUTGOING" :count="outgoingTransferCount"
        :loading="outgoingTransferCount === null" :url="outgoingTransfersUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="REJECTED" :count="rejectedTransferCount"
        :loading="rejectedTransferCount === null" :url="rejectedTransfersUrl"></dashboard-card>
      <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">PLANT
        BATCHES
      </div>
      <dashboard-card class="col-start-1" title="ACTIVE" :count="activePlantBatchCount"
        :loading="activePlantBatchCount === null" :url="activePlantBatchesUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePlantBatchCount"
        :loading="inactivePlantBatchCount === null" :url="inactivePlantBatchesUrl"></dashboard-card>
      <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">PLANTS
      </div>

      <dashboard-card class="col-start-1" title="VEGETATIVE" :count="vegetativePlantCount"
        :loading="vegetativePlantCount === null" :url="vegetativePlantsUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="FLOWERING" :count="floweringPlantCount"
        :loading="floweringPlantCount === null" :url="floweringPlantsUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePlantCount"
        :loading="inactivePlantCount === null" :url="inactivePlantsUrl"></dashboard-card>
      <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">
        HARVESTS
      </div>

      <dashboard-card class="col-start-1" title="ACTIVE" :count="activeHarvestCount"
        :loading="activeHarvestCount === null" :url="activeHarvestsUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="INACTIVE" :count="inactiveHarvestCount"
        :loading="inactiveHarvestCount === null" :url="inactiveHarvestsUrl"></dashboard-card>
      <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">TAGS
      </div>

      <dashboard-card class="col-start-1" title="AVAILABLE" :count="availableTagCount"
        :loading="availableTagCount === null" :url="availableTagsUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="USED" :count="usedTagCount" :loading="usedTagCount === null"
        :url="usedTagsUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="VOIDED" :count="voidedTagCount" :loading="voidedTagCount === null"
        :url="voidedTagsUrl"></dashboard-card>
      <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)">SALES
      </div>

      <dashboard-card class="col-start-1" title="ACTIVE" :count="activeSalesCount" :loading="activeSalesCount === null"
        :url="activeSalesUrl"></dashboard-card>
      <dashboard-card class="col-start-1" title="INACTIVE" :count="inactiveSalesCount"
        :loading="inactiveSalesCount === null" :url="inactiveSalesUrl"></dashboard-card>
    </div>
  </div>
</template>

<script lang="ts">
import { ActiveTabId } from "@/consts";
import { IIndexedPackageData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { navigationUrl } from "@/utils/url";
import Vue from "vue";
import { mapState } from "vuex";
import DashboardCard from "./DashboardCard.vue";

const initialState = {
  activePlantBatchCount: null,
  inactivePlantBatchCount: null,
  vegetativePlantCount: null,
  floweringPlantCount: null,
  inactivePlantCount: null,
  activeHarvestCount: null,
  inactiveHarvestCount: null,
  activePackageCount: null,
  inactivePackageCount: null,
  intransitPackageCount: null,
  incomingTransferCount: null,
  outgoingTransferCount: null,
  rejectedTransferCount: null,
  availableTagCount: null,
  usedTagCount: null,
  voidedTagCount: null,
  activeSalesCount: null,
  inactiveSalesCount: null,
  activePackages: []
};

export default Vue.extend({
  name: "BuilderDashboard",
  store,
  router,
  props: {},
  components: {
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
  },
  data() {
    return {
      ActiveTabId, 
      allFacilities: [],
      activeFacility: null,
      ...initialState,
    };
  },
  methods: {
    tabKeyUrl(subPath: string, activeTabId: ActiveTabId): string {
      const license = store.state.pluginAuth.authState?.license;

      return navigationUrl(`/industry/${license}/${subPath}`, {
        hashValues: {
          activeTabId,
        },
      });
    },
  },
  async created() { },
  async mounted() {
    await authManager.authStateOrError();

    this.$data.allFacilities = facilityManager.cachedFacilities;
    this.$data.activeFacility = facilityManager.cachedActiveFacility;

    primaryDataLoader.activePlantBatchCount().then((count: number | null) => {
      this.$data.activePlantBatchCount = count || 0;
    });
    primaryDataLoader.inactivePlantBatchCount().then((count: number | null) => {
      this.$data.inactivePlantBatchCount = count || 0;
    });
    primaryDataLoader.vegetativePlantCount().then((count: number | null) => {
      this.$data.vegetativePlantCount = count || 0;
    });
    primaryDataLoader.floweringPlantCount().then((count: number | null) => {
      this.$data.floweringPlantCount = count || 0;
    });
    primaryDataLoader.inactivePlantCount().then((count: number | null) => {
      this.$data.inactivePlantCount = count || 0;
    });
    primaryDataLoader.activeHarvestCount().then((count: number | null) => {
      this.$data.activeHarvestCount = count || 0;
    });
    primaryDataLoader.inactiveHarvestCount().then((count: number | null) => {
      this.$data.inactiveHarvestCount = count || 0;
    });
    primaryDataLoader.activePackageCount().then((count: number | null) => {
      this.$data.activePackageCount = count || 0;
    });
    primaryDataLoader.inactivePackageCount().then((count: number | null) => {
      this.$data.inactivePackageCount = count || 0;
    });
    primaryDataLoader.intransitPackageCount().then((count: number | null) => {
      this.$data.intransitPackageCount = count || 0;
    });
    primaryDataLoader.incomingTransferCount().then((count: number | null) => {
      this.$data.incomingTransferCount = count || 0;
    });
    primaryDataLoader.outgoingTransferCount().then((count: number | null) => {
      this.$data.outgoingTransferCount = count || 0;
    });
    primaryDataLoader.rejectedTransferCount().then((count: number | null) => {
      this.$data.rejectedTransferCount = count || 0;
    });
    primaryDataLoader.availableTagCount().then((count: number | null) => {
      this.$data.availableTagCount = count || 0;
    });
    primaryDataLoader.usedTagCount().then((count: number | null) => {
      this.$data.usedTagCount = count || 0;
    });
    primaryDataLoader.voidedTagCount().then((count: number | null) => {
      this.$data.voidedTagCount = count || 0;
    });
    primaryDataLoader.activeSalesCount().then((count: number | null) => {
      this.$data.activeSalesCount = count || 0;
    });
    primaryDataLoader.inactiveSalesCount().then((count: number | null) => {
      this.$data.inactiveSalesCount = count || 0;
    });

    // primaryDataLoader.activePackages().then((activePackages: IIndexedPackageData[]) => {
    //   // this.$data.activePackages = activePackages;
    //   console.log(activePackages);
    //   this.$data.activePackages = [
    //     { age: 40, first_name: 'Dickerson', last_name: 'Macdonald' },
    //     { age: 21, first_name: 'Larsen', last_name: 'Shaw' },
    //     { age: 89, first_name: 'Geneva', last_name: 'Wilson' },
    //     { age: 38, first_name: 'Jami', last_name: 'Carney' }
    //   ];
    // }, console.error);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
