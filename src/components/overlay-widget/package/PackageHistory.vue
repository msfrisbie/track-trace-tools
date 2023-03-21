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
        <div
          id="tree-nav"
          class="sticky bg-white py-2"
          style="top: -1.5rem; margin-top: -1.5rem; z-index: 1"
        >
          <div class="flex flex-col items-stretch gap-2">
            <div class="flex flex-row justify-between">
              <div class="flex flex-row items-center gap-2">
                <b-button
                  v-for="view of views"
                  v-bind:key="view"
                  :variant="activeView === view ? 'primary' : 'outline-primary'"
                  size="sm"
                  @click="activeView = view"
                  >{{ view }}</b-button
                >
              </div>

              <div>
                <template v-if="status === PackageHistoryStatus.INFLIGHT">
                  <b-button @click="halt({})" variant="outline-danger" size="sm"> STOP </b-button>
                </template>

                <template
                  v-if="
                    status === PackageHistoryStatus.SUCCESS ||
                    status === PackageHistoryStatus.ERROR ||
                    status === PackageHistoryStatus.HALTED
                  "
                >
                  <b-button @click="setPackage({ pkg: null })" variant="outline-danger" size="sm">
                    RESET
                  </b-button>
                </template>
              </div>
            </div>

            <template v-if="status === PackageHistoryStatus.SUCCESS">
              <hr />

              <template v-if="activeView === 'Tree'">
                <div class="flex flex-row items-center gap-2">
                  <b-button variant="outline-dark" @click="autofit()" size="sm">AUTOFIT</b-button>

                  <b-dropdown
                    toggle-class="flex flex-row items-center gap-2"
                    variant="outline-dark"
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
                          :min="0.02"
                          :max="1"
                          :interval="0.02"
                        ></vue-slider> </b-form-group
                    ></b-dropdown-text>
                    <b-form-group class="px-6">
                      <b-checkbox v-model="showUnownedPackages">Show unowned packages</b-checkbox>
                    </b-form-group>
                  </b-dropdown>
                </div>
              </template>

              <template v-if="activeView === 'List'">
                <div class="flex flex-row items-center gap-2">
                  <b-button
                    variant="outline-dark"
                    @click="downloadListCsv(mergedList, `${sourcePackage.Label}_history_list.csv`)"
                    size="sm"
                    >DOWNLOAD CSV</b-button
                  >
                </div>
              </template>
            </template>
          </div>
        </div>

        <div id="horizontal-scroller" class="overflow-x-auto">
          <template v-if="activeView === 'Tree'">
            <template v-if="ancestorTree">
              <!-- <div class="pt-20 -mt-20"> -->
              <div class="flex flex-col items-start">
                <package-history-tile
                  id="history-tree"
                  :ancestorTree="ancestorTree"
                  :childTree="childTree"
                  :depth="0"
                  :isOrigin="true"
                  style="transform-origin: 0% 0% 0px"
                  v-bind:style="{
                    transform: `scale(${parentZoom})`,
                  }"
                ></package-history-tile>
              </div>
              <!-- </div> -->
            </template>
            <template v-else>
              <template v-if="status == PackageHistoryStatus.INFLIGHT">
                <div class="text-center">History generation in progress...</div>
              </template>
              <template v-else>
                <div class="text-center">Generate package history to see results here</div>
              </template>
            </template>
          </template>

          <template v-if="activeView === 'List'">
            <template v-if="mergedList && mergedList.length">
              <div class="flex flex-col items-start pb-4">
                <b-table
                  striped
                  hover
                  :items="mergedList"
                  :fields="[
                    'label',
                    'relationship',
                    'type',
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
          </template>

          <template v-if="activeView === 'Source Harvests'">
            <template v-if="sourceHarvests && sourceHarvests.length">
              <div class="flex flex-col items-stretch pb-4">
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
          </template>

          <template v-if="activeView === 'Log'">
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
          </template>

          <template v-if="activeView === 'Help'">
            <div class="flex flex-col items-stretch gap-2 p-4">
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
                For example, a generation limit of 2 will only search 2 generations for parents and
                children. In a family tree, this would be equivalent to only searching your parents,
                grandparents, children, and grandchildren.
              </div>
              <div class="ttt-purple text-lg mt-2">What are the Parent and Child tabs?</div>
              <div>
                The <span class="font-bold">Tree view</span> shows the tree of all packages that are
                in this package's ancestor and child lineage.
              </div>
              <!-- <div class="ttt-purple text-lg mt-2">
              What are the three tabs inside Parent and Child?
            </div> -->
              <!-- <div>
              The <span class="font-bold">Tree view</span> shows the "family tree" for that package.
              Parent/child packages may appear in multiple places.
            </div> -->
              <!-- <div>
                  The <span class="font-bold">Generation view</span> bundles packages based on how
                  many "generations" they are separated from the source package. Parent/child
                  packages may appear in multiple places.
                </div> -->
              <!-- <div>
              The <span class="font-bold">List view</span> combines the entire history tree into a
              single list. Parent/child packages will only appear once.
            </div> -->
            </div>
          </template>
        </div>

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
                  <div class="flex flex-row items-center gap-2">
                    <b-form-input
                      class="w-48"
                      v-model="maxParentLookupDepth"
                      placeholder="Parent generation limit"
                      type="number"
                      step="1"
                      min="0"
                      size="sm"
                    ></b-form-input>
                    <b-form-input
                      class="w-48"
                      v-model="maxChildLookupDepth"
                      placeholder="Child generation limit"
                      type="number"
                      step="1"
                      min="0"
                      size="sm"
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
    mergedList() {
      return [...this.ancestorList, ...this.childList];
    },
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
      activeView: "Tree",
      views: ["Tree", "List", "Source Harvests", "Log", "Help"],
    };
  },
  watch: {
    status: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue === PackageHistoryStatus.SUCCESS) {
          // @ts-ignore
          // this.autofit();
        }
      },
    },
  },
  methods: {
    ...mapActions({
      setPackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
      setMaxParentVisibleDepth: `packageHistory/${PackageHistoryActions.SET_MAX_PARENT_VISIBLE_DEPTH}`,
      setMaxChildVisibleDepth: `packageHistory/${PackageHistoryActions.SET_MAX_CHILD_VISIBLE_DEPTH}`,
      halt: `packageHistory/${PackageHistoryActions.HALT}`,
    }),
    downloadListCsv(historyList: IHistoryTreeNode[], filename: string) {
      const csvFile: ICsvFile = {
        filename,
        data: historyList.map((x) => [
          x.label,
          x.relationship,
          x.type,
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
      return clientBuildManager.assertValues(["ENABLE_PACKAGE_HISTORY"]);
    },
    orphan(node: IHistoryTreeNode) {
      return {
        ...node,
        parents: [],
        children: [],
      };
    },
    autofit() {
      const container = document.querySelector(".builder-body") as HTMLElement;
      const content = document.querySelector(`#history-tree`) as HTMLElement;
      const treeNav = document.querySelector(`#tree-nav`) as HTMLElement;
      const horizontalScroller = document.querySelector(`#horizontal-scroller`) as HTMLElement;

      const containerCss = getComputedStyle(container);
      const contentCss = getComputedStyle(content);

      const containerWidth =
        container.clientWidth -
        (parseFloat(containerCss.paddingLeft) + parseFloat(containerCss.paddingRight));
      const containerHeight =
        container.clientHeight -
        (parseFloat(containerCss.paddingTop) + parseFloat(containerCss.paddingBottom)) -
        treeNav.clientHeight;

      const contentWidth = content.clientWidth;
      const contentHeight = content.clientHeight;

      const xAdjust = containerWidth / contentWidth;
      const yAdjust = containerHeight / contentHeight;

      this.parentZoom = Math.max(0.02, Math.min(1, xAdjust, yAdjust));

      setTimeout(() => {
        container.scrollTo(0, 0);
        horizontalScroller.scrollTo(0, 0);
      }, 0);
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
