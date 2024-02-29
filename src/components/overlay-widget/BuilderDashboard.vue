<template>
  <div class="flex flex-col justify-start items-stretch gap-4 text-center">
    <div class="grid grid-cols-2 gap-2" style="grid-template-columns: 180px 1fr">
      <div class="col-span-2 pb-6">
        <facility-picker
          theme="light"
          :showButtons="false"
          :navigateOnSelect="false"
          @facilityHit="selectFacility($event)"
        ></facility-picker>
      </div>
      <div
        class="pb-2 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        PACKAGES
      </div>
      <dashboard-card
        class="col-start-1"
        title="ACTIVE"
        :count="activePackageCount"
        :loading="activePackageCount === null"
        :url="activePackagesUrl"
      ></dashboard-card>

      <div class="row-span-3">
        {{ activePackages }}
        <b-table striped hover :items="activePackages"></b-table>
      </div>
      <dashboard-card
        class="col-start-1"
        title="INACTIVE"
        :count="inactivePackageCount"
        :loading="inactivePackageCount === null"
        :url="inactivePackagesUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="IN TRANSIT"
        :count="intransitPackageCount"
        :loading="intransitPackageCount === null"
        :url="intransitPackagesUrl"
      ></dashboard-card>
      <div
        class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        TRANSFERS
      </div>
      <dashboard-card
        class="col-start-1"
        title="INCOMING"
        :count="incomingTransferCount"
        :loading="incomingTransferCount === null"
        :url="incomingTransfersUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="OUTGOING"
        :count="outgoingTransferCount"
        :loading="outgoingTransferCount === null"
        :url="outgoingTransfersUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="REJECTED"
        :count="rejectedTransferCount"
        :loading="rejectedTransferCount === null"
        :url="rejectedTransfersUrl"
      ></dashboard-card>
      <div
        class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        PLANT BATCHES
      </div>
      <dashboard-card
        class="col-start-1"
        title="ACTIVE"
        :count="activePlantBatchCount"
        :loading="activePlantBatchCount === null"
        :url="activePlantBatchesUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="INACTIVE"
        :count="inactivePlantBatchCount"
        :loading="inactivePlantBatchCount === null"
        :url="inactivePlantBatchesUrl"
      ></dashboard-card>
      <div
        class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        PLANTS
      </div>

      <dashboard-card
        class="col-start-1"
        title="VEGETATIVE"
        :count="vegetativePlantCount"
        :loading="vegetativePlantCount === null"
        :url="vegetativePlantsUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="FLOWERING"
        :count="floweringPlantCount"
        :loading="floweringPlantCount === null"
        :url="floweringPlantsUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="INACTIVE"
        :count="inactivePlantCount"
        :loading="inactivePlantCount === null"
        :url="inactivePlantsUrl"
      ></dashboard-card>
      <div
        class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        HARVESTS
      </div>

      <dashboard-card
        class="col-start-1"
        title="ACTIVE"
        :count="activeHarvestCount"
        :loading="activeHarvestCount === null"
        :url="activeHarvestsUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="INACTIVE"
        :count="inactiveHarvestCount"
        :loading="inactiveHarvestCount === null"
        :url="inactiveHarvestsUrl"
      ></dashboard-card>
      <div
        class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        TAGS
      </div>

      <dashboard-card
        class="col-start-1"
        title="AVAILABLE"
        :count="availableTagCount"
        :loading="availableTagCount === null"
        :url="availableTagsUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="USED"
        :count="usedTagCount"
        :loading="usedTagCount === null"
        :url="usedTagsUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="VOIDED"
        :count="voidedTagCount"
        :loading="voidedTagCount === null"
        :url="voidedTagsUrl"
      ></dashboard-card>
      <div
        class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
        style="border-bottom: 1px solid rgb(92, 0, 128)"
      >
        SALES
      </div>

      <dashboard-card
        class="col-start-1"
        title="ACTIVE"
        :count="activeSalesCount"
        :loading="activeSalesCount === null"
        :url="activeSalesUrl"
      ></dashboard-card>
      <dashboard-card
        class="col-start-1"
        title="INACTIVE"
        :count="inactiveSalesCount"
        :loading="inactiveSalesCount === null"
        :url="inactiveSalesUrl"
      ></dashboard-card>
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
  activePackages: [],
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
  },
  data() {
    return {
      ActiveTabId,
      activeFacility: null,
      ...initialState,
    };
  },
  methods: {
    selectFacility(facility: IPageMetrcFacilityData) {
      this.$data.activeFacility = facility;
    },
    async selectFacilityImpl(facility: IPageMetrcFacilityData) {
      await authManager.authStateOrError();

      for (const [key, value] of Object.entries(initialState)) {
        this.$data[key] = value;
      }

      const dataLoader = await getDataLoaderByLicense(facility.licenseNumber);

      console.log({ dataLoader });

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
      dataLoader.activePackageCount().then((count: number | null) => {
        this.$data.activePackageCount = count || 0;
      });
      dataLoader.inactivePackageCount().then((count: number | null) => {
        this.$data.inactivePackageCount = count || 0;
      });
      dataLoader.intransitPackageCount().then((count: number | null) => {
        this.$data.intransitPackageCount = count || 0;
      });
      dataLoader.incomingTransferCount().then((count: number | null) => {
        this.$data.incomingTransferCount = count || 0;
      });
      dataLoader.outgoingTransferCount().then((count: number | null) => {
        this.$data.outgoingTransferCount = count || 0;
      });
      dataLoader.rejectedTransferCount().then((count: number | null) => {
        this.$data.rejectedTransferCount = count || 0;
      });
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
    tabKeyUrl(subPath: string, activeTabId: ActiveTabId): string {
      const license = store.state.pluginAuth.authState?.license;

      return navigationUrl(`/industry/${license}/${subPath}`, {
        hashValues: {
          activeTabId,
        },
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
  async created() {},
  async mounted() {
    this.$data.activeFacility = await facilityManager.activeFacilityOrError();

    this.selectFacilityImpl(this.$data.activeFacility);
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
