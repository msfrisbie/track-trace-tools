<template>
  <div>
    <!-- <div
      v-if="filtersApplied || expandLabelGroup"
      class="p-4 border-purple-300 border-b"
    >
      <b-button
        style="opacity: 0.6"
        variant="outline-primary"
        size="sm"
        @click.stop.prevent="resetFilters"
        >CLEAR FILTER</b-button
      >
    </div> -->

    <template v-if="!filtersApplied || expandLabelGroup">
      <package-search-results-group
        :packages="labelPackages"
        sectionName="tag"
        packageFilterIdentifier="label"
        :sectionPriority="0"
        :expanded="expandLabelGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandItemNameGroup">
      <package-search-results-group
        :packages="itemNamePackages"
        sectionName="item"
        packageFilterIdentifier="itemName"
        :sectionPriority="1"
        :expanded="expandItemNameGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandItemProductCategoryGroup">
      <package-search-results-group
        :packages="itemProductCategoryNamePackages"
        sectionName="item category"
        packageFilterIdentifier="itemProductCategoryName"
        :sectionPriority="2"
        :expanded="expandItemProductCategoryGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandLocationNameGroup">
      <package-search-results-group
        :packages="locationNamePackages"
        sectionName="location"
        packageFilterIdentifier="locationName"
        :sectionPriority="3"
        :expanded="expandLocationNameGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandItemStrainNameGroup">
      <package-search-results-group
        :packages="itemStrainNamePackages"
        sectionName="strain"
        packageFilterIdentifier="itemStrainName"
        :sectionPriority="4"
        :expanded="expandItemStrainNameGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandItemHarvestNameGroup">
      <package-search-results-group
        :packages="sourceHarvestNamePackages"
        sectionName="source harvest"
        packageFilterIdentifier="sourceHarvestName"
        :sectionPriority="5"
        :expanded="expandItemHarvestNameGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandSourcePackagelabelNameGroup">
      <package-search-results-group
        :packages="sourcePackageLabelPackages"
        sectionName="source tag"
        packageFilterIdentifier="sourcePackageLabel"
        :sectionPriority="6"
        :expanded="expandSourcePackagelabelNameGroup"
        :previewLength="3"
      />
    </template>

    <!-- All results -->
    <template v-if="!filtersApplied">
      <package-search-results-group
        :packages="packages"
        sectionName=""
        :packageFilterIdentifier="null"
        :sectionPriority="7"
        :expanded="false"
        :previewLength="allPackagesPreviewLength"
      />
    </template>
  </div>
</template>

<script lang="ts">
import PackageSearchResultsGroup from "@/components/package-search-widget/PackageSearchResultsGroup.vue";
import { MessageType } from "@/consts";
import { IIndexedPackageData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "PackageResultGroups",
  props: {
    packages: Array as () => IIndexedPackageData[],
  },
  components: { PackageSearchResultsGroup },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState({
      packageQueryString: (state: any) => state.packageSearch?.packageQueryString,
      packageSearchFilters: (state: any) => state.packageSearch?.packageSearchFilters,
    }),
    filtersApplied() {
      return false;
    },
    expandLabelGroup() {
      return !!this.packageSearchFilters.label;
    },
    expandItemNameGroup() {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!this.packageSearchFilters.itemName;
    },
    expandItemProductCategoryGroup() {
      if (this.expandItemNameGroup) {
        return false;
      }

      return !!this.packageSearchFilters.itemProductCategoryName;
    },
    expandItemStrainNameGroup() {
      if (this.expandItemProductCategoryGroup) {
        return false;
      }

      return !!this.packageSearchFilters.itemStrainName;
    },
    expandItemHarvestNameGroup() {
      if (this.expandItemStrainNameGroup) {
        return false;
      }

      return !!this.packageSearchFilters.sourceHarvestName;
    },
    expandSourcePackagelabelNameGroup() {
      if (this.expandItemHarvestNameGroup) {
        return false;
      }

      return !!this.packageSearchFilters.sourcePackageLabel;
    },
    expandLocationNameGroup() {
      if (this.expandSourcePackagelabelNameGroup) {
        return false;
      }

      return !!this.packageSearchFilters.locationName;
    },
    allPackagesPreviewLength() {
      // @ts-ignore
      if (this.labelPackages.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.sourceHarvestNamePackages.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.sourcePackageLabelPackages.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.itemNamePackages.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.itemStrainNamePackages.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.itemProductCategoryNamePackages.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.locationNamePackages.length > 0) {
        return 0;
      }

      return 3;
    },
    labelPackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Label.includes(this.packageQueryString)
      );

      return packages;
    },
    sourceHarvestNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.SourceHarvestNames?.toUpperCase().includes(
          this.packageQueryString.toUpperCase()
        )
      );

      return packages;
    },
    sourcePackageLabelPackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.SourcePackageLabels?.toUpperCase().includes(
          this.packageQueryString.toUpperCase()
        )
      );

      return packages;
    },
    itemNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Item?.Name?.toUpperCase().includes(this.packageQueryString.toUpperCase())
      );

      return packages;
    },
    itemStrainNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Item.StrainName?.toUpperCase().includes(this.packageQueryString.toUpperCase())
      );

      return packages;
    },
    locationNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.LocationName?.toUpperCase().includes(this.packageQueryString.toUpperCase())
      );

      return packages;
    },
    itemProductCategoryNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Item.ProductCategoryName?.toUpperCase().includes(
          this.packageQueryString.toUpperCase()
        )
      );

      return packages;
    },
  },
  methods: {
    ...mapActions({
      setShowPackageSearchResults: `packageSearch/${PackageSearchActions.SET_SHOW_PACKAGE_SEARCH_RESULTS}`,
    }),
    resetFilters() {
      pageManager.resetMetrcPackageFilters();
    },
    async setPackageLabelFilter(pkg: IIndexedPackageData) {
      analyticsManager.track(MessageType.SELECTED_PACKAGE);

      this.$store.dispatch(
        `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
        {
          packageState: pkg.PackageState,
          packageSearchFilters: {
            label: pkg.Label,
          },
        }
      );

      (this as any).setShowPackageSearchResults({ showPackageSearchResults: false });
    },
  },
});
</script>
