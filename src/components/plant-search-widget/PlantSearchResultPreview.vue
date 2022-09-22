<template>
  <div
    class="border-blue-300"
    v-bind:class="{
      'bg-white': selected
    }"
    @mouseenter="selectPlant(plant)"
    @click.stop.prevent="setPlantLabelFilter(plant)"
  >
    <div class="flex flex-row items-center space-x-6 cursor-pointer p-4">
      <div
        class="flex flex-column-shim flex-col space-y-2"
        v-bind:class="{ 'font-bold': selected }"
      >
        <div class="text-xl text-blue-700 demo-blur">
          {{ plant.StrainName }}
        </div>
        <div class="text-gray-700 text-lg metrc-tag">{{ plant.Label }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { MutationType } from "@/mutation-types";
import { IIndexedPlantData } from "@/interfaces";
import { MessageType, PlantFilterIdentifiers, PlantState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import PlantIcon from "@/components/plant-search-widget/PlantIcon.vue";
import { mapActions, mapState } from "vuex";
import { searchManager } from "@/modules/search-manager.module";
import { v4 } from "uuid";
import { timer } from "rxjs";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";

export default Vue.extend({
  name: "PlantSearchResultPreview",
  props: {
    sectionName: String,
    plant: Object as () => IIndexedPlantData,
    selected: Boolean,
    idx: Number
  },
  methods: {
    ...mapActions({
      setShowPlantSearchResults: `plantSearch/${PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS}`,
      partialUpdatePlantSearchFilters: `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
      setPlantSearchFilters: `plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`
    }),
    selectPlant(plant: IIndexedPlantData) {
      this.$emit("selected-plant", plant);
    },
    async setPlantLabelFilter(plant: IIndexedPlantData) {
      analyticsManager.track(MessageType.SELECTED_PLANT);

      this.$store.dispatch(
        `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
        {
          plantState: plant.PlantState,
          plantSearchFilters: {
            label: plant.Label
          }
        }
      );

      (this as any).setShowPlantSearchResults({ showPlantSearchResults: false });
    }
  }
});
</script>
