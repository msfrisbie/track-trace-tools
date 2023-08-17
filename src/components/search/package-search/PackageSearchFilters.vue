<template>
  <div v-show="isOnPackagesPage" v-if="hasFiltersApplied" class="flex flex-row gap-2">
    <b-button-group v-if="packageSearchFilters.label">
      <b-button size="sm" variant="light" disabled
        >Tag:
        <span class="metrc-tag">{{ packageSearchFilters.label }}</span>
      </b-button>
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { label: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.sourceHarvestName">
      <b-button size="sm" variant="light" disabled
        >Harvest matches "{{ packageSearchFilters.sourceHarvestName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="
          partialUpdatePackageSearchFilters({ packageSearchFilters: { sourceHarvestName: '' } })
        "
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.sourcePackageLabel">
      <b-button size="sm" variant="light" disabled
        >Source package tag matches "{{ packageSearchFilters.sourcePackageLabel }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="
          partialUpdatePackageSearchFilters({ packageSearchFilters: { sourcePackageLabel: '' } })
        "
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.productionBatchNumber">
      <b-button size="sm" variant="light" disabled
        >Production batch # matches "{{ packageSearchFilters.productionBatchNumber }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="
          partialUpdatePackageSearchFilters({ packageSearchFilters: { productionBatchNumber: '' } })
        "
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.sourceProductionBatchNumbers">
      <b-button size="sm" variant="light" disabled
        >Source production batch #s matches "{{
          packageSearchFilters.sourceProductionBatchNumbers
        }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="
          partialUpdatePackageSearchFilters({
            packageSearchFilters: { sourceProductionBatchNumbers: '' },
          })
        "
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.itemName">
      <b-button size="sm" variant="light" disabled
        >Item matches "{{ packageSearchFilters.itemName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { itemName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.locationName">
      <b-button size="sm" variant="light" disabled
        >Location matches "{{ packageSearchFilters.locationName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { locationName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.itemStrainName">
      <b-button size="sm" variant="light" disabled
        >Strain matches "{{ packageSearchFilters.itemStrainName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { itemStrainName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.itemProductCategoryName">
      <b-button size="sm" variant="light" disabled
        >Category matches "{{ packageSearchFilters.itemProductCategoryName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="
          partialUpdatePackageSearchFilters({
            packageSearchFilters: { itemProductCategoryName: '' },
          })
        "
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group>
      <b-button
        size="sm"
        variant="danger"
        @click="setPackageSearchFilters({ packageSearchFilters: {} })"
        >RESET FILTERS</b-button
      >
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { IPackageSearchFilters } from "@/interfaces";
import { PACKAGE_TAB_REGEX } from "@/modules/page-manager/consts";
import { mapActions, mapState } from "vuex";
import { PackageFilterIdentifiers } from "@/consts";
import { MutationType } from "@/mutation-types";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";

interface ComponentData {
  packageSearchFilters: IPackageSearchFilters;
}

export default Vue.extend({
  name: "PackageSearchFilters",
  store,
  computed: {
    ...mapState({
      packageSearchFilters: (state: any) => state.packageSearch.packageSearchFilters,
    }),
    isOnPackagesPage() {
      return window.location.pathname.match(PACKAGE_TAB_REGEX);
    },
    hasFiltersApplied() {
      return Object.values(this.packageSearchFilters || {}).filter((x) => !!x).length > 0;
    },
  },
  methods: {
    ...mapActions({
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
    }),
  },
  async mounted() {
    if (!this.isOnPackagesPage) {
      // store.dispatch(`packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`, {});
    }
  },
});
</script>
