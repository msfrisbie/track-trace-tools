<template>
  <div v-show="isOnPlantsPage" v-if="hasFiltersApplied" class="flex flex-row gap-2">
    <b-button-group v-if="plantSearchFilters.label">
      <b-button size="sm" variant="light" disabled
        >Tag:
        <span class="metrc-tag">{{ plantSearchFilters.label }}</span>
      </b-button>
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePlantSearchFilters({ plantSearchFilters: { label: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="plantSearchFilters.locationName">
      <b-button size="sm" variant="light" disabled
        >Location matches "{{ plantSearchFilters.locationName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePlantSearchFilters({ plantSearchFilters: { locationName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="plantSearchFilters.strainName">
      <b-button size="sm" variant="light" disabled
        >Strain matches "{{ plantSearchFilters.strainName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdatePlantSearchFilters({ plantSearchFilters: { strainName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group>
      <b-button
        size="sm"
        variant="danger"
        @click="setPlantSearchFilters({ plantSearchFilters: {} })"
        >RESET FILTERS</b-button
      >
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { IPlantSearchFilters } from "@/interfaces";
import { PLANTS_TAB_REGEX } from "@/modules/page-manager/consts";
import { mapActions, mapState } from "vuex";
import { PlantFilterIdentifiers } from "@/consts";
import { MutationType } from "@/mutation-types";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";

interface ComponentData {
  plantSearchFilters: IPlantSearchFilters;
}

export default Vue.extend({
  name: "PlantSearchFilters",
  store,
  computed: {
    ...mapState({
      plantSearchFilters: (state: any) => state.plantSearch.plantSearchFilters,
    }),
    isOnPlantsPage() {
      return window.location.pathname.match(PLANTS_TAB_REGEX);
    },
    hasFiltersApplied() {
      return Object.values(this.plantSearchFilters || {}).filter((x) => !!x).length > 0;
    },
  },
  methods: {
    ...mapActions({
      partialUpdatePlantSearchFilters: `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
      setPlantSearchFilters: `plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`,
    }),
  },
  async mounted() {
    if (!this.isOnPlantsPage) {
      // store.dispatch(`plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`, {});
    }
  },
});
</script>
