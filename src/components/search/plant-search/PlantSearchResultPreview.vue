<template>
  <div
    class="border-purple-300"
    v-bind:class="{
      'bg-white': selected,
    }"
    @mouseenter="selectPlant(plant)"
    @click.stop.prevent="setPlantLabelFilter(plant)"
  >
    <div class="flex flex-row items-center space-x-6 cursor-pointer p-4">
      <div
        class="flex flex-column-shim flex-col space-y-2"
        v-bind:class="{ 'font-bold': selected }"
      >
        <div class="text-xl text-purple-700 demo-blur">
          {{ plant.StrainName }}
        </div>
        <div class="text-gray-700 text-lg metrc-tag">{{ plant.Label }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IIndexedPlantData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import Vue from "vue";
import { mapActions } from "vuex";

export default Vue.extend({
  name: "PlantSearchResultPreview",
  props: {
    sectionName: String,
    plant: Object as () => IIndexedPlantData,
    selected: Boolean,
    idx: Number,
  },
  methods: {
    ...mapActions({
      setShowPlantSearchResults: `plantSearch/${PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS}`,
      partialUpdatePlantSearchFilters: `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
      setPlantSearchFilters: `plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`,
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
            label: plant.Label,
          },
        }
      );

      (this as any).setShowPlantSearchResults({ showPlantSearchResults: false });
    },
  },
});
</script>
