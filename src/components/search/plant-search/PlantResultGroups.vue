<template>
  <div>
    <template v-if="!filtersApplied || expandLabelGroup">
      <plant-search-results-group
        :plants="labelPlants"
        sectionName="tag"
        plantFilterIdentifier="label"
        :sectionPriority="0"
        :expanded="expandLabelGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandLocationNameGroup">
      <plant-search-results-group
        :plants="locationNamePlants"
        sectionName="location"
        plantFilterIdentifier="locationName"
        :sectionPriority="1"
        :expanded="expandLocationNameGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandStrainNameGroup">
      <plant-search-results-group
        :plants="strainNamePlants"
        sectionName="strain"
        plantFilterIdentifier="strainName"
        :sectionPriority="2"
        :expanded="expandStrainNameGroup"
        :previewLength="3"
      />
    </template>

    <!-- All results -->
    <template v-if="!filtersApplied">
      <plant-search-results-group
        :plants="plants"
        sectionName=""
        :plantFilterIdentifier="null"
        :sectionPriority="3"
        :expanded="false"
        :previewLength="allPlantsPreviewLength"
      />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { MutationType } from "@/mutation-types";
import { IIndexedPlantData, IPluginState } from "@/interfaces";
import { MessageType, PlantFilterIdentifiers, PlantState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import { mapActions, mapState } from "vuex";
import PlantSearchResultsGroup from "@/components/search/plant-search/PlantSearchResultsGroup.vue";
import PlantSearchFiltersVue from "./PlantSearchFilters.vue";
import { searchManager } from "@/modules/search-manager.module";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { timer } from "rxjs";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { IPlantSearchState } from "@/store/page-overlay/modules/plant-search/interfaces";
import store from "@/store/page-overlay/index";

export default Vue.extend({
  name: "PlantResultGroups",
  store,
  props: {
    plants: Array as () => IIndexedPlantData[],
  },
  components: { PlantSearchResultsGroup },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      plantSearchState: (state: IPluginState) => state.plantSearch,
      plantSearchFilters: (state: IPluginState) => state.plantSearch.plantSearchFilters,
    }),
    filtersApplied(): boolean {
      return false;
    },
    expandLabelGroup(): boolean {
      return !!store.state.plantSearch.plantSearchFilters.label;
    },
    expandStrainNameGroup(): boolean {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!store.state.plantSearch.plantSearchFilters.strainName;
    },
    expandLocationNameGroup(): boolean {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!store.state.plantSearch.plantSearchFilters.locationName;
    },
    allPlantsPreviewLength(): number {
      // @ts-ignore
      if (this.labelPlants.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.strainNamePlants.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.locationNamePlants.length > 0) {
        return 0;
      }

      return 3;
    },
    labelPlants(): IIndexedPlantData[] {
      const plants = this.plants.filter((plantData) =>
        plantData.Label.includes(store.state.search.queryString)
      );

      return plants;
    },
    strainNamePlants(): IIndexedPlantData[] {
      const plants = this.plants.filter((plantData) =>
        plantData.StrainName?.toUpperCase().includes(store.state.search.queryString.toUpperCase())
      );

      return plants;
    },
    locationNamePlants(): IIndexedPlantData[] {
      const plants = this.plants.filter((plantData) =>
        plantData.LocationName?.toUpperCase().includes(store.state.search.queryString.toUpperCase())
      );

      return plants;
    },
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    resetFilters() {
      pageManager.resetMetrcPlantFilters();
    },
    // async setPlantLabelFilter(plant: IIndexedPlantData) {
    //   analyticsManager.track(MessageType.SELECTED_PLANT);

    //   store.dispatch(
    //     `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
    //     {
    //       plantState: plant.PlantState,
    //       plantSearchFilters: {
    //         label: plant.Label
    //       }
    //     }
    //   );

    //   this.setShowSearchResults({ showSearchResults: false });
    // }
  },
});
</script>
