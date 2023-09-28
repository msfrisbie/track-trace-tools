<template>
  <div class="ttt-wrapper tag-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">

          <!-- Anchor point for dropdown results card -->
          <div v-if="searchState.showSearchResults" class="relative">
            <div class="search-bar flex absolute w-full flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <tag-search-results
                  :tags="tagSearchState.tags"
                  :inflight="tagSearchState.searchInflight"
                />
              </div>

              <div
                v-if="!searchState.modalSearchOpen"
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
    // SearchPickerSelect,
  },
  data() {
    return {
    };
  },
  async mounted() {
  },
  computed: {
    ...mapState<IPluginState>({
      tagSearchState: (state: IPluginState) => state.tagSearch,
      searchState: (state: IPluginState) => state.search,
    }),
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      setQueryString: `search/${SearchActions.SET_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `search/${SearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
    async setShowSearchResults({ showSearchResults }: { showSearchResults: boolean }) {
      this.setShowSearchResults({ showSearchResults });
    },
    search(queryString: string) {
      this.setShowSearchResults({ showSearchResults: true });
      this.setQueryString({ queryString });
    },
    clearSearchField() {
      this.setQueryString({ queryString: "" });
    },
  },
  watch: {
    "searchState.showSearchResults": {
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
