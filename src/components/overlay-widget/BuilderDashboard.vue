<template>
  <div class="grid grid-cols-3 gap-4 text-center">
    <div class="col-span-3 text-2xl text-gray-400 font-thin">PACKAGES</div>
    <dashboard-card
      title="ACTIVE"
      :count="activePackageCount"
      :loading="activePackageCount === null"
      :url="activePackagesUrl"
    ></dashboard-card>
    <dashboard-card
      title="INACTIVE"
      :count="inactivePackageCount"
      :loading="inactivePackageCount === null"
      :url="inactivePackagesUrl"
    ></dashboard-card>
    <dashboard-card
      title="IN TRANSIT"
      :count="intransitPackageCount"
      :loading="intransitPackageCount === null"
      :url="intransitPackagesUrl"
    ></dashboard-card>
    <div class="col-span-3 text-2xl text-gray-400 font-thin">TRANSFERS</div>
    <dashboard-card
      title="INCOMING"
      :count="incomingTransferCount"
      :loading="incomingTransferCount === null"
      :url="incomingTransfersUrl"
    ></dashboard-card>
    <dashboard-card
      title="OUTGOING"
      :count="outgoingTransferCount"
      :loading="outgoingTransferCount === null"
      :url="outgoingTransfersUrl"
    ></dashboard-card>
    <dashboard-card
      title="REJECTED"
      :count="rejectedTransferCount"
      :loading="rejectedTransferCount === null"
      :url="rejectedTransfersUrl"
    ></dashboard-card>
    <div class="col-span-3 text-2xl text-gray-400 font-thin">PLANT BATCHES</div>
    <dashboard-card
      title="ACTIVE"
      :count="activePlantBatchCount"
      :loading="activePlantBatchCount === null"
      :url="activePlantBatchesUrl"
    ></dashboard-card>
    <dashboard-card
      title="INACTIVE"
      :count="inactivePlantBatchCount"
      :loading="inactivePlantBatchCount === null"
      :url="inactivePlantBatchesUrl"
    ></dashboard-card>
    <div class="col-span-3 text-2xl text-gray-400 font-thin">PLANTS</div>
    <dashboard-card
      title="VEGETATIVE"
      :count="vegetativePlantCount"
      :loading="vegetativePlantCount === null"
      :url="vegetativePlantsUrl"
    ></dashboard-card>
    <dashboard-card
      title="FLOWERING"
      :count="floweringPlantCount"
      :loading="floweringPlantCount === null"
      :url="floweringPlantsUrl"
    ></dashboard-card>
    <dashboard-card
      title="INACTIVE"
      :count="inactivePlantCount"
      :loading="inactivePlantCount === null"
      :url="inactivePlantsUrl"
    ></dashboard-card>
    <div class="col-span-3 text-2xl text-gray-400 font-thin">HARVESTS</div>
    <dashboard-card
      title="ACTIVE"
      :count="activeHarvestCount"
      :loading="activeHarvestCount === null"
      :url="activeHarvestsUrl"
    ></dashboard-card>
    <dashboard-card
      title="INACTIVE"
      :count="inactiveHarvestCount"
      :loading="inactiveHarvestCount === null"
      :url="inactiveHarvestsUrl"
    ></dashboard-card>

    <div class="col-span-3 text-2xl text-gray-400 font-thin">TAGS</div>
    <dashboard-card
      title="AVAILABLE"
      :count="availableTagCount"
      :loading="availableTagCount === null"
      :url="availableTagsUrl"
    ></dashboard-card>
    <dashboard-card
      title="USED"
      :count="usedTagCount"
      :loading="usedTagCount === null"
      :url="usedTagsUrl"
    ></dashboard-card>
    <dashboard-card
      title="VOIDED"
      :count="voidedTagCount"
      :loading="voidedTagCount === null"
      :url="voidedTagsUrl"
    ></dashboard-card>
    <div class="col-span-3 text-2xl text-gray-400 font-thin">SALES</div>
    <dashboard-card
      title="ACTIVE"
      :count="activeSalesCount"
      :loading="activeSalesCount === null"
      :url="activeSalesUrl"
    ></dashboard-card>
    <dashboard-card
      title="INACTIVE"
      :count="inactiveSalesCount"
      :loading="inactiveSalesCount === null"
      :url="inactiveSalesUrl"
    ></dashboard-card>
  </div>
</template>

<script lang="ts">
import { TabKey } from "@/consts";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
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
    activePlantBatchesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PLANTS_PLANTBATCHES_ACTIVE);
    },
    inactivePlantBatchesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PLANTS_PLANTBATCHES_INACTIVE);
    },
    vegetativePlantsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PlANTS_PLANTS_VEGETATIVE);
    },
    floweringPlantsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PlANTS_PLANTS_FLOWERING);
    },
    inactivePlantsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PlANTS_PLANTS_INACTIVE);
    },
    activeHarvestsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PlANTS_HARVESTED_ACTIVE);
    },
    inactiveHarvestsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("plants", TabKey.PlANTS_HARVESTED_INACTIVE);
    },
    activePackagesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("packages", TabKey.PACKAGES_ACTIVE);
    },
    inactivePackagesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("packages", TabKey.PACKAGES_INACTIVE);
    },
    intransitPackagesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("packages", TabKey.PACKAGES_INTRANSIT);
    },
    incomingTransfersUrl() {
      // @ts-ignore
      return this.tabKeyUrl("transfers/licensed", TabKey.TRANSFERS_INCOMING);
    },
    outgoingTransfersUrl() {
      // @ts-ignore
      return this.tabKeyUrl("transfers/licensed", TabKey.TRANSFERS_OUTGOING);
    },
    rejectedTransfersUrl() {
      // @ts-ignore
      return this.tabKeyUrl("transfers/licensed", TabKey.TRANSFERS_REJECTED);
    },
    availableTagsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("admin/tags", TabKey.TAGS_AVAILABLE);
    },
    usedTagsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("admin/tags", TabKey.TAGS_USED);
    },
    voidedTagsUrl() {
      // @ts-ignore
      return this.tabKeyUrl("admin/tags", TabKey.TAGS_VOIDED);
    },
    activeSalesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("sales/receipts", TabKey.SALES_ACTIVE);
    },
    inactiveSalesUrl() {
      // @ts-ignore
      return this.tabKeyUrl("sales/receipts", TabKey.SALES_INACTIVE);
    },
  },
  data() {
    return { TabKey, ...initialState };
  },
  methods: {
    reset() {
      Object.assign(this.$data, initialState);
    },
    tabKeyUrl(path: string, tabKey: TabKey) {
      const hash = JSON.stringify({
        tabKey,
      });

      const license = this.$store.state.pluginAuth.authState?.license;

      return `/industry/${license}/${path}?nonce=${Date.now()}#${hash}`;
    },
  },
  async created() {},
  async mounted() {
    await authManager.authStateOrError();

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
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
