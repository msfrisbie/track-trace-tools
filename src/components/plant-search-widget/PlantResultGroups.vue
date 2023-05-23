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
import { IIndexedPlantData } from "@/interfaces";
import { MessageType, PlantFilterIdentifiers, PlantState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import { mapActions, mapState } from "vuex";
import PlantSearchResultsGroup from "@/components/plant-search-widget/PlantSearchResultsGroup.vue";
import PlantSearchFiltersVue from "./PlantSearchFilters.vue";
import { searchManager } from "@/modules/search-manager.module";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { timer } from "rxjs";

export default Vue.extend({
  name: "PlantResultGroups",
  props: {
    plants: Array as () => IIndexedPlantData[]
  },
  components: { PlantSearchResultsGroup },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState({
      plantQueryString: (state: any) => state.plantSearch?.plantQueryString,
      plantSearchFilters: (state: any) => state.plantSearch?.plantSearchFilters
    }),
    filtersApplied() {
      return false;
    },
    expandLabelGroup() {
      return !!this.plantSearchFilters.label;
    },
    expandStrainNameGroup() {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!this.plantSearchFilters.strainName;
    },
    expandLocationNameGroup() {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!this.plantSearchFilters.locationName;
    },
    allPlantsPreviewLength() {
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
      const plants = this.plants.filter(plantData =>
        plantData.Label.includes(this.plantQueryString)
      );

      return plants;
    },
    strainNamePlants(): IIndexedPlantData[] {
      const plants = this.plants.filter(plantData =>
        plantData.StrainName?.toUpperCase().includes(this.plantQueryString.toUpperCase())
      );

      return plants;
    },
    locationNamePlants(): IIndexedPlantData[] {
      const plants = this.plants.filter(plantData =>
        plantData.LocationName?.toUpperCase().includes(this.plantQueryString.toUpperCase())
      );

      return plants;
    }
  },
  methods: {
    ...mapActions({
      setShowPlantSearchResults: `plantSearch/${PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS}`
    }),
    resetFilters() {
      pageManager.resetMetrcPlantFilters();
    }
    // async setPlantLabelFilter(plant: IIndexedPlantData) {
    //   analyticsManager.track(MessageType.SELECTED_PLANT);

    //   this.$store.dispatch(
    //     `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
    //     {
    //       plantState: plant.PlantState,
    //       plantSearchFilters: {
    //         label: plant.Label
    //       }
    //     }
    //   );

    //   (this as any).setShowPlantSearchResults({ showPlantSearchResults: false });
    // }
  }
});
</script>
