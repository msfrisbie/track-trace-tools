<template>
  <div v-if="plant" class="flex flex-col items-center space-y-8 px-2 p-4">
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-col items-center space-x-4 text-center">
            <plant-icon :plant="plant" class="text-5xl" />

            <!-- <div class="text-3xl">{{ plant.StrainName }}</div> -->
          </div>

          <b-badge :variant="badgeVariant(plant)">{{ displayPlantState(plant) }}</b-badge>
        </div>
      </div>

      <div
        v-show="isOnPlantsPage"
        @click.stop.prevent="setPlantLabelFilter(plant)"
        class="flex flex-row items-center justify-center cursor-pointer h-full"
      >
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <div class="text-2xl text-purple-800 text-center demo-blur">
      {{ plant.StrainName }}
    </div>

    <div class="flex flex-col items-stretch space-y-2"></div>

    <table class="text-lg">
      <tr class="cursor-pointer hover:bg-purple-50" @click.stop.prevent="copyToClipboard(plant)">
        <td class="text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="tag" />
        </td>
        <td class="p-2">
          {{ plant.Label }}
        </td>
      </tr>
      <tr>
        <td class="text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="map-marker-alt" />
        </td>
        <td class="p-2">
          {{ plant.LocationName }}
        </td>
      </tr>
      <tr>
        <td class="text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="seedling" />
        </td>
        <td class="p-2">
          {{ plant.PlantBatchName }}
        </td>
      </tr>
      <tr>
        <td class="text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="cut" />
        </td>
        <td class="p-2">{{ plant.HarvestCount }}x Harvests</td>
      </tr>
      <tr>
        <td class="align-top text-right p-2 text-gray-400 text-2xl">
          <font-awesome-icon icon="calendar" />
        </td>
        <td class="p-2 grid grid-cols-2 gap-2">
          <div>Planted Date:</div>
          <div>{{ plant.PlantedDate }}</div>
          <template v-if="!!plant.VegetativeDate">
            <div>Vegetative Date:</div>
            <div>{{ plant.VegetativeDate }}</div>
          </template>
          <template v-if="!!plant.FloweringDate">
            <div>Flowering Date:</div>
            <div>{{ plant.FloweringDate }}</div>
          </template>
          <template v-if="!!plant.DestroyedDate">
            <div>Destroyed Date:</div>
            <div>{{ plant.DestroyedDate }}</div>
          </template>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import PlantIcon from "@/components/search/plant-search/PlantIcon.vue";
import { MessageType, PlantState } from "@/consts";
import { IIndexedPlantData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { PLANTS_TAB_REGEX } from "@/modules/page-manager/consts";
import { searchManager } from "@/modules/search-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { copyToClipboard } from "@/utils/dom";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PlantSearchResultDetail",
  store,
  components: { PlantIcon },
  async created() {
    searchManager.selectedPlant
      .asObservable()
      .pipe(takeUntil(this.$data.destroyed$))
      .subscribe(
        (selectedPlantMetatdata) =>
          (this.$data.plant = selectedPlantMetatdata ? selectedPlantMetatdata.plantData : null)
      );
  },
  beforeDestroy() {
    this.$data.destroyed$.next(null);
  },
  data(): {
    destroyed$: Subject<void>;
    plant: IIndexedPlantData | null;
  } {
    return {
      destroyed$: new Subject(),
      plant: null,
    };
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      flags: (state: any) => state.flags,
    }),
    isOnPlantsPage() {
      return window.location.pathname.match(PLANTS_TAB_REGEX);
    },
    ...mapGetters({}),
  },
  watch: {},
  methods: {
    ...mapActions({
      setShowPlantSearchResults: `plantSearch/${PlantSearchActions.SET_SHOW_PLANT_SEARCH_RESULTS}`,
      partialUpdatePlantSearchFilters: `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
      setPlantSearchFilters: `plantSearch/${PlantSearchActions.SET_PLANT_SEARCH_FILTERS}`,
    }),
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
      return plant.PlantState;
    },
  },
});
</script>
