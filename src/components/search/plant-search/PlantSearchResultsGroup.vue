<template>
  <div v-if="plants.length > 0" class="border-purple-300 border-b">
    <div class="p-4 flex flex-row items-center border-purple-300">
      <div class="flex flex-row items-center space-x-4">
        <font-awesome-icon :icon="groupIcon" class="text-3xl text-gray-400" />

        <div class="text-xl text-gray-500">
          <template v-if="sectionName">
            {{ plants.length }}{{ plants.length === 500 ? "+" : "" }}&nbsp;{{
              sectionName
            }}&nbsp;matches:
          </template>
          <template v-else> All matching plants: </template>
        </div>
      </div>

      <div class="flex-grow"></div>

      <b-button
        v-if="!expanded && !disableFilter"
        variant="outline-primary"
        size="sm"
        @click.stop.prevent="applyFilter"
        v-show="isOnPlantsPage"
      >
        FILTER
        <!-- <font-awesome-icon icon="chevron-right"/> -->
      </b-button>
    </div>

    <plant-search-result-preview
      v-for="(plant, index) in visiblePlants"
      :key="plant.Id"
      :plant="plant"
      :sectionName="sectionName"
      :selected="
        !!selectedPlantMetadata &&
        plant.Id === selectedPlantMetadata.plantData.Id &&
        sectionName === selectedPlantMetadata.sectionName
      "
      :idx="index"
      v-on:selected-plant="showPlantDetail($event)"
    />

    <div
      v-if="!showAll && !expanded && plants.length > previewLength"
      class="cursor-pointer flex flex-row justify-center items-center hover:bg-purple-100"
      @click.stop.prevent="showAll = true"
    >
      <span class="text-gray-500 p-2">{{ plants.length - previewLength }}&nbsp;MORE</span>
    </div>
  </div>
</template>

<script lang="ts">
import PlantSearchResultPreview from "@/components/search/plant-search/PlantSearchResultPreview.vue";
import { IIndexedPlantData, IPluginState } from "@/interfaces";
import { PLANTS_TAB_REGEX } from "@/modules/page-manager/consts";
import { ISelectedPlantMetadata, searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { IPluginAuthState } from "@/store/page-overlay/modules/plugin-auth/interfaces";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "PlantSearchResultsGroup",
  store,
  components: { PlantSearchResultPreview },
  data(): {
    destroyed$: Subject<void>;
    selectedPlantMetadata: ISelectedPlantMetadata | null;
    showAll: boolean;
  } {
    return {
      destroyed$: new Subject(),
      selectedPlantMetadata: null,
      showAll: false,
    };
  },
  props: {
    sectionName: String,
    plants: Array as () => IIndexedPlantData[],
    plantFilterIdentifier: String,
    sectionPriority: Number,
    expanded: Boolean,
    previewLength: Number,
  },
  watch: {
    plants: {
      immediate: true,
      handler(newValue, oldValue) {
        searchManager.selectedPlant
          .asObservable()
          .pipe(take(1))
          .subscribe((plantMetadata) => {
            if (
              newValue.length > 0 &&
              !newValue.find((x: any) => x.Id === plantMetadata?.plantData.Id)
            ) {
              searchManager.maybeInitializeSelectedPlant(
                newValue[0],
                this.sectionName,
                this.sectionPriority
              );
            }
          });
      },
    },
  },
  computed: {
    ...mapState<IPluginState>({
      queryString: (state: IPluginState) => state.search.queryString,
    }),
    isOnPlantsPage(): boolean {
      return !!window.location.pathname.match(PLANTS_TAB_REGEX);
    },
    visiblePlants(): IIndexedPlantData[] {
      return this.expanded || this.$data.showAll
        ? this.plants
        : this.plants.slice(0, this.previewLength);
    },
    groupIcon(): string {
      switch (this.plantFilterIdentifier) {
        case "label":
          return "tags";
        case "strainName":
          return "cannabis";
        case "locationName":
          return "map-marker-alt";
        default:
          return "boxes";
      }
    },
    disableFilter(): boolean {
      return !this.plantFilterIdentifier || this.plantFilterIdentifier === "label";
    },
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    showPlantDetail(plantData: IIndexedPlantData) {
      // TODO debounce this to improve mouseover accuracy
      searchManager.selectedPlant.next({
        plantData,
        sectionName: this.sectionName,
        priority: this.sectionPriority,
      });
    },
    applyFilter() {
      if (this.disableFilter) {
        return;
      }

      this.$store.dispatch(
        `plantSearch/${PlantSearchActions.PARTIAL_UPDATE_PLANT_SEARCH_FILTERS}`,
        {
          plantSearchFilters: {
            [this.plantFilterIdentifier]: this.$store.state.search.queryString,
          },
        }
      );

      this.setShowSearchResults({ showSearchResults: false });
    },
  },
  created() {
    searchManager.selectedPlant
      .asObservable()
      .pipe(takeUntil(this.$data.destroyed$))
      .subscribe(
        (selectedPlantMetadata) => (this.$data.selectedPlantMetadata = selectedPlantMetadata)
      );
  },
  beforeDestroy() {
    this.$data.destroyed$.next(null);
  },
});
</script>
