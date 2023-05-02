<template>
  <div v-if="packages.length > 0" class="border-purple-300 border-b">
    <div class="p-4 flex flex-row items-center border-purple-300">
      <div class="flex flex-row items-center space-x-4">
        <font-awesome-icon :icon="groupIcon" class="text-3xl text-gray-400" />

        <div class="text-xl text-gray-500">
          <template v-if="sectionName">
            {{ packages.length }}{{ packages.length === 500 ? "+" : "" }}&nbsp;{{
              sectionName
            }}&nbsp;matches:
          </template>
          <template v-else> All matching packages: </template>
        </div>
      </div>

      <div class="flex-grow"></div>

      <b-button
        v-if="!expanded && !disableFilter"
        variant="outline-primary"
        size="sm"
        @click.stop.prevent="applyFilter"
        v-show="isOnPackagesPage"
      >
        FILTER
        <!-- <font-awesome-icon icon="chevron-right"/> -->
      </b-button>
    </div>

    <package-search-result-preview
      v-for="(pkg, index) in visiblePackages"
      :key="pkg.Id"
      :pkg="pkg"
      :sectionName="sectionName"
      :selected="
        !!selectedPackageMetadata &&
        pkg.Id === selectedPackageMetadata.packageData.Id &&
        sectionName === selectedPackageMetadata.sectionName
      "
      :idx="index"
      v-on:selected-package="showPackageDetail($event)"
    />

    <div
      v-if="!showAll && !expanded && packages.length > previewLength"
      class="cursor-pointer flex flex-row justify-center items-center hover:bg-purple-100"
      @click.stop.prevent="showAll = true"
    >
      <span class="text-gray-500 p-2">{{ packages.length - previewLength }}&nbsp;MORE</span>
    </div>
  </div>
</template>

<script lang="ts">
import PackageSearchResultPreview from "@/components/package-search-widget/PackageSearchResultPreview.vue";
import { IIndexedPackageData } from "@/interfaces";
import { PACKAGE_TAB_REGEX } from "@/modules/page-manager.module";
import { ISelectedPackageMetadata, searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageSearchResultsGroup",
  store,
  components: { PackageSearchResultPreview },
  data(): {
    destroyed$: Subject<void>;
    selectedPackageMetadata: ISelectedPackageMetadata | null;
    showAll: boolean;
  } {
    return {
      destroyed$: new Subject(),
      selectedPackageMetadata: null,
      showAll: false,
    };
  },
  props: {
    sectionName: String,
    packages: Array as () => IIndexedPackageData[],
    packageFilterIdentifier: String,
    sectionPriority: Number,
    expanded: Boolean,
    previewLength: Number,
  },
  watch: {
    packages: {
      immediate: true,
      handler(newValue, oldValue) {
        searchManager.selectedPackage
          .asObservable()
          .pipe(take(1))
          .subscribe((packageMetadata) => {
            if (
              newValue.length > 0 &&
              !newValue.find((x: any) => x.Id === packageMetadata?.packageData.Id)
            ) {
              console.log({newValue: newValue[0].Label})
              searchManager.maybeInitializeSelectedPackage(
                newValue[0],
                this.sectionName,
                this.sectionPriority
              );
            }
          });
      },
    },
  },
  computed: {
    isOnPackagesPage() {
      return window.location.pathname.match(PACKAGE_TAB_REGEX);
    },
    visiblePackages() {
      return this.expanded || this.$data.showAll
        ? this.packages
        : this.packages.slice(0, this.previewLength);
    },
    groupIcon() {
      switch (this.packageFilterIdentifier) {
        case "label":
        case "sourcePackageLabel":
          return "tags";
        case "sourceHarvestName":
          return "cut";
        case "itemStrainName":
          return "cannabis";
        case "locationName":
          return "map-marker-alt";
        case "itemName":
        case "itemProductCategoryName":
        default:
          return "boxes";
      }
    },
    disableFilter() {
      return !this.packageFilterIdentifier || this.packageFilterIdentifier === "label";
    },
    ...mapState({
      packageQueryString: (state: any) => state.packageSearch?.packageQueryString,
    }),
  },
  methods: {
    showPackageDetail(packageData: IIndexedPackageData) {
      // TODO debounce this to improve mouseover accuracy
      searchManager.selectedPackage.next({
        packageData,
        sectionName: this.sectionName,
        priority: this.sectionPriority,
      });
    },
    applyFilter() {
      if (this.disableFilter) {
        return;
      }

      this.$store.dispatch(
        `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
        {
          packageSearchFilters: {
            [this.packageFilterIdentifier]: this.packageQueryString,
          },
        }
      );

      searchManager.setPackageSearchVisibility({ showPackageSearchResults: false });
    },
  },
  created() {
    searchManager.selectedPackage
      .asObservable()
      .pipe(takeUntil(this.$data.destroyed$))
      .subscribe(
        (selectedPackageMetadata) => (this.$data.selectedPackageMetadata = selectedPackageMetadata)
      );
  },
  beforeDestroy() {
    this.$data.destroyed$.next(null);
  },
});
</script>
