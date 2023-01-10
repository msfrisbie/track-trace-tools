<template>
  <div class="flex flex-col items-stretch w-full h-full">
    <template v-if="!sourcePackage">
      <single-package-picker
        class=""
        :selectedPackages="sourcePackage ? [sourcePackage] : []"
        v-on:removePackage="setPackage({ pkg: null })"
        v-on:addPackage="setPackage({ pkg: $event })"
        :selectAllPackageTypes="true"
      ></single-package-picker>
    </template>
    <template v-else>
      <div class="flex flex-col">
        <div class="col-span-3 flex flex-col gap-4 items-center mb-4">
          <div class="flex flex-row gap-8">
            <b-card>
              <div
                class="w-full flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap"
              >
                <picker-icon
                  icon="box"
                  style="width: 5rem"
                  class="flex-shrink-0"
                  :textClass="sourcePackage.Quantity === 0 ? 'text-red-500' : ''"
                  :text="`${sourcePackage.Quantity} ${unitOfMeasureNameToAbbreviation(
                    sourcePackage.Item.UnitOfMeasureName
                  )}`"
                />

                <picker-card
                  class="flex-grow"
                  :title="`${sourcePackage.Item.Name}`"
                  :label="sourcePackage.Label"
                />
              </div>
            </b-card>

            <div class="flex flex-col items-stretch gap-4 w-48">
              <div v-if="status === 'INFLIGHT'" class="flex flex-row items-center gap-2">
                <b-spinner small></b-spinner>
                <span>Building history...</span>
              </div>
              <div v-if="status === 'ERROR'" class="text-red-500">
                <span>Something went wrong while generating the history. See log for detail.</span>
              </div>

              <template v-if="status === 'SUCCESS' || status === 'ERROR'">
                <b-button @click="setPackage({ pkg: null })" variant="outline-primary">
                  RESET
                </b-button>
              </template>
            </div>
          </div>
        </div>
        <b-tabs pills align="center" content-class="my-8">
          <b-tab title="Package History Tree" active>
            <div class="p-2 flex flex-row justify-center gap-4">
              <b-form-group label="Visible tree depth" class="w-36">
                <vue-slider v-model="maxDepth" :min="1" :max="20" :interval="1"></vue-slider>
              </b-form-group>

              <b-form-group label="Tree zoom" class="w-36">
                <vue-slider v-model="zoom" :min="0.1" :max="1" :interval="0.05"></vue-slider>
              </b-form-group>
            </div>
            <div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <package-history-tile
                :ancestorTree="ancestorTree"
                :depth="0"
                :maxDepth="maxDepth"
                style="transform-origin: 0% 0% 0px"
                v-bind:style="{
                  transform: `scale(${zoom})`,
                }"
              ></package-history-tile>
            </div>
          </b-tab>
          <b-tab title="Package History List">
            <div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <b-table
                striped
                hover
                :items="ancestorList"
                :fields="[
                  'label',
                  'license',
                  'pkg.PackageState',
                  'pkg.Item.Name',
                  'pkg.Quantity',
                  'pkg.UnitOfMeasureAbbreviation',
                ]"
              ></b-table>
            </div>
          </b-tab>
          <b-tab title="Child Package Tree">
            <div class="p-2 flex flex-row justify-center gap-4">
              <b-form-group label="Visible tree depth" class="w-36">
                <vue-slider v-model="maxDepth" :min="1" :max="20" :interval="1"></vue-slider>
              </b-form-group>

              <b-form-group label="Tree zoom" class="w-36">
                <vue-slider v-model="zoom" :min="0.1" :max="1" :interval="0.05"></vue-slider>
              </b-form-group>
            </div>
            <div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <package-history-tile
                :childTree="childTree"
                :depth="0"
                :maxDepth="maxDepth"
                style="transform-origin: 0% 0% 0px"
                v-bind:style="{
                  transform: `scale(${zoom})`,
                }"
              ></package-history-tile>
            </div>
          </b-tab>
          <b-tab title="Child Package List"
            ><div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <b-table
                striped
                hover
                :items="childList"
                :fields="[
                  'label',
                  'license',
                  'pkg.PackageState',
                  'pkg.Item.Name',
                  'pkg.Quantity',
                  'pkg.UnitOfMeasureAbbreviation',
                ]"
              ></b-table>
            </div>
          </b-tab>
          <b-tab title="Source Harvests">
            <div class="flex flex-col items-stretch overflow-auto toolkit-scroll">
              <b-table
                striped
                hover
                :items="sourceHarvests"
                :fields="[
                  'Name',
                  'HarvestTypeName',
                  'HarvestedByFacilityLicenseNumber',
                  'HarvestStartDate',
                ]"
              ></b-table>
            </div>
          </b-tab>
          <b-tab :title="`Log (${log.length})`"
            ><div class="flex flex-col items-stretch gap-2">
              <b-table
                striped
                hover
                :items="log.map((log) => ({ log }))"
                :fields="['log']"
              ></b-table>
            </div>
          </b-tab>
        </b-tabs>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageHistoryTile from "@/components/overlay-widget/shared/PackageHistoryTile.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  PackageHistoryActions,
  PackageHistoryGetters,
} from "@/store/page-overlay/modules/package-history/consts";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistory",
  store,
  router,
  props: {},
  components: {
    SinglePackagePicker,
    PackageHistoryTile,
    PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState<IPluginState>({
      sourcePackage: (state: IPluginState) => state.packageHistory.sourcePackage,
      ancestorTree: (state: IPluginState) => state.packageHistory.ancestorTree,
      childTree: (state: IPluginState) => state.packageHistory.childTree,
      sourceHarvests: (state: IPluginState) => state.packageHistory.sourceHarvests,
      status: (state: IPluginState) => state.packageHistory.status,
      log: (state: IPluginState) => state.packageHistory.log,
    }),
    ...mapGetters({
      ancestorList: `packageHistory/${PackageHistoryGetters.ANCESTOR_LIST}`,
      childList: `packageHistory/${PackageHistoryGetters.CHILD_LIST}`,
    }),
  },
  data() {
    return {
      maxDepth: 20,
      zoom: 1,
    };
  },
  methods: {
    ...mapActions({
      setPackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
    }),
    unitOfMeasureNameToAbbreviation,
  },
  async created() {},
  async mounted() {},
  async destroyed() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
td {
  padding: 0.2rem;
}
</style>
