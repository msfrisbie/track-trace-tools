<template>
  <div v-show="isOnPackagesPage" v-if="hasFiltersApplied" class="flex flex-row gap-2">
    <b-button-group v-if="packageSearchFilters.label">
      <b-button size="sm" variant="light" disabled>Tag:
        <span class="metrc-tag">{{ packageSearchFilters.label }}</span>
      </b-button>
      <b-button size="sm" variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { label: '' } })">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.sourceHarvestNames">
      <b-button size="sm" variant="light" disabled>Harvest matches "{{ packageSearchFilters.sourceHarvestNames
        }}"</b-button>
      <b-button size="sm" variant="light" @click="
    partialUpdatePackageSearchFilters({ packageSearchFilters: { sourceHarvestNames: '' } })
    ">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.sourcePackageLabels">
      <b-button size="sm" variant="light" disabled>Source package tag matches "{{
    packageSearchFilters.sourcePackageLabels }}"</b-button>
      <b-button size="sm" variant="light" @click="
    partialUpdatePackageSearchFilters({ packageSearchFilters: { sourcePackageLabels: '' } })
    ">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.productionBatchNumber">
      <b-button size="sm" variant="light" disabled>Production batch # matches "{{
    packageSearchFilters.productionBatchNumber }}"</b-button>
      <b-button size="sm" variant="light" @click="
    partialUpdatePackageSearchFilters({ packageSearchFilters: { productionBatchNumber: '' } })
    ">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.sourceProductionBatchNumbers">
      <b-button size="sm" variant="light" disabled>Source production batch #s matches "{{
    packageSearchFilters.sourceProductionBatchNumbers
  }}"</b-button>
      <b-button size="sm" variant="light" @click="
  partialUpdatePackageSearchFilters({
    packageSearchFilters: { sourceProductionBatchNumbers: '' },
  })
    ">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.itemName">
      <b-button size="sm" variant="light" disabled>Item matches "{{ packageSearchFilters.itemName }}"</b-button>
      <b-button size="sm" variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { itemName: '' } })">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.locationName">
      <b-button size="sm" variant="light" disabled>Location matches "{{ packageSearchFilters.locationName }}"</b-button>
      <b-button size="sm" variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { locationName: '' } })">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.itemStrainName">
      <b-button size="sm" variant="light" disabled>Strain matches "{{ packageSearchFilters.itemStrainName }}"</b-button>
      <b-button size="sm" variant="light"
        @click="partialUpdatePackageSearchFilters({ packageSearchFilters: { itemStrainName: '' } })">&#10006;</b-button>
    </b-button-group>

    <b-button-group v-if="packageSearchFilters.itemProductCategoryName">
      <b-button size="sm" variant="light" disabled>Category matches "{{ packageSearchFilters.itemProductCategoryName
        }}"</b-button>
      <b-button size="sm" variant="light" @click="
    partialUpdatePackageSearchFilters({
      packageSearchFilters: { itemProductCategoryName: '' },
    })
    ">&#10006;</b-button>
    </b-button-group>

    <b-button-group>
      <b-button size="sm" variant="danger" @click="setPackageSearchFilters({ packageSearchFilters: {} })">RESET
        FILTERS</b-button>
    </b-button-group>
  </div>
</template>

<script lang="ts">
import { IPluginState } from '@/interfaces';
import { PACKAGE_TAB_REGEX } from '@/modules/page-manager/consts';
import store from '@/store/page-overlay/index';
import { PackageSearchActions } from '@/store/page-overlay/modules/package-search/consts';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  name: 'PackageSearchFilters',
  store,
  computed: {
    ...mapState<IPluginState>({
      packageSearchFilters: (state: IPluginState) => state.packageSearch.packageSearchFilters,
    }),
    isOnPackagesPage() {
      return window.location.pathname.match(PACKAGE_TAB_REGEX);
    },
    hasFiltersApplied() {
      return (
        Object.values(store.state.packageSearch.packageSearchFilters || {}).filter((x) => !!x)
          .length > 0
      );
    },
  },
  methods: {
    ...mapActions({
      partialUpdatePackageSearchFilters: `packageSearch/${PackageSearchActions.PARTIAL_UPDATE_PACKAGE_SEARCH_FILTERS}`,
      setPackageSearchFilters: `packageSearch/${PackageSearchActions.SET_PACKAGE_SEARCH_FILTERS}`,
    }),
  },
  async mounted() {
  },
});
</script>
