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
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(pkg.LastModified)
                  }}</b-td>
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
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="incomingTransfers.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="transfer.Id" v-for="[idx, transfer] of incomingTransfers.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(transfer.LastModified)
                  }}</b-td>
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
        <div class="col-start-1"></div>

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
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(transfer.LastModified)
                  }}</b-td>
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
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="activePlantBatches.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="plantBatch.Id" v-for="[idx, plantBatch] of activePlantBatches.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(plantBatch.LastModified)
                  }}</b-td>
                  <b-td class="font-bold">{{ plantBatch.Name }}</b-td>
                  <b-td>{{ plantBatch.StrainName }}</b-td>
                  <b-td>{{ plantBatch.UntrackedCount }} plants</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="activePlantBatches.length < activePlantBatchCount">
              <span>{{ activePlantBatchCount - activePlantBatches.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent plant batch activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePlantBatchCount"
          :loading="inactivePlantBatchCount === null" :url="inactivePlantBatchesUrl"></dashboard-card>
        <div class="col-start-1"></div>
      </template>

      <template v-if="hasItemsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          ITEMS
        </div>
        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeItemsCount"
          :loading="activeItemsCount === null" :url="activeItemsUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="activeItems.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="item.Id" v-for="[idx, item] of activeItems.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(item.ApprovalStatusDateTime)
                  }}</b-td>
                  <b-td class="font-bold">{{ item.Name }}</b-td>
                  <b-td>{{ item.ProductCategoryName }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="activeItems.length < activeItemsCount">
              <span>{{ activeItemsCount - activeItems.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent item activity.</span>
          </template>
        </div>
        <div class="col-start-1"></div>
        <div class="col-start-1"></div>
      </template>

      <!-- <template v-if="hasStrainsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          STRAINS
        </div>
        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeStrainsCount"
          :loading="activeStrainsCount === null" :url="activeStrainsUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="activeStrains.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="strain.Id" v-for="[idx, strain] of activeStrains.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{ isotimeToTimeAgoExpression(strain.LastModified) }}</b-td>
                  <b-td class="font-bold">{{ strain.Name }}</b-td>
                  <b-td>{{ strain.IndicaPercentage }}% Indica / {{ strain.SativaPercentage }}% Sativa</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="activeStrains.length < activeStrainsCount">
              <span>{{ activeStrainsCount - activeStrains.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent strain activity.</span>
          </template>
        </div>
        <div class="col-start-1"></div>
        <div class="col-start-1"></div>
      </template> -->

      <template v-if="hasPlantsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          VEGETATIVE
        </div>

        <dashboard-card class="col-start-1" title="VEGETATIVE" :count="vegetativePlantCount"
          :loading="vegetativePlantCount === null" :url="vegetativePlantsUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="vegetativePlants.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="vegetativePlant.Id" v-for="[idx, vegetativePlant] of vegetativePlants.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(vegetativePlant.LastModified)
                  }}</b-td>
                  <b-td class="font-bold">{{ vegetativePlant.Label.slice(-8) }}</b-td>
                  <b-td>{{ vegetativePlant.StrainName }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="vegetativePlants.length < vegetativePlantCount">
              <span>{{ vegetativePlantCount - vegetativePlants.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent vegetative plant activity.</span>
          </template>
        </div>
        <div class="col-start-1"></div>
        <div class="col-start-1"></div>

        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          FLOWERING
        </div>
        <dashboard-card class="col-start-1" title="FLOWERING" :count="floweringPlantCount"
          :loading="floweringPlantCount === null" :url="floweringPlantsUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="floweringPlants.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="floweringPlant.Id" v-for="[idx, floweringPlant] of floweringPlants.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(floweringPlant.LastModified)
                  }}</b-td>
                  <b-td class="font-bold">{{ floweringPlant.Label.slice(-8) }}</b-td>
                  <b-td>{{ floweringPlant.StrainName }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="floweringPlants.length < floweringPlantCount">
              <span>{{ floweringPlantCount - floweringPlants.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent flowering plant activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactivePlantCount"
          :loading="inactivePlantCount === null" :url="inactivePlantsUrl"></dashboard-card>
        <div class="col-start-1"></div>
      </template>

      <template v-if="hasHarvestsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          HARVESTS
        </div>

        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeHarvestCount"
          :loading="activeHarvestCount === null" :url="activeHarvestsUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="activeHarvests.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="activeHarvest.Id" v-for="[idx, activeHarvest] of activeHarvests.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(activeHarvest.LastModified)
                  }}</b-td>
                  <b-td class="font-bold">{{ activeHarvest.Name.slice(0, 32) }}</b-td>
                  <b-td>{{ activeHarvest.HarvestDate }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="activeHarvests.length < activeHarvestCount">
              <span>{{ activeHarvestCount - activeHarvests.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent harvest activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactiveHarvestCount"
          :loading="inactiveHarvestCount === null" :url="inactiveHarvestsUrl"></dashboard-card>
        <div class="col-start-1"></div>
      </template>

      <template v-if="hasTagsPermissions">
        <div class="pb-2 pt-6 px-3 col-span-2 text-left text-2xl ttt-purple font-normal"
          style="border-bottom: 1px solid rgb(92, 0, 128)">
          TAGS
        </div>

        <dashboard-card class="col-start-1" title="AVAILABLE" :count="availableTagCount"
          :loading="availableTagCount === null" :url="availableTagsUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="availableTags.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="availableTag.Id" v-for="[idx, availableTag] of availableTags.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(availableTag.LastModified)
                  }}</b-td>
                  <b-td class="font-bold">{{ availableTag.Label.slice(-8) }}</b-td>
                  <b-td>{{ availableTag.TagTypeName }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="availableTags.length < availableTagCount">
              <span>{{ availableTagCount - availableTags.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent available tag activity.</span>
          </template>
        </div>
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

        <dashboard-card class="col-start-1" title="ACTIVE" :count="activeSalesCount"
          :loading="activeSalesCount === null" :url="activeSalesUrl"></dashboard-card>
        <div class="row-span-3 overflow-auto" style="height: 14rem">
          <template v-if="activeSales.length > 0">
            <b-table-simple small>
              <b-tbody>
                <b-tr v-bind:key="activeSale.Id" v-for="[idx, activeSale] of activeSales.entries()"
                  :class="idx % 2 === 0 ? 'bg-purple-50' : ''">
                  <b-td class="italic whitespace-nowrap">{{
                    isotimeToTimeAgoExpression(activeSale.LastModified)
                  }}</b-td>
                  <b-td class="font-bold">{{ activeSale.ReceiptNumber }}</b-td>
                  <b-td>${{ activeSale.TotalPrice }}</b-td>
                  <b-td>{{ activeSale.TotalPackages }} packages</b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>

            <template v-if="activeSales.length < activeSalesCount">
              <span>{{ activeSalesCount - activeSales.length }} not shown</span>
            </template>
          </template>
          <template v-else>
            <span>No recent sales activity.</span>
          </template>
        </div>
        <dashboard-card class="col-start-1" title="INACTIVE" :count="inactiveSalesCount"
          :loading="inactiveSalesCount === null" :url="inactiveSalesUrl"></dashboard-card>
        <div class="col-start-1"></div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import FacilityPicker from "@/components/shared/FacilityPicker.vue";
import { ActiveTabId, MetrcGridId } from "@/consts";
import { IPageMetrcFacilityData, IPlantBatchData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { isotimeToTimeAgoExpression } from "@/utils/time";
import { encodeHashData, navigationUrl } from "@/utils/url";
import Vue from "vue";
import { mapState } from "vuex";
import DashboardCard from "./DashboardCard.vue";

const initialState = {
  // Items
  hasItemsPermissions: null,
  activeItems: [],
  activeItemsCount: null,
  // Strains
  hasStrainsPermissions: null,
  activeStrains: [],
  activeStrainsCount: null,
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
      return this.tabKeyUrl("plants", MetrcGridId.PLANT_BATCHES);
    },
    inactivePlantBatchesUrl(): string {
      return this.tabKeyUrl("plants", MetrcGridId.PLANT_BATCHES_INACTIVE);
    },
    vegetativePlantsUrl(): string {
      return this.tabKeyUrl("plants", MetrcGridId.PLANTS_VEGETATIVE);
    },
    floweringPlantsUrl(): string {
      return this.tabKeyUrl("plants", MetrcGridId.PLANTS_FLOWERING);
    },
    inactivePlantsUrl(): string {
      return this.tabKeyUrl("plants", MetrcGridId.PLANTS_INACTIVE);
    },
    activeHarvestsUrl(): string {
      return this.tabKeyUrl("plants", MetrcGridId.HARVESTS_HARVESTED);
    },
    inactiveHarvestsUrl(): string {
      return this.tabKeyUrl("plants", MetrcGridId.HARVESTS_INACTIVE);
    },
    activePackagesUrl(): string {
      return this.tabKeyUrl("packages", MetrcGridId.PACKAGES_ACTIVE);
    },
    inactivePackagesUrl(): string {
      return this.tabKeyUrl("packages", MetrcGridId.PACKAGES_INACTIVE);
    },
    intransitPackagesUrl(): string {
      return this.tabKeyUrl("packages", MetrcGridId.PACKAGES_IN_TRANSIT);
    },
    transferredPackagesUrl(): string {
      return this.tabKeyUrl("packages", MetrcGridId.PACKAGES_TRANSFERRED);
    },
    incomingTransfersUrl(): string {
      return this.tabKeyUrl("transfers/licensed", MetrcGridId.TRANSFERS_INCOMING);
    },
    outgoingTransfersUrl(): string {
      return this.tabKeyUrl("transfers/licensed", MetrcGridId.TRANSFERS_OUTGOING);
    },
    rejectedTransfersUrl(): string {
      return this.tabKeyUrl("transfers/licensed", MetrcGridId.TRANSFERS_REJECTED);
    },
    availableTagsUrl(): string {
      return this.tabKeyUrl("admin/tags", MetrcGridId.TAGS_AVAILABLE);
    },
    usedTagsUrl(): string {
      return this.tabKeyUrl("admin/tags", MetrcGridId.TAGS_USED);
    },
    voidedTagsUrl(): string {
      return this.tabKeyUrl("admin/tags", MetrcGridId.TAGS_VOIDED);
    },
    activeSalesUrl(): string {
      return this.tabKeyUrl("sales/receipts", MetrcGridId.SALES_ACTIVE);
    },
    inactiveSalesUrl(): string {
      return this.tabKeyUrl("sales/receipts", MetrcGridId.SALES_INACTIVE);
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

      // Plant Batches
      dataLoader.metrcRequestManagerOrError.getPlantBatches(dataLoader.fullPayload).then(
        ({ data }) => {
          const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const filteredPlantBatches = (data.Data as IPlantBatchData[]).filter(
            (x) => x.LastModified > timeWindow
          );

          this.$data.hasPlantBatchesPermissions = true;
          this.$data.activePlantBatchCount = data.Total ?? 0;
          this.$data.activePlantBatches = filteredPlantBatches;
        },
        (error) => {
          this.$data.hasPlantBatchesPermissions = false;
        }
      );
      dataLoader.inactivePlantBatchCount().then((count: number | null) => {
        this.$data.inactivePlantBatchCount = count || 0;
      });

      // Plants
      dataLoader.metrcRequestManagerOrError
        .getVegetativePlants(dataLoader.recentActivityPayload)
        .then(
          ({ data }) => {
            this.$data.hasPlantsPermissions = true;
            this.$data.vegetativePlantCount = data.Total ?? 0;
            this.$data.vegetativePlants = data.Data;
          },
          (error) => {
            // Not everyone has vegetative?
            // this.$data.hasPlantsPermissions = false;
          }
        );
      dataLoader.metrcRequestManagerOrError
        .getFloweringPlants(dataLoader.recentActivityPayload)
        .then(
          ({ data }) => {
            this.$data.hasPlantsPermissions = true;
            this.$data.floweringPlantCount = data.Total ?? 0;
            this.$data.floweringPlants = data.Data;
          },
          (error) => {
            this.$data.hasPlantsPermissions = false;
          }
        );
      dataLoader.inactivePlantCount().then((count: number | null) => {
        this.$data.inactivePlantCount = count || 0;
      });

      // Harvests
      dataLoader.metrcRequestManagerOrError
        .getActiveHarvests(dataLoader.recentActivityPayload)
        .then(
          ({ data }) => {
            this.$data.hasHarvestsPermissions = true;
            this.$data.activeHarvestCount = data.Total ?? 0;
            this.$data.activeHarvests = data.Data;
          },
          (error) => {
            this.$data.hasHarvestsPermissions = false;
          }
        );
      dataLoader.inactiveHarvestCount().then((count: number | null) => {
        this.$data.inactiveHarvestCount = count || 0;
      });

      // Items
      dataLoader.metrcRequestManagerOrError.getItems(dataLoader.recentApprovalPayload).then(
        ({ data }) => {
          this.$data.hasItemsPermissions = true;
          this.$data.activeItemsCount = data.Total ?? 0;
          this.$data.activeItems = data.Data;
        },
        (error) => {
          this.$data.hasItemsPermissions = false;
        }
      );

      // Strains
      dataLoader.metrcRequestManagerOrError.getStrains(dataLoader.recentActivityPayload).then(
        ({ data }) => {
          this.$data.hasStrainsPermissions = true;
          this.$data.activeStrainsCount = data.Total ?? 0;
          this.$data.activeStrains = data.Data;
        },
        (error) => {
          this.$data.hasStrainsPermissions = false;
        }
      );

      // Packages
      dataLoader.metrcRequestManagerOrError
        .getActivePackages(dataLoader.recentActivityPayload)
        .then(
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
      dataLoader.metrcRequestManagerOrError
        .getIncomingTransfers(dataLoader.recentActivityPayload)
        .then(
          ({ data }) => {
            this.$data.hasTransfersPermissions = true;
            this.$data.incomingTransferCount = data.Total ?? 0;
            this.$data.incomingTransfers = data.Data;
          },
          (error) => {
            this.$data.hasTransfersPermissions = false;
          }
        );

      dataLoader.metrcRequestManagerOrError
        .getOutgoingTransfers(dataLoader.recentActivityPayload)
        .then(
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

      dataLoader.metrcRequestManagerOrError.getAvailableTags(dataLoader.recentActivityPayload).then(
        ({ data }) => {
          this.$data.hasTagsPermissions = true;
          this.$data.availableTagCount = data.Total ?? 0;
          this.$data.availableTags = data.Data;
        },
        (error) => {
          this.$data.hasTagsPermissions = false;
        }
      );
      dataLoader.usedTagCount().then((count: number | null) => {
        this.$data.usedTagCount = count || 0;
      });
      dataLoader.voidedTagCount().then((count: number | null) => {
        this.$data.voidedTagCount = count || 0;
      });

      // Sales
      dataLoader.metrcRequestManagerOrError
        .getActiveSalesReceipts(dataLoader.recentActivityPayload)
        .then(
          ({ data }) => {
            this.$data.hasSalesPermissions = true;
            this.$data.activeSalesCount = data.Total ?? 0;
            this.$data.activeSales = data.Data;
          },
          (error) => {
            this.$data.hasSalesPermissions = false;
          }
        );
      dataLoader.inactiveSalesCount().then((count: number | null) => {
        this.$data.inactiveSalesCount = count || 0;
      });
    },
    tabKeyUrl(subPath: string, activeMetrcGridId?: MetrcGridId): string {
      const license = this.$data.activeFacility?.licenseNumber;

      return navigationUrl(`/industry/${license}/${subPath}`, {
        hash: encodeHashData({
          activeMetrcGridId
        }),
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
