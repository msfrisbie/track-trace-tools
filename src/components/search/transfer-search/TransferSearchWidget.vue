<template>
  <div class="ttt-wrapper transfer-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <!-- Anchor point for dropdown results card -->
          <div v-if="searchState.showSearchResults" class="relative">
            <div class="search-bar flex absolute w-full flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <transfer-search-results
                  :transfers="transferSearchState.transfers"
                  :inflight="transferSearchState.searchInflight"
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
        <transfer-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import TransferSearchFilters from "@/components/search/transfer-search/TransferSearchFilters.vue";
import TransferSearchResults from "@/components/search/transfer-search/TransferSearchResults.vue";
import { MessageType, TransferState } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { databaseInterface } from "@/modules/database-interface.module";
import { searchManager } from "@/modules/search-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { combineLatest, Observable, timer } from "rxjs";
import {
  debounceTime, filter, startWith, tap
} from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "TransferSearchWidget",
  store,
  components: {
    TransferSearchResults,
    TransferSearchFilters,
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
      transferSearchState: (state: IPluginState) => state.transferSearch,
      searchState: (state: IPluginState) => state.search,
    }),
    queryString: {
      get(): string {
        return store.state.search.queryString;
      },
      set(queryString: string) {
        this.setQueryString({
          queryString,
        });
      },
    },
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      setQueryString: `search/${SearchActions.SET_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `search/${SearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
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
            this.$refs.search?.$el.focus());
        }
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/search-widget";

body.transfer-search-hidden .transfer-search {
  display: none;
}
</style>
