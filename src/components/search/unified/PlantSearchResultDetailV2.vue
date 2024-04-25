<template>
  <div v-if="searchResultPlantOrNull" class="flex flex-col items-center space-y-8 px-2 p-4">
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-col items-center space-x-4 text-center">
            <metrc-tag :label="searchResultPlantOrNull.Label" sideText="PLANT"></metrc-tag>
          </div>

          <b-badge class="text-lg" :variant="badgeVariant(searchResultPlantOrNull)">{{
            displayPlantState(searchResultPlantOrNull)
          }}</b-badge>
        </div>
      </div>

      <div
        v-show="isOnPlantsPage"
        @click.stop.prevent="setPlantLabelFilter(searchResultPlantOrNull)"
        class="flex flex-row items-center justify-center cursor-pointer h-full"
      >
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <recursive-json-table :jsonObject="searchResultPlantOrNull"></recursive-json-table>
  </div>
</template>

<script lang="ts">
import MetrcTag from "@/components/overlay-widget/shared/MetrcTag.vue";
import RecursiveJsonTable from "@/components/search/shared/RecursiveJsonTable.vue";
import { MessageType, PlantState } from "@/consts";
import { IIndexedPlantData, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { PLANTS_TAB_REGEX } from "@/modules/page-manager/consts";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { copyToClipboard } from "@/utils/dom";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PlantSearchResultDetailV2",
  store,
  components: { MetrcTag, RecursiveJsonTable },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      flags: (state: IPluginState) => state.flags,
      searchState: (state: IPluginState) => state.search,
    }),
    searchResultPlantOrNull(): IIndexedPlantData | null {
      return store.state.search.activeSearchResult?.plant ?? null;
    },
    isOnPlantsPage(): boolean {
      return !!window.location.pathname.match(PLANTS_TAB_REGEX);
    },
    ...mapGetters({}),
  },
  watch: {},
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      partialUpdatePlantSearchFilters: `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
      setPlantSearchFilters: `plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`,
    }),
    async setPlantLabelFilter(plant: IIndexedPlantData) {
      analyticsManager.track(MessageType.SELECTED_PLANT);

      store.dispatch(`plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`, {
        plantState: plant.PlantState,
        plantSearchFilters: {
          label: plant.Label,
        },
      });

      this.setShowSearchResults({ showSearchResults: false });
    },
    copyToClipboard(plant: IIndexedPlantData) {
      analyticsManager.track(MessageType.COPIED_TEXT, { value: plant.Label });

      copyToClipboard(plant.Label);

      toastManager.openToast(`'${plant.Label}' copied to clipboard`, {
        title: "Copied Tag",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
    badgeVariant(plant: IIndexedPlantData) {
      // @ts-ignore
      switch (plant.PlantState as PlantState) {
        case PlantState.VEGETATIVE:
        case PlantState.FLOWERING:
          return "success";
        case PlantState.INACTIVE:
          return "dark";
        default:
          return null;
      }
    },
    displayPlantState(plant: IIndexedPlantData) {
      return plant.PlantState.replaceAll("_", " ");
    },
  },
});
</script>
