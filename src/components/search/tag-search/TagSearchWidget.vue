<template>
  <div class="ttt-wrapper tag-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <b-input-group size="md">
            <b-input-group-prepend @click="setShowSearchResults({ showSearchResults: true })"
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
              @click="setShowSearchResults({ showSearchResults: true })"
              @focus="setShowSearchResults({ showSearchResults: true })"
              ref="search"
            ></b-form-input>

            <b-input-group-append v-if="queryString.length > 0">
              <b-button variant="light" @click="clearSearchField"
                ><font-awesome-icon icon="backspace"
              /></b-button>
            </b-input-group-append>
          </b-input-group>

          <!-- Anchor point for dropdown results card -->
          <div v-if="tagSearchState.showSearchResults" class="search-anchor">
            <div class="search-bar flex flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <tag-search-results :tags="tags" :inflight="searchInflight" />
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
        <tag-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import TagSearchFilters from "@/components/search/tag-search/TagSearchFilters.vue";
import TagSearchResults from "@/components/search/tag-search/TagSearchResults.vue";
import { MessageType, TagState } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import { combineLatest, Observable, of, timer } from "rxjs";
import { debounceTime, filter, startWith, tap } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "TagSearchWidget",
  store,
  components: {
    TagSearchResults,
    TagSearchFilters,
    SearchPickerSelect,
  },
  data() {
    return {
      firstSearch: null,
      firstSearchResolver: null,
      searchInflight: false,
      showFilters: false,
      queryString: "",
      tags: [],
      filters: {
        license: null,
      },
    };
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.filters.license = authState.license;

    document.addEventListener("keyup", (e) => {
      if (e.isTrusted && e.key === "Escape") {
        this.setShowSearchResults({ showSearchResults: false });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        this.setShowSearchResults({ showSearchResults: false });
      }
    });

    // Initialize
    searchManager.tagQueryString.next(this.$data.queryString);

    this.$data.firstSearch = new Promise((resolve) => {
      this.$data.firstSearchResolver = resolve;
    });
    // this.$data.firstSearch.then(() => searchManager.indexTags());

    const queryString$: Observable<string> = searchManager.tagQueryString.asObservable().pipe(
      tap((queryString: string) => {
        this.$data.queryString = queryString;
      }),
      filter((queryString: string) => queryString !== this.$store.state.tagSearch.tagQueryString),
      debounceTime(500),
      tap((queryString: string) => {
        if (queryString) {
          analyticsManager.track(MessageType.ENTERED_TAG_SEARCH_QUERY, {
            queryString,
          });
        }

        this.$data.tags = [];

        searchManager.selectedTag.next(null);

        // This also writes to the search history,
        // so this must be after debounce
        this.setTagQueryString({ tagQueryString: queryString });
      })
    );

    combineLatest([
      queryString$.pipe(
        filter((queryString: string) => !!queryString),
        startWith(this.$store.state.tagSearch?.tagQueryString || "")
      ),
      of(true),
    ]).subscribe(async ([queryString, tagIndexUpdated]: [string, boolean]) => {
      this.$data.searchInflight = true;

      if (queryString.length > 0) {
        this.$data.firstSearchResolver();
      }

      this.$data.tags = [];

      await Promise.allSettled([
        primaryDataLoader
          .onDemandTagSearch({ queryString, tagState: TagState.AVAILABLE })
          .then((result) => {
            this.$data.tags = [...this.$data.tags, ...result];
          }),
        primaryDataLoader
          .onDemandTagSearch({ queryString, tagState: TagState.USED })
          .then((result) => {
            this.$data.tags = [...this.$data.tags, ...result];
          }),
        primaryDataLoader
          .onDemandTagSearch({ queryString, tagState: TagState.VOIDED })
          .then((result) => {
            this.$data.tags = [...this.$data.tags, ...result];
          }),
      ]);

      this.$data.searchInflight = false;
    });

    if (this.$store.state.expandSearchOnNextLoad) {
      this.setExpandSearchOnNextLoad({
        expandSearchOnNextLoad: false,
      });

      this.setShowSearchResults({ showSearchResults: true });
    }
  },
  computed: {
    ...mapState<IPluginState>({
      tagSearchState: (state: IPluginState) => state.tagSearch,
    }),
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      setTagQueryString: `tagSearch/${TagSearchActions.SET_TAG_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `tagSearch/${TagSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
    async setShowSearchResults({ showSearchResults }: { showSearchResults: boolean }) {
      this.setShowSearchResults({ showSearchResults });
    },
    search(queryString: string) {
      this.setShowSearchResults({ showSearchResults: true });
      searchManager.tagQueryString.next(queryString);
    },
    clearSearchField() {
      searchManager.tagQueryString.next("");
    },
  },
  watch: {
    "tagSearchState.showSearchResults": {
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

body.tag-search-hidden .tag-search {
  display: none;
}
</style>
