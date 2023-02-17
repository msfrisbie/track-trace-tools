<template>
  <div class="flex flex-col items-stretch w-full">
    <template v-if="validClient()">
      <template v-if="!sourcePackage">
        <single-package-picker
          class="mb-4"
          :selectedPackages="sourcePackage ? [sourcePackage] : []"
          v-on:removePackage="setPackage({ pkg: null })"
          v-on:addPackage="setPackage({ pkg: $event })"
          :selectAllPackageTypes="true"
        ></single-package-picker>
      </template>

      <template v-else>
        <b-card no-body class="mb-24">
          <b-tabs card pills align="center" content-class="" nav-wrapper-class="">
            <b-tab no-body title="Parent Packages" active>
              <b-tabs
                pills
                align="center"
                vertical
                content-class="p-2"
                nav-wrapper-class="bg-purple-100 py-2"
                class="m-0"
              >
                <b-tab no-body title="Tree" active>
                  <template v-if="ancestorTree">
                    <b-dropdown
                      class="pb-2"
                      toggle-class="flex flex-row items-center gap-2"
                      variant="outline-primary"
                    >
                      <template #button-content>
                        <font-awesome-icon icon="sliders-h"></font-awesome-icon>
                      </template>
                      <b-dropdown-text>
                        <b-form-group label="Visible generations" class="w-36">
                          <vue-slider
                            v-model="maxParentVisibleDepth"
                            :min="0"
                            :max="20"
                            :interval="1"
                          ></vue-slider>
                        </b-form-group>
                      </b-dropdown-text>
                      <b-dropdown-text>
                        <b-form-group label="Tree zoom" class="w-36">
                          <vue-slider
                            v-model="parentZoom"
                            :min="0.1"
                            :max="1"
                            :interval="0.05"
                          ></vue-slider> </b-form-group
                      ></b-dropdown-text>
                      <b-form-group class="px-6">
                        <b-checkbox v-model="showUnownedPackages">Show unowned packages</b-checkbox>
                      </b-form-group>
                    </b-dropdown>
                    <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                      <package-history-tile
                        :ancestorTree="ancestorTree"
                        :depth="0"
                        :maxDepth="maxParentVisibleDepth"
                        :isOrigin="true"
                        style="transform-origin: 0% 0% 0px"
                        v-bind:style="{
                          transform: `scale(${parentZoom})`,
                        }"
                      ></package-history-tile>

                      <div class="w-full flex flex-col items-center">
                        <package-history-tile
                          :childTree="childTree"
                          :renderRootNode="false"
                          :depth="0"
                          :maxDepth="maxChildVisibleDepth"
                          :isOrigin="true"
                          style="transform-origin: 0% 0% 0px"
                          v-bind:style="{
                            transform: `scale(${childZoom})`,
                          }"
                        ></package-history-tile>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <template v-if="status == PackageHistoryStatus.INFLIGHT">
                      <div class="text-center">History generation in progress...</div>
                    </template>
                    <template v-else>
                      <div class="text-center">Generate package history to see results here</div>
                    </template>
                  </template>
                </b-tab>
                <b-tab no-body title="Generations">
                  <template v-if="ancestorGenerations && ancestorGenerations.length">
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
                        <div class="w-48 text-right text-xl whitespace-nowrap">
                          {{ i === 0 ? "Source Package" : `Generation #${i}` }}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <package-history-tile
                            v-for="node of generation"
                            v-bind:key="node.label"
                            :ancestorTree="node"
                            :depth="0"
                            :maxDepth="0"
                            :isOrigin="node.label === sourcePackage.Label"
                            v-bind:class="{ 'col-span-2': node.label === sourcePackage.Label }"
                          ></package-history-tile>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <template v-if="status == PackageHistoryStatus.INFLIGHT">
                      <div class="text-center">History generation in progress...</div>
                    </template>
                    <template v-else>
                      <div class="text-center">Generate package history to see results here</div>
                    </template>
                  </template>
                </b-tab>
                <b-tab no-body title="List">
                  <template v-if="ancestorList && ancestorList.length">
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
                          'pkg.ItemName',
                          'pkg.Quantity',
                          'pkg.UnitOfMeasureAbbreviation',
                        ]"
                      ></b-table>
                    </div>
                  </template>
                  <template v-else>
                    <template v-if="status == PackageHistoryStatus.INFLIGHT">
                      <div class="text-center">History generation in progress...</div>
                    </template>
                    <template v-else>
                      <div class="text-center">Generate package history to see results here</div>
                    </template>
                  </template>
                </b-tab>
              </b-tabs>
            </b-tab>
            <b-tab no-body title="Child Packages">
              <b-tabs
                pills
                vertical
                align="center"
                content-class="p-2"
                nav-wrapper-class="bg-purple-100 py-2"
                class="m-0"
              >
                <b-tab no-body title="Tree">
                  <template v-if="childTree">
                    <b-dropdown
                      class="pb-2"
                      toggle-class="flex flex-row items-center gap-2"
                      variant="outline-primary"
                    >
                      <template #button-content>
                        <font-awesome-icon icon="sliders-h"></font-awesome-icon>
                      </template>
                      <b-dropdown-text>
                        <b-form-group label="Visible generations" class="w-36">
                          <vue-slider
                            v-model="maxChildVisibleDepth"
                            :min="0"
                            :max="20"
                            :interval="1"
                          ></vue-slider>
                        </b-form-group>
                      </b-dropdown-text>
                      <b-dropdown-text>
                        <b-form-group label="Tree zoom" class="w-36">
                          <vue-slider
                            v-model="childZoom"
                            :min="0.1"
                            :max="1"
                            :interval="0.05"
                          ></vue-slider> </b-form-group
                      ></b-dropdown-text>
                      <b-form-group class="px-6">
                        <b-checkbox v-model="showUnownedPackages">Show unowned packages</b-checkbox>
                      </b-form-group>
                    </b-dropdown>

                    <div class="flex flex-col items-start overflow-auto toolkit-scroll pb-4">
                      <package-history-tile
                        :childTree="childTree"
                        :depth="0"
                        :maxDepth="maxChildVisibleDepth"
                        :isOrigin="true"
                        style="transform-origin: 0% 0% 0px"
                        v-bind:style="{
                          transform: `scale(${childZoom})`,
                        }"
                      ></package-history-tile>
                    </div>
                  </template>
                  <template v-else>
                    <template v-if="status == PackageHistoryStatus.INFLIGHT">
                      <div class="text-center">History generation in progress...</div>
                    </template>
                    <template v-else>
                      <div class="text-center">Generate package history to see results here</div>
                    </template>
                  </template>
                </b-tab>
                <b-tab no-body title="Generations">
                  <template v-if="childGenerations && childGenerations.length">
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
                        <div class="w-48 text-right text-xl whitespace-nowrap">
                          {{ i === 0 ? "Source Package" : `Generation #${i}` }}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <package-history-tile
                            v-for="node of generation"
                            v-bind:key="node.label"
                            :childTree="node"
                            :depth="0"
                            :maxDepth="0"
                            :isOrigin="node.label === sourcePackage.Label"
                            v-bind:class="{ 'col-span-2': node.label === sourcePackage.Label }"
                          ></package-history-tile>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <template v-if="status == PackageHistoryStatus.INFLIGHT">
                      <div class="text-center">History generation in progress...</div>
                    </template>
                    <template v-else>
                      <div class="text-center">Generate package history to see results here</div>
                    </template>
                  </template>
                </b-tab>
                <b-tab no-body title="List">
                  <template v-if="childList && childList.length">
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
                          'pkg.ItemName',
                          'pkg.Quantity',
                          'pkg.UnitOfMeasureAbbreviation',
                        ]"
                      ></b-table>
                    </div>
                  </template>
                  <template v-else>
                    <template v-if="status == PackageHistoryStatus.INFLIGHT">
                      <div class="text-center">History generation in progress...</div>
                    </template>
                    <template v-else>
                      <div class="text-center">Generate package history to see results here</div>
                    </template>
                  </template>
                </b-tab>
              </b-tabs>
            </b-tab>
            <b-tab no-body title="Source Harvests">
              <template v-if="sourceHarvests && sourceHarvests.length">
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
              </template>
              <template v-else>
                <div class="text-center">No source harvests available</div>
              </template>
            </b-tab>
            <b-tab no-body :title="`Log (${log.length})`">
              <template v-if="log && log.length"
                ><div class="flex flex-col items-stretch gap-2">
                  <b-table
                    striped
                    hover
                    :items="log.map((log) => ({ log }))"
                    :fields="['log']"
                  ></b-table></div
              ></template>
              <template v-else>
                <div class="text-center">No log entries</div>
              </template>
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

        <div class="sticky bg-white py-2" style="bottom: -1.5rem">
          <div class="flex flex-col gap-4 items-center">
            <div class="flex flex-col items-center">
              <div v-if="maxParentLookupDepth !== null" class="text-red-500 text-center">
                You have set a parent generation limit of {{ maxParentLookupDepth }}.
              </div>

              <div v-if="maxChildLookupDepth !== null" class="text-red-500 text-center">
                You have set a child generation limit of {{ maxChildLookupDepth }}.
              </div>

              <div v-if="maxParentVisibleDepth < 20" class="text-red-500 text-center">
                Only showing {{ maxParentVisibleDepth }} parent generations.
              </div>

              <div v-if="maxChildVisibleDepth < 20" class="text-red-500 text-center">
                Only showing {{ maxChildVisibleDepth }} child generations.
              </div>
            </div>

            <template v-if="sourcePackage">
              <div v-if="status === PackageHistoryStatus.HALTED" class="text-red-500 text-center">
                You stopped the lookup process. The displayed results may not be complete.
              </div>

              <template v-if="status == PackageHistoryStatus.INFLIGHT">
                <div class="flex flex-row justify-center items-center gap-2">
                  <b-spinner small></b-spinner>
                  <span>Building history, this can take a minute...</span>
                </div>
              </template>
              <div class="flex flex-row justify-center items-center gap-8 w-60">
                <template v-if="status === PackageHistoryStatus.INFLIGHT">
                  <b-button @click="halt({})" variant="outline-danger"> STOP </b-button>
                  <div class="flex flex-row items-center gap-2">
                    <b-form-input
                      class="w-48"
                      v-model="maxParentLookupDepth"
                      placeholder="Parent generation limit"
                      type="number"
                      step="1"
                      min="0"
                    ></b-form-input>
                    <b-form-input
                      class="w-48"
                      v-model="maxChildLookupDepth"
                      placeholder="Child generation limit"
                      type="number"
                      step="1"
                      min="0"
                    ></b-form-input>

                    <b-badge
                      variant="info"
                      v-b-tooltip.hover
                      title="How many generations to look up? A smaller number will finish faster."
                      >?</b-badge
                    >
                  </div>
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
                  <b-button @click="setPackage({ pkg: null })" variant="outline-danger">
                    RESET
                  </b-button>
                </template>
              </div>
            </template>
          </div>
        </div>
      </template>
    </template>
    <template v-else>
      <div class="flex flex-col items-center gap-4">
        <div class="text-lg text-center max-w-lg">
          This is a premium feature. Enter your client key in Settings to enable this feature.
        </div>
        <div class="text-md text-center max-w-lg">
          Want access to tools like this? Reach out to
          <a class="text-purple-500 underline" href="mailto:tracktracetools@gmail.com"
            >tracktracetools@gmail.com</a
          >
          to discuss premium Track &amp; Trace Tools features.
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
    }),
    ...mapGetters({
      ancestorList: `packageHistory/${PackageHistoryGetters.ANCESTOR_LIST}`,
      ancestorGenerations: `packageHistory/${PackageHistoryGetters.ANCESTOR_GENERATIONS}`,
      childList: `packageHistory/${PackageHistoryGetters.CHILD_LIST}`,
      childGenerations: `packageHistory/${PackageHistoryGetters.CHILD_GENERATIONS}`,
    }),
    maxParentLookupDepth: {
      get(): number | null {
        return this.$store.state.packageHistory.maxParentLookupDepth;
      },
      set(maxParentLookupDepth: any) {
        maxParentLookupDepth = parseInt(maxParentLookupDepth as string, 10);
        this.$store.dispatch(
          `packageHistory/${PackageHistoryActions.SET_MAX_PARENT_LOOKUP_DEPTH}`,
          {
            maxParentLookupDepth:
              typeof maxParentLookupDepth === "number" ? maxParentLookupDepth : null,
          }
        );
      },
    },
    maxChildLookupDepth: {
      get(): number | null {
        return this.$store.state.packageHistory.maxChildLookupDepth;
      },
      set(maxChildLookupDepth: any) {
        maxChildLookupDepth = parseInt(maxChildLookupDepth as string, 10);
        this.$store.dispatch(`packageHistory/${PackageHistoryActions.SET_MAX_CHILD_LOOKUP_DEPTH}`, {
          maxChildLookupDepth: typeof maxChildLookupDepth === "number" ? maxChildLookupDepth : null,
        });
      },
    },
    maxParentVisibleDepth: {
      get(): number {
        return this.$store.state.packageHistory.maxParentVisibleDepth;
      },
      set(maxParentVisibleDepth: number) {
        this.$store.dispatch(
          `packageHistory/${PackageHistoryActions.SET_MAX_PARENT_VISIBLE_DEPTH}`,
          {
            maxParentVisibleDepth,
          }
        );
      },
    },
    maxChildVisibleDepth: {
      get(): number {
        return this.$store.state.packageHistory.maxChildVisibleDepth;
      },
      set(maxChildVisibleDepth: number) {
        this.$store.dispatch(
          `packageHistory/${PackageHistoryActions.SET_MAX_CHILD_VISIBLE_DEPTH}`,
          {
            maxChildVisibleDepth,
          }
        );
      },
    },
    parentZoom: {
      get(): number {
        return this.$store.state.packageHistory.parentZoom;
      },
      set(parentZoom: number) {
        this.$store.dispatch(`packageHistory/${PackageHistoryActions.SET_PARENT_ZOOM}`, {
          parentZoom,
        });
      },
    },
    childZoom: {
      get(): number {
        return this.$store.state.packageHistory.childZoom;
      },
      set(childZoom: number) {
        this.$store.dispatch(`packageHistory/${PackageHistoryActions.SET_CHILD_ZOOM}`, {
          childZoom,
        });
      },
    },
    showUnownedPackages: {
      get(): number {
        return this.$store.state.packageHistory.showUnownedPackages;
      },
      set(showUnownedPackages: boolean) {
        this.$store.dispatch(`packageHistory/${PackageHistoryActions.SET_SHOW_UNOWNED_PACKAGES}`, {
          showUnownedPackages,
        });
      },
    },
  },
  data() {
    return {
      PackageHistoryStatus,
      demoImageUrl: "",
    };
  },
  methods: {
    ...mapActions({
      setPackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setMaxParentVisibleDepth: `packageHistory/${PackageHistoryActions.SET_MAX_PARENT_VISIBLE_DEPTH}`,
      setMaxChildVisibleDepth: `packageHistory/${PackageHistoryActions.SET_MAX_CHILD_VISIBLE_DEPTH}`,
      halt: `packageHistory/${PackageHistoryActions.HALT}`,
    }),
    // maybeSetMaxParentVisibleDepth(e: any) {
    //   const maxParentLookupDepth = parseInt(e as string, 10);
    //   if (typeof maxParentLookupDepth === "number") {
    //     this.setMaxParentVisibleDepth(maxParentLookupDepth);
    //   }
    // },
    // maybeSetMaxChildVisibleDepth(e: any) {
    //   const maxChildLookupDepth = parseInt(e as string, 10);
    //   if (typeof maxChildLookupDepth === "number") {
    //     this.setMaxChildVisibleDepth(maxChildLookupDepth);
    //   }
    // },
    downloadListCsv(historyList: IHistoryTreeNode[], filename: string) {
      const csvFile: ICsvFile = {
        filename,
        data: historyList.map((x) => [
          x.label,
          x.pkg?.LicenseNumber,
          x.pkg?.PackageState,
          x.pkg?.ItemName,
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
              x.pkg?.ItemName,
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
      return true;
      // return clientBuildManager.assertValues(["ENABLE_PACKAGE_HISTORY"]);
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
