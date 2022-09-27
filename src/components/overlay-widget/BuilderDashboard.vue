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

    this.$data.activePlantBatchCount = (await primaryDataLoader.activePlantBatchCount()) || 0;
    this.$data.inactivePlantBatchCount = (await primaryDataLoader.inactivePlantBatchCount()) || 0;
    this.$data.vegetativePlantCount = (await primaryDataLoader.vegetativePlantCount()) || 0;
    this.$data.floweringPlantCount = (await primaryDataLoader.floweringPlantCount()) || 0;
    this.$data.inactivePlantCount = (await primaryDataLoader.inactivePlantCount()) || 0;
    this.$data.activeHarvestCount = (await primaryDataLoader.activeHarvestCount()) || 0;
    this.$data.inactiveHarvestCount = (await primaryDataLoader.inactiveHarvestCount()) || 0;
    this.$data.activePackageCount = (await primaryDataLoader.activePackageCount()) || 0;
    this.$data.inactivePackageCount = (await primaryDataLoader.inactivePackageCount()) || 0;
    this.$data.intransitPackageCount = (await primaryDataLoader.intransitPackageCount()) || 0;
    this.$data.incomingTransferCount = (await primaryDataLoader.incomingTransferCount()) || 0;
    this.$data.outgoingTransferCount = (await primaryDataLoader.outgoingTransferCount()) || 0;
    this.$data.rejectedTransferCount = (await primaryDataLoader.rejectedTransferCount()) || 0;
    this.$data.availableTagCount = (await primaryDataLoader.availableTagCount()) || 0;
    this.$data.usedTagCount = (await primaryDataLoader.usedTagCount()) || 0;
    this.$data.voidedTagCount = (await primaryDataLoader.voidedTagCount()) || 0;
    this.$data.activeSalesCount = (await primaryDataLoader.activeSalesCount()) || 0;
    this.$data.inactiveSalesCount = (await primaryDataLoader.inactiveSalesCount()) || 0;
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
