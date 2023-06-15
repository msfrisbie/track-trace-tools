<template>
  <div class="ttt-wrapper package-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <b-input-group size="md">
            <b-input-group-prepend
              @click="setShowPackageSearchResults({ showPackageSearchResults: true })"
              ><b-input-group-text class="search-icon">
                <font-awesome-icon icon="search" />
              </b-input-group-text>

              <search-picker-select />
            </b-input-group-prepend>

            <b-form-input
              v-model="queryString"
              type="text"
              placeholder="Tag #, item, location, harvest, strain..."
              autocomplete="off"
              @input="search($event)"
              @click="setShowPackageSearchResults({ showPackageSearchResults: true })"
              @focus="setShowPackageSearchResults({ showPackageSearchResults: true })"
              ref="search"
            ></b-form-input>

            <b-input-group-append v-if="queryString.length > 0">
              <b-button variant="light" @click="clearSearchField"
                ><font-awesome-icon icon="backspace"
              /></b-button>
            </b-input-group-append>
          </b-input-group>

          <!-- Anchor point for dropdown results card -->
          <div v-if="packageSearchState.showPackageSearchResults" class="search-anchor">
            <div class="search-bar flex flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <package-search-results :packages="packages" :inflight="searchInflight" />
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
        <package-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import PackageSearchFilters from "@/components/search/package-search/PackageSearchFilters.vue";
import PackageSearchResults from "@/components/search/package-search/PackageSearchResults.vue";
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { combineLatest, Observable, timer } from "rxjs";
import { debounceTime, filter, startWith, tap } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "PackageSearchWidget",
  store,
  components: {
    PackageSearchResults,
    PackageSearchFilters,
    SearchPickerSelect,
  },
  data() {
    return {
      firstSearch: null,
      firstSearchResolver: null,
      searchInflight: false,
      showFilters: false,
      queryString: "",
      packages: [],
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
        searchManager.setPackageSearchVisibility({ showPackageSearchResults: false });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        searchManager.setPackageSearchVisibility({ showPackageSearchResults: false });
      }
    });

    // Initialize
    searchManager.packageQueryString.next(this.$data.queryString);

    this.$data.firstSearch = new Promise((resolve) => {
      this.$data.firstSearchResolver = resolve;
    });

    const queryString$: Observable<string> = searchManager.packageQueryString.asObservable().pipe(
      tap((queryString: string) => {
        this.$data.queryString = queryString;
      }),
      filter(
        (queryString: string) => queryString !== this.$store.state.packageSearch.packageQueryString
      ),
      debounceTime(500),
      tap((queryString: string) => {
        if (queryString) {
          analyticsManager.track(MessageType.ENTERED_PACKAGE_SEARCH_QUERY, {
            queryString,
          });
        }

        this.$data.packages = [];

        searchManager.selectedPackage.next(null);

        // This also writes to the search history,
        // so this must be after debounce
        this.setPackageQueryString({ packageQueryString: queryString });
      })
    );

    combineLatest([
      queryString$.pipe(
        filter((queryString: string) => !!queryString),
        startWith(this.$store.state.packageSearch?.packageQueryString || "")
      ),
    ]).subscribe(async ([queryString]: [string]) => {
      this.$data.searchInflight = true;

      if (queryString.length > 0) {
        this.$data.firstSearchResolver();
      }

      this.$data.packages = [];

      await Promise.allSettled([
        primaryDataLoader.onDemandActivePackageSearch({ queryString }).then((result) => {
          this.$data.packages = [...this.$data.packages, ...result];
        }),
        primaryDataLoader.onDemandInTransitPackageSearch({ queryString }).then((result) => {
          this.$data.packages = [...this.$data.packages, ...result];
        }),
        primaryDataLoader.onDemandInactivePackageSearch({ queryString }).then((result) => {
          this.$data.packages = [...this.$data.packages, ...result];
        }),
      ]);

      this.$data.searchInflight = false;
    });

    if (this.$store.state.expandSearchOnNextLoad) {
      this.setExpandSearchOnNextLoad({
        expandSearchOnNextLoad: false,
      });

      searchManager.setPackageSearchVisibility({ showPackageSearchResults: true });
    }
  },
  computed: {
    ...mapState<IPluginState>({
      packageSearchState: (state: IPluginState) => state.packageSearch,
    }),
  },
  methods: {
    ...mapActions({
      setPackageQueryString: `packageSearch/${PackageSearchActions.SET_PACKAGE_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `packageSearch/${PackageSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
    async setShowPackageSearchResults({
      showPackageSearchResults,
    }: {
      showPackageSearchResults: boolean;
    }) {
      searchManager.setPackageSearchVisibility({ showPackageSearchResults });
    },
    search(queryString: string) {
      searchManager.setPackageSearchVisibility({ showPackageSearchResults: true });
      searchManager.packageQueryString.next(queryString);
    },
    clearSearchField() {
      searchManager.packageQueryString.next("");
    },
  },
  watch: {
    "packageSearchState.showPackageSearchResults": {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue) {
          timer(500).subscribe(() =>
            // @ts-ignore
            this.$refs.search?.$el.focus()
          );
        }
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/search-widget";

body.package-search-hidden .package-search {
  display: none;
}
</style>
