<template>
  <div class="ttt-wrapper plant-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <b-input-group size="md">
            <b-input-group-prepend
              @click="setShowPlantSearchResults({ showPlantSearchResults: true })"
              ><b-input-group-text class="search-icon">
                <font-awesome-icon icon="search" />
              </b-input-group-text>

              <search-picker-select />
            </b-input-group-prepend>

            <b-form-input
              v-model="queryString"
              type="text"
              placeholder="Tag #, strain, location..."
              autocomplete="off"
              @input="search($event)"
              @click="setShowPlantSearchResults({ showPlantSearchResults: true })"
              @focus="setShowPlantSearchResults({ showPlantSearchResults: true })"
              ref="search"
            ></b-form-input>

            <b-input-group-append v-if="queryString.length > 0">
              <b-button variant="light" @click="clearSearchField"
                ><font-awesome-icon icon="backspace"
              /></b-button>
            </b-input-group-append>
          </b-input-group>

          <!-- Anchor point for dropdown results card -->
          <div v-if="showPlantSearchResults" class="search-anchor">
            <div class="search-bar flex flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <plant-search-results :plants="plants" :inflight="inflight" />
              </div>

              <div
                class="flex flex-row items-center space-x-1 p-1 text-xs text-gray-500 border-purple-300 border-t"
              >
                <span>Press</span>
                <b-badge variant="light">esc</b-badge>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="my-4">
        <plant-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import PlantSearchFilters from "@/components/plant-search-widget/PlantSearchFilters.vue";
import PlantSearchResults from "@/components/plant-search-widget/PlantSearchResults.vue";
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { PlantSearchActions } from "@/store/page-overlay/modules/plant-search/consts";
import { combineLatest, Observable, of, timer } from "rxjs";
import { debounceTime, filter, startWith, tap } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "PlantSearchWidget",
  store,
  components: {
    PlantSearchResults,
    PlantSearchFilters,
    SearchPickerSelect,
  },
  data() {
    return {
      firstSearch: null,
      firstSearchResolver: null,
      searchInflight: false,
      indexInflight: false,
      showFilters: false,
      queryString: "",
      plants: [],
      filters: {
        license: null,
      },
    };
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.filters.license = authState.license;

    searchManager.init();

    document.addEventListener("keyup", (e) => {
      if (e.isTrusted && e.key === "Escape") {
        searchManager.setPlantSearchVisibility({ showPlantSearchResults: false });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        searchManager.setPlantSearchVisibility({ showPlantSearchResults: false });
      }
    });

    searchManager.plantIndexInFlight.subscribe((indexInflight: boolean) => {
      this.$data.indexInflight = indexInflight;
    });

    // Initialize
    searchManager.plantQueryString.next(this.$data.queryString);

    this.$data.firstSearch = new Promise((resolve) => {
      this.$data.firstSearchResolver = resolve;
    });
    // this.$data.firstSearch.then(() => searchManager.indexPlants());

    const queryString$: Observable<string> = searchManager.plantQueryString.asObservable().pipe(
      tap((queryString: string) => {
        this.$data.queryString = queryString;
      }),
      filter(
        (queryString: string) => queryString !== this.$store.state.plantSearch.plantQueryString
      ),
      debounceTime(500),
      tap((queryString: string) => {
        if (queryString) {
          analyticsManager.track(MessageType.ENTERED_PLANT_SEARCH_QUERY, {
            queryString,
          });
        }

        this.$data.plants = [];

        searchManager.selectedPlant.next(null);

        // This also writes to the search history,
        // so this must be after debounce
        this.setPlantQueryString({ plantQueryString: queryString });
      })
    );

    combineLatest([
      queryString$.pipe(
        filter((queryString: string) => !!queryString),
        startWith(this.$store.state.plantSearch?.plantQueryString || "")
      ),
      of(true),
    ]).subscribe(async ([queryString, plantIndexUpdated]: [string, boolean]) => {
      this.$data.searchInflight = true;

      if (queryString.length > 0) {
        this.$data.firstSearchResolver();
      }

      this.$data.plants = [];

      try {
        const promises: Promise<any>[] = [];

        promises.push(
          primaryDataLoader.onDemandFloweringPlantSearch({ queryString }).then((plants) => {
            // Flowering should appear first
            this.$data.plants = [...plants, ...this.$data.plants];
          })
        );
        promises.push(
          primaryDataLoader.onDemandVegetativePlantSearch({ queryString }).then((plants) => {
            // Veg should appear first
            this.$data.plants = [...plants, ...this.$data.plants];
          })
        );
        promises.push(
          primaryDataLoader.onDemandInactivePlantSearch({ queryString }).then((plants) => {
            // Flowering should appear first
            this.$data.plants = [...this.$data.plants, ...plants];
          })
        );

        const results = await Promise.allSettled(promises);

        if (results.find((promise) => promise.status === "rejected")) {
          throw new Error("Could not resolve all plant requests");
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.$data.searchInflight = false;
      }
    });

    if (this.$store.state.plantSearch.expandSearchOnNextLoad) {
      this.setExpandSearchOnNextLoad({
        expandSearchOnNextLoad: false,
      });

      searchManager.setPlantSearchVisibility({ showPlantSearchResults: true });
    }
  },
  computed: {
    ...mapState<IPluginState>({
      plantQueryString: (state: IPluginState) => state.plantSearch.plantQueryString,
      showPlantSearchResults: (state: IPluginState) => state.plantSearch.showPlantSearchResults,
    }),
    inflight() {
      return this.$data.searchInflight || this.$data.indexInflight;
    },
  },
  methods: {
    ...mapActions({
      setPlantQueryString: `plantSearch/${PlantSearchActions.SET_PLANT_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `plantSearch/${PlantSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
    async setShowPlantSearchResults({
      showPlantSearchResults,
    }: {
      showPlantSearchResults: boolean;
    }) {
      searchManager.setPlantSearchVisibility({ showPlantSearchResults });
    },
    search(queryString: string) {
      searchManager.setPlantSearchVisibility({ showPlantSearchResults: true });
      searchManager.plantQueryString.next(queryString);
    },
    clearSearchField() {
      searchManager.plantQueryString.next("");
    },
  },
  watch: {
    showPlantSearchResults: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue) {
          // @ts-ignore
          timer(500).subscribe(() => this.$refs.search?.$el.focus());
        }
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/search-widget";

body.plant-search-hidden .plant-search {
  display: none;
}
</style>
