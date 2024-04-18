<template>
  <div>
    <template v-if="!filtersApplied || expandLabelGroup">
      <package-search-results-group :packages="labelPackages" sectionName="tag"
        :packageFilterIdentifier="PackageSearchFilterKeys.LABEL" :sectionPriority="0" :expanded="expandLabelGroup"
        :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandItemNameGroup">
      <package-search-results-group :packages="itemNamePackages" sectionName="item"
        :packageFilterIdentifier="PackageSearchFilterKeys.ITEM_NAME" :sectionPriority="1"
        :expanded="expandItemNameGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandItemProductCategoryGroup">
      <package-search-results-group :packages="itemProductCategoryNamePackages" sectionName="item category"
        :packageFilterIdentifier="PackageSearchFilterKeys.ITEM_PRODUCT_CATEGORY_NAME" :sectionPriority="2"
        :expanded="expandItemProductCategoryGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandLocationNameGroup">
      <package-search-results-group :packages="locationNamePackages" sectionName="location"
        :packageFilterIdentifier="PackageSearchFilterKeys.LOCATION_NAME" :sectionPriority="3"
        :expanded="expandLocationNameGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandItemStrainNameGroup">
      <package-search-results-group :packages="itemStrainNamePackages" sectionName="strain"
        :packageFilterIdentifier="PackageSearchFilterKeys.ITEM_STRAIN_NAME" :sectionPriority="4"
        :expanded="expandItemStrainNameGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandItemHarvestNameGroup">
      <package-search-results-group :packages="sourceHarvestNamesPackages" sectionName="source harvest"
        :packageFilterIdentifier="PackageSearchFilterKeys.SOURCE_HARVEST_NAMES" :sectionPriority="5"
        :expanded="expandItemHarvestNameGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandSourcePackageLabelGroup">
      <package-search-results-group :packages="sourcePackageLabelsPackages" sectionName="source tag"
        :packageFilterIdentifier="PackageSearchFilterKeys.SOURCE_PACKAGE_LABELS" :sectionPriority="6"
        :expanded="expandSourcePackageLabelGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandProductionBatchNumberGroup">
      <package-search-results-group :packages="productionBatchNumberPackages" sectionName="production batch"
        :packageFilterIdentifier="PackageSearchFilterKeys.PRODUCTION_BATCH_NUMBER" :sectionPriority="7"
        :expanded="expandProductionBatchNumberGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandSourceProductionBatchNumbersGroup">
      <package-search-results-group :packages="sourceProductionBatchNumbersPackages"
        sectionName="source production batches"
        :packageFilterIdentifier="PackageSearchFilterKeys.SOURCE_PRODUCTION_BATCH_NUMBERS" :sectionPriority="8"
        :expanded="expandSourceProductionBatchNumbersGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandManifestNumberGroup">
      <package-search-results-group :packages="manifestNumberPackages" sectionName="manifest number"
        :packageFilterIdentifier="PackageSearchFilterKeys.MANIFEST_NUMBER" :sectionPriority="9"
        :expanded="expandManifestNumberGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandDestinationFacilityNameGroup">
      <package-search-results-group :packages="destinationFacilityNamePackages" sectionName="destination facility"
        :packageFilterIdentifier="PackageSearchFilterKeys.DESTINATION_FACILITY_NAME" :sectionPriority="10"
        :expanded="expandDestinationFacilityNameGroup" :previewLength="3" />
    </template>

    <template v-if="!filtersApplied || expandDestinationLicenseNumberGroup">
      <package-search-results-group :packages="destinationLicenseNumberPackages"
        sectionName="destination license number"
        :packageFilterIdentifier="PackageSearchFilterKeys.DESTINATION_LICENSE_NUMBER" :sectionPriority="11"
        :expanded="expandDestinationLicenseNumberGroup" :previewLength="3" />
    </template>

    <!-- All results -->
    <template v-if="!filtersApplied">
      <package-search-results-group :packages="packages" sectionName="" :packageFilterIdentifier="null"
        :sectionPriority="8" :expanded="false" :previewLength="allPackagesPreviewLength" />
    </template>
  </div>
</template>

<script lang="ts">
import PackageSearchResultsGroup from '@/components/search/package-search/PackageSearchResultsGroup.vue';
import { PackageSearchFilterKeys } from '@/consts';
import { IPluginState, IUnionIndexedPackageData } from '@/interfaces';
import store from '@/store/page-overlay/index';
import { getDestinationFacilityNameOrError, getDestinationLicenseNumberOrError, getItemCategoryOrError, getItemNameOrError, getItemStrainNameOrError, getLabelOrError, getLocationNameOrError, getManifestNumberOrError, getProductionBatchNumberOrError, getSourceHarvestNamesOrError, getSourcePackageLabelsOrError, getSourceProductionBatchNumbersOrError } from '@/utils/package';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'PackageResultGroups',
  props: {
    packages: Array as () => IUnionIndexedPackageData[],
  },
  components: { PackageSearchResultsGroup },
  data(): {} {
    return {
      PackageSearchFilterKeys
    };
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

      return !!store.state.packageSearch.packageSearchFilters.sourceHarvestNames;
    },
    expandSourcePackageLabelGroup(): boolean {
      if (this.expandItemHarvestNameGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.sourcePackageLabels;
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
    expandManifestNumberGroup(): boolean {
      if (this.expandLocationNameGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.manifestNumber;
    },
    expandDestinationFacilityNameGroup(): boolean {
      if (this.expandManifestNumberGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.destinationFacilityName;
    },
    expandDestinationLicenseNumberGroup(): boolean {
      if (this.expandDestinationFacilityNameGroup) {
        return false;
      }

      return !!store.state.packageSearch.packageSearchFilters.destinationLicenseNumber;
    },
    allPackagesPreviewLength(): number {
      if (this.labelPackages.length > 0) {
        return 0;
      }
      if (this.sourceHarvestNamesPackages.length > 0) {
        return 0;
      }
      if (this.sourcePackageLabelsPackages.length > 0) {
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
      if (this.manifestNumberPackages.length > 0) {
        return 0;
      }
      if (this.destinationFacilityNamePackages.length > 0) {
        return 0;
      }
      if (this.destinationLicenseNumberPackages.length > 0) {
        return 0;
      }

      return 3;
    },
    labelPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getLabelOrError(packageData)?.toUpperCase().includes(store.state.search.queryString.toUpperCase()));

      return packages;
    },
    sourceHarvestNamesPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getSourceHarvestNamesOrError(packageData).toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    sourcePackageLabelsPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getSourcePackageLabelsOrError(packageData).toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    productionBatchNumberPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getProductionBatchNumberOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    sourceProductionBatchNumbersPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getSourceProductionBatchNumbersOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    itemNamePackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getItemNameOrError(packageData)?.toUpperCase().includes(store.state.search.queryString.toUpperCase()));

      return packages;
    },
    itemStrainNamePackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getItemStrainNameOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    locationNamePackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getLocationNameOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    itemProductCategoryNamePackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getItemCategoryOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    manifestNumberPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getManifestNumberOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    destinationLicenseNumberPackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getDestinationLicenseNumberOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    },
    destinationFacilityNamePackages(): IUnionIndexedPackageData[] {
      const packages = this.packages.filter((packageData) =>
        getDestinationFacilityNameOrError(packageData)?.toUpperCase().includes(
          store.state.search.queryString.toUpperCase(),
        ));

      return packages;
    }
  },
  methods: {
  },
});
</script>
