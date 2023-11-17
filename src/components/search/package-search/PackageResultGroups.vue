<template>
  <div>
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

    <template v-if="!filtersApplied || expandSourcePackageLabelGroup">
      <package-search-results-group
        :packages="sourcePackageLabelPackages"
        sectionName="source tag"
        packageFilterIdentifier="sourcePackageLabel"
        :sectionPriority="6"
        :expanded="expandSourcePackageLabelGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandProductionBatchNumberGroup">
      <package-search-results-group
        :packages="productionBatchNumberPackages"
        sectionName="production batch"
        packageFilterIdentifier="productionBatchNumber"
        :sectionPriority="7"
        :expanded="expandProductionBatchNumberGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandSourceProductionBatchNumbersGroup">
      <package-search-results-group
        :packages="sourceProductionBatchNumbersPackages"
        sectionName="source production batches"
        packageFilterIdentifier="sourceProductionBatchNumbers"
        :sectionPriority="8"
        :expanded="expandSourceProductionBatchNumbersGroup"
        :previewLength="3"
      />
    </template>

    <!-- All results -->
    <template v-if="!filtersApplied">
      <package-search-results-group
        :packages="packages"
        sectionName=""
        :packageFilterIdentifier="null"
        :sectionPriority="8"
        :expanded="false"
        :previewLength="allPackagesPreviewLength"
      />
    </template>
  </div>
</template>

<script lang="ts">
import PackageSearchResultsGroup from '@/components/search/package-search/PackageSearchResultsGroup.vue';
import { MessageType } from '@/consts';
import { IIndexedPackageData, IPluginState } from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { pageManager } from '@/modules/page-manager/page-manager.module';
import { PackageSearchActions } from '@/store/page-overlay/modules/package-search/consts';
import { SearchActions } from '@/store/page-overlay/modules/search/consts';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import store from '@/store/page-overlay/index';

export default Vue.extend({
  name: 'PackageResultGroups',
  props: {
    packages: Array as () => IIndexedPackageData[],
  },
  components: { PackageSearchResultsGroup },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      queryString: (state: IPluginState) => state.search.queryString,
      packageSearchFilters: (state: IPluginState) => state.packageSearch.packageSearchFilters,
    }),
    filtersApplied(): boolean {
      return false;
    },
    expandLabelGroup(): boolean {
      return !!store.state.packageSearch.packageSearchFilters.label;
    },
    expandItemNameGroup(): boolean {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.itemName;
    },
    expandItemProductCategoryGroup(): boolean {
      if (this.expandItemNameGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.itemProductCategoryName;
    },
    expandItemStrainNameGroup(): boolean {
      if (this.expandItemProductCategoryGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.itemStrainName;
    },
    expandItemHarvestNameGroup(): boolean {
      if (this.expandItemStrainNameGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.sourceHarvestName;
    },
    expandSourcePackageLabelGroup(): boolean {
      if (this.expandItemHarvestNameGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.sourcePackageLabel;
    },
    expandProductionBatchNumberGroup(): boolean {
      if (this.expandSourcePackageLabelGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.productionBatchNumber;
    },
    expandSourceProductionBatchNumbersGroup(): boolean {
      if (this.expandProductionBatchNumberGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.sourceProductionBatchNumbers;
    },
    expandLocationNameGroup(): boolean {
      if (this.expandSourceProductionBatchNumbersGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.locationName;
    },
    allPackagesPreviewLength(): number {
      if (this.labelPackages.length > 0) {
        return 0;
      }
      if (this.sourceHarvestNamePackages.length > 0) {
        return 0;
      }
      if (this.sourcePackageLabelPackages.length > 0) {
        return 0;
      }
      if (this.productionBatchNumberPackages.length > 0) {
        return 0;
      }
      if (this.sourceProductionBatchNumbersPackages.length > 0) {
        return 0;
      }
      if (this.itemNamePackages.length > 0) {
        return 0;
      }
      if (this.itemStrainNamePackages.length > 0) {
        return 0;
      }
      if (this.itemProductCategoryNamePackages.length > 0) {
        return 0;
      }
      if (this.locationNamePackages.length > 0) {
        return 0;
      }

      return 3;
    },
    labelPackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Label.includes(store.state.search.queryString));

      return packages;
    },
    sourceHarvestNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.SourceHarvestNames?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    sourcePackageLabelPackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.SourcePackageLabels?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    productionBatchNumberPackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.ProductionBatchNumber?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    sourceProductionBatchNumbersPackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.SourceProductionBatchNumbers?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    itemNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Item?.Name?.toUpperCase().includes(store.state.search.queryString.toUpperCase()));

      return packages;
    },
    itemStrainNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Item.StrainName?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    locationNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.LocationName?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    itemProductCategoryNamePackages(): IIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        packageData.Item.ProductCategoryName?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
  },
  methods: {},
});
</script>
