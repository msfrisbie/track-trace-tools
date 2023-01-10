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
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-4 items-center">
          <div class="flex flex-row items-start gap-8">
            <div class="flex flex-col items-stretch gap-4 w-60">
              <template v-if="status === PackageHistoryStatus.INFLIGHT">
                <b-button @click="halt({})" variant="outline-primary"> STOP </b-button>
                <b-form-group>
                  <b-form-input
                    v-model="maxLookupDepth"
                    @change="maybeSetMaxVisibleDepth($event)"
                    placeholder="Generation limit"
                    type="number"
                    step="1"
                    min="0"
                  ></b-form-input>
                  <div class="text-xs text-gray-300">
                    How many generations to look up? A smaller number will finish faster.
                  </div>
                </b-form-group>
              </template>
              <template v-if="status === PackageHistoryStatus.ERROR">
                <div class="text-red-500">
                  <span
                    >Something went wrong while generating the history. See log for detail.</span
                  >
                </div>
              </template>

              <template
                v-if="
                  status === PackageHistoryStatus.SUCCESS ||
                  status === PackageHistoryStatus.ERROR ||
                  status === PackageHistoryStatus.HALTED
                "
              >
                <b-button @click="setPackage({ pkg: null })" variant="outline-primary">
                  RESET
                </b-button>
              </template>
            </div>
          </div>
        </div>
        <div v-if="maxLookupDepth !== null" class="text-red-500 text-center">
          You have set a generation limit of {{ maxLookupDepth }}. The displayed results may not be
          complete.
        </div>
        <div v-if="status === PackageHistoryStatus.HALTED" class="text-red-500 text-center">
          You stopped the lookup process. The displayed results may not be complete.
        </div>
        <template v-if="status == PackageHistoryStatus.INFLIGHT">
          <div class="flex flex-row justify-center items-center gap-2">
            <b-spinner small></b-spinner>
            <span>Building history, this can take a minute...</span>
          </div>
        </template>
        <b-card no-body>
          <b-tabs card pills align="center" content-class="" nav-wrapper-class="bg-purple-200">
            <b-tab no-body title="Parent Packages" active>
              <b-tabs
                pills
                align="center"
                content-class="p-2"
                nav-wrapper-class="bg-purple-100 py-2"
              >
                <b-tab no-body title="Tree" active>
                  <div class="p-2 flex flex-row justify-center gap-4">
                    <b-form-group label="Visible generations" class="w-36">
                      <vue-slider
                        v-model="maxVisibleDepth"
                        :min="1"
                        :max="20"
                        :interval="1"
                      ></vue-slider>
                    </b-form-group>

                    <b-form-group label="Tree zoom" class="w-36">
                      <vue-slider v-model="zoom" :min="0.1" :max="1" :interval="0.05"></vue-slider>
                    </b-form-group>
                  </div>
                  <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                    <package-history-tile
                      :ancestorTree="ancestorTree"
                      :depth="0"
                      :maxDepth="mergedMaxVisibleDepth"
                      :isOrigin="true"
                      style="transform-origin: 0% 0% 0px"
                      v-bind:style="{
                        transform: `scale(${zoom})`,
                      }"
                    ></package-history-tile>
                  </div>
                </b-tab>
                <b-tab no-body title="Generations">
                  <div class="p-8">
                    <b-button
                      variant="outline-primary"
                      @click="
                        downloadGenerationCsv(
                          ancestorGenerations,
                          `${sourcePackage.Label}_parent_generations.csv`
                        )
                      "
                      >DOWNLOAD CSV</b-button
                    >
                  </div>
                  <div class="flex flex-col gap-8">
                    <div
                      v-for="(generation, i) of ancestorGenerations"
                      v-bind:key="i"
                      class="flex flex-row gap-8"
                    >
                      <div class="w-16 text-center text-xl">{{ i }}</div>
                      <div class="grid grid-cols-3 gap-2">
                        <package-history-tile
                          v-for="node of generation"
                          v-bind:key="node.label"
                          :ancestorTree="node"
                          :depth="0"
                          :maxDepth="0"
                          :isOrigin="node.label === sourcePackage.Label"
                          v-bind:class="{ 'col-span-3': node.label === sourcePackage.Label }"
                        ></package-history-tile>
                      </div>
                    </div>
                  </div>
                </b-tab>
                <b-tab no-body title="List">
                  <div class="p-8">
                    <b-button
                      variant="outline-primary"
                      @click="
                        downloadListCsv(ancestorList, `${sourcePackage.Label}_parent_list.csv`)
                      "
                      >DOWNLOAD CSV</b-button
                    >
                  </div>
                  <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                    <b-table
                      striped
                      hover
                      :items="ancestorList"
                      :fields="[
                        'label',
                        'pkg.LicenseNumber',
                        'pkg.PackageState',
                        'pkg.Item.Name',
                        'pkg.Quantity',
                        'pkg.UnitOfMeasureAbbreviation',
                      ]"
                    ></b-table>
                  </div>
                </b-tab>
              </b-tabs>
            </b-tab>
            <b-tab no-body title="Child Packages">
              <b-tabs
                pills
                align="center"
                content-class="p-2"
                nav-wrapper-class="bg-purple-100 py-2"
              >
                <b-tab no-body title="Tree">
                  <div class="p-2 flex flex-row justify-center gap-4">
                    <b-form-group label="Visible generations" class="w-36">
                      <vue-slider
                        v-model="maxVisibleDepth"
                        :min="1"
                        :max="20"
                        :interval="1"
                      ></vue-slider>
                    </b-form-group>

                    <b-form-group label="Tree zoom" class="w-36">
                      <vue-slider v-model="zoom" :min="0.1" :max="1" :interval="0.05"></vue-slider>
                    </b-form-group>
                  </div>
                  <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                    <package-history-tile
                      :childTree="childTree"
                      :depth="0"
                      :maxDepth="mergedMaxVisibleDepth"
                      :isOrigin="true"
                      style="transform-origin: 0% 0% 0px"
                      v-bind:style="{
                        transform: `scale(${zoom})`,
                      }"
                    ></package-history-tile>
                  </div>
                </b-tab>
                <b-tab no-body title="Generations">
                  <div class="p-8">
                    <b-button
                      variant="outline-primary"
                      @click="
                        downloadGenerationCsv(
                          childGenerations,
                          `${sourcePackage.Label}_children_generations.csv`
                        )
                      "
                      >DOWNLOAD CSV</b-button
                    >
                  </div>
                  <div class="flex flex-col gap-8">
                    <div
                      v-for="(generation, i) of childGenerations"
                      v-bind:key="i"
                      class="flex flex-row gap-8"
                    >
                      <div class="w-16 text-center text-xl">{{ i }}</div>
                      <div class="grid grid-cols-3 gap-2">
                        <package-history-tile
                          v-for="node of generation"
                          v-bind:key="node.label"
                          :childTree="node"
                          :depth="0"
                          :maxDepth="0"
                          :isOrigin="node.label === sourcePackage.Label"
                          v-bind:class="{ 'col-span-3': node.label === sourcePackage.Label }"
                        ></package-history-tile>
                      </div>
                    </div>
                  </div>
                </b-tab>
                <b-tab no-body title="List">
                  <div class="p-8">
                    <b-button
                      variant="outline-primary"
                      @click="
                        downloadListCsv(childList, `${sourcePackage.Label}_children_list.csv`)
                      "
                      >DOWNLOAD CSV</b-button
                    >
                  </div>
                  <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                    <b-table
                      striped
                      hover
                      :items="childList"
                      :fields="[
                        'label',
                        'pkg.LicenseNumber',
                        'pkg.PackageState',
                        'pkg.Item.Name',
                        'pkg.Quantity',
                        'pkg.UnitOfMeasureAbbreviation',
                      ]"
                    ></b-table>
                  </div>
                </b-tab>
              </b-tabs>
            </b-tab>
            <b-tab no-body title="Source Harvests">
              <div class="flex flex-col items-stretch overflow-auto toolkit-scroll pb-4">
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
            <b-tab no-body :title="`Log (${log.length})`"
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
        </b-card>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageHistoryTile from "@/components/overlay-widget/shared/PackageHistoryTile.vue";
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import { ICsvFile, IHistoryTreeNode, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  PackageHistoryActions,
  PackageHistoryGetters,
  PackageHistoryStatus,
} from "@/store/page-overlay/modules/package-history/consts";
import { downloadCsvFile } from "@/utils/csv";
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
    // PickerCard,
    // PickerIcon,
  },
  computed: {
    ...mapState<IPluginState>({
      sourcePackage: (state: IPluginState) => state.packageHistory.sourcePackage,
      ancestorTree: (state: IPluginState) => state.packageHistory.ancestorTree,
      childTree: (state: IPluginState) => state.packageHistory.childTree,
      sourceHarvests: (state: IPluginState) => state.packageHistory.sourceHarvests,
      status: (state: IPluginState) => state.packageHistory.status,
      log: (state: IPluginState) => state.packageHistory.log,
      maxLookupDepth: (state: IPluginState) => state.packageHistory.maxLookupDepth,
    }),
    ...mapGetters({
      ancestorList: `packageHistory/${PackageHistoryGetters.ANCESTOR_LIST}`,
      ancestorGenerations: `packageHistory/${PackageHistoryGetters.ANCESTOR_GENERATIONS}`,
      childList: `packageHistory/${PackageHistoryGetters.CHILD_LIST}`,
      childGenerations: `packageHistory/${PackageHistoryGetters.CHILD_GENERATIONS}`,
    }),
    mergedMaxVisibleDepth(): number {
      return this.$data.maxVisibleDepth;

      // if (!this.maxLookupDepth) {
      //   return this.$data.maxVisibleDepth;
      // } else {
      //   return Math.min(this.maxLookupDepth as number, this.$data.maxVisibleDepth);
      // }
    },
    maxLookupDepth: {
      get(): number | null {
        return this.$store.state.packageHistory.maxLookupDepth;
      },
      set(maxLookupDepth: any) {
        maxLookupDepth = parseInt(maxLookupDepth as string, 10);
        this.$store.dispatch(`packageHistory/${PackageHistoryActions.SET_MAX_LOOKUP_DEPTH}`, {
          maxLookupDepth: typeof maxLookupDepth === "number" ? maxLookupDepth : null,
        });
      },
    },
  },
  data() {
    return {
      maxVisibleDepth: 20,
      zoom: 1,
      PackageHistoryStatus,
    };
  },
  methods: {
    ...mapActions({
      setPackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      halt: `packageHistory/${PackageHistoryActions.HALT}`,
    }),
    maybeSetMaxVisibleDepth(e: any) {
      const maxLookupDepth = parseInt(e as string, 10);
      if (typeof maxLookupDepth === "number") {
        this.$data.maxVisibleDepth = maxLookupDepth;
      }
    },
    downloadListCsv(historyList: IHistoryTreeNode[], filename: string) {
      const csvFile: ICsvFile = {
        filename,
        data: historyList.map((x) => [
          x.label,
          x.pkg?.LicenseNumber,
          x.pkg?.PackageState,
          x.pkg?.Item?.Name,
          x.pkg?.Quantity,
          x.pkg?.UnitOfMeasureAbbreviation,
        ]),
      };

      downloadCsvFile({ csvFile });
    },
    downloadGenerationCsv(historyGenerations: IHistoryTreeNode[][], filename: string) {
      const csvFile: ICsvFile = {
        filename,
        data: historyGenerations
          .map((generation, i) =>
            generation.map((x) => [
              `gen_${i}`,
              x.label,
              x.pkg?.LicenseNumber,
              x.pkg?.PackageState,
              x.pkg?.Item?.Name,
              x.pkg?.Quantity,
              x.pkg?.UnitOfMeasureAbbreviation,
            ])
          )
          .flat(),
      };

      downloadCsvFile({ csvFile });
    },
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
