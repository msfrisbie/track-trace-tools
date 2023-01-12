<template>
  <div class="flex flex-col items-stretch w-full h-full">
    <template v-if="validClient()">
      <div class="flex flex-col gap-4">
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
          <div class="flex flex-col gap-4 items-center">
            <div class="flex flex-row items-start gap-8">
              <div class="flex flex-col items-stretch gap-4 w-60">
                <template v-if="status === PackageHistoryStatus.INFLIGHT">
                  <b-button @click="halt({})" variant="outline-primary"> STOP </b-button>
                </template>
                <template
                  v-if="
                    [PackageHistoryStatus.INFLIGHT, PackageHistoryStatus.INITIAL].includes(status)
                  "
                >
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
                    [
                      PackageHistoryStatus.SUCCESS,
                      PackageHistoryStatus.ERROR,
                      PackageHistoryStatus.HALTED,
                    ].includes(status)
                  "
                >
                  <b-button @click="setPackage({ pkg: null })" variant="outline-primary">
                    RESET
                  </b-button>
                </template>
              </div>
            </div>
          </div>

          <div v-if="typeof maxLookupDepth === 'number'" class="text-red-500 text-center">
            You have set a generation limit of {{ maxLookupDepth }}. The displayed results may not
            be complete.
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
                      v-if="parentTree"
                      :parentLabel="sourcePackage.Label"
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
                          parentGenerations,
                          `${sourcePackage.Label}_parent_generations.csv`
                        )
                      "
                      >DOWNLOAD CSV</b-button
                    >
                  </div>
                  <div class="flex flex-col gap-8">
                    <div
                      v-for="(generation, i) of parentGenerations"
                      v-bind:key="i"
                      class="flex flex-row gap-8"
                    >
                      <div class="w-16 text-center text-xl">{{ i }}</div>
                      <div class="grid grid-cols-3 gap-2">
                        <package-history-tile
                          v-for="node of generation"
                          v-bind:key="node.label"
                          :parentLabel="node.label"
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
                      @click="downloadListCsv(parentList, `${sourcePackage.Label}_parent_list.csv`)"
                      >DOWNLOAD CSV</b-button
                    >
                  </div>
                  <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                    <b-table
                      striped
                      hover
                      :items="parentList"
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
                      v-if="childTree"
                      :childLabel="sourcePackage.Label"
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
                          :childLabel="node.label"
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
            <b-tab no-body :title="`Help`"
              ><div class="flex flex-col items-stretch gap-2 p-4">
                <div class="ttt-purple text-lg mt-2">What is this tool?</div>
                <div>
                  For any source package, this tool will progressively search Metrc across multiple
                  licenses to find all the parent packages and all the child packages.
                </div>
                <div class="ttt-purple text-lg mt-2">Why does the history stop?</div>
                <div>
                  The tool can only search packages accessible by this Metrc login. If this login
                  doesn't have access to a license, packages in that license will not be added.
                </div>
                <div class="ttt-purple text-lg mt-2">Why do some packages only show a tag?</div>
                <div>
                  Metrc package history may include package tags that are not visible to any of your
                  licenses. These tags are shown here for convenience.
                </div>
                <div class="ttt-purple text-lg mt-2">Why is the tool slow for some packages?</div>
                <div>
                  Some package histories require thousands of lookups, these will take longer to
                  complete.
                </div>
                <div class="ttt-purple text-lg mt-2">How can I speed up the results?</div>
                <div>
                  Use the <span class="font-bold">Generation limit</span> field for faster results.
                </div>
                <div>
                  For example, a generation limit of 2 will only search 2 generations for parents
                  and children. In a family tree, this would be equivalent to only searching your
                  parents, grandparents, children, and grandchildren.
                </div>
                <div class="ttt-purple text-lg mt-2">What are the Parent and Child tabs?</div>
                <div>
                  The <span class="font-bold">Parent Packages view</span> shows all the packages
                  that preceded the source package.
                </div>
                <div>
                  The <span class="font-bold">Child Packages view</span> shows all the packages that
                  were produced from the source package.
                </div>
                <div class="ttt-purple text-lg mt-2">
                  What are the three tabs inside Parent and Child?
                </div>
                <div>
                  The <span class="font-bold">Tree view</span> shows the "family tree" for that
                  package. Parent/child packages may appear in multiple places.
                </div>
                <div>
                  The <span class="font-bold">Generation view</span> bundles packages based on how
                  many "generations" they are separated from the source package. Parent/child
                  packages may appear in multiple places.
                </div>
                <div>
                  The <span class="font-bold">List view</span> combines the entire history tree into
                  a single list. Parent/child packages will only appear once.
                </div>
              </div>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
      <!-- </template> -->
    </template>
    <template v-else>
      <div class="flex flex-col items-center gap-4">
        <div class="text-lg text-center max-w-lg">
          This is a private feature. Enter your client key in Settings to enable this feature.
        </div>
        <div class="text-md text-center max-w-lg">
          Want access to tools like this? Reach out to
          <a class="text-purple-500 underline" href="mailto:tracktracetools@gmail.com"
            >tracktracetools@gmail.com</a
          >
          to discuss private Track &amp; Trace Tools features.
        </div>
        <img style="width: 75%; opacity: 75%" :src="demoImageUrl" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageHistoryTile from "@/components/overlay-widget/shared/PackageHistoryTile.vue";
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import { ICsvFile, IHistoryTreeNode, IPluginState } from "@/interfaces";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  PackageHistoryActions,
  PackageHistoryGetters,
  PackageHistoryStatus,
} from "@/store/page-overlay/modules/package-history/consts";
import { getUrl } from "@/utils/assets";
import { downloadCsvFile } from "@/utils/csv";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import { v4 as uuidv4 } from "uuid";
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
      parentTree: (state: IPluginState) => state.packageHistory.parentTree,
      childTree: (state: IPluginState) => state.packageHistory.childTree,
      sourceHarvests: (state: IPluginState) => state.packageHistory.sourceHarvests,
      status: (state: IPluginState) => state.packageHistory.status,
      log: (state: IPluginState) => state.packageHistory.log,
      maxLookupDepth: (state: IPluginState) => state.packageHistory.maxLookupDepth,
    }),
    ...mapGetters({
      parentList: `packageHistory/${PackageHistoryGetters.PARENT_LIST}`,
      parentGenerations: `packageHistory/${PackageHistoryGetters.PARENT_GENERATIONS}`,
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
      demoImageUrl: "",
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
    validClient(): boolean {
      return clientBuildManager.assertValues(["ENABLE_PACKAGE_HISTORY"]);
    },
  },
  async created() {},
  async mounted() {
    this.$data.demoImageUrl = await getUrl(require("@/assets/images/package-history-demo.png"));
  },
  async destroyed() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
td {
  padding: 0.2rem;
}
</style>
