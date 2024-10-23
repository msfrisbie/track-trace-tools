<template>
  <div class="ttt-wrapper flex flex-col items-stretch" v-bind:class="{
    'inline-search': !modalSearch,
    'modal-search': modalSearch,
    'search-expanded': searchState.showSearchResults,
    'search-collapsed': !searchState.showSearchResults,
  }">
    <div v-on:click.stop.prevent class="flex flex-col flex-grow">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <div class="flex">
          <input v-bind:style="{
            borderBottomRightRadius: searchState.showSearchResults ? '0 !important' : 'inherit',
            borderBottomLeftRadius: searchState.showSearchResults ? '0 !important' : 'inherit',
          }" style="margin-bottom: 0" v-model="queryString" type="search" id="default-search"
            class="block w-full px-6 py-2 pl-12 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Packages, plants, plant batches, tags, transfers, sales, items, strains" autocomplete="off"
            @input="setQueryString({ queryString: $event.target.value })"
            @click="setShowSearchResults({ showSearchResults: true })"
            @focus="setShowSearchResults({ showSearchResults: true })" ref="search" />
        </div>
        <div v-if="searchState.queryString.length > 0 && searchState.showSearchResults"
          class="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3">
          <font-awesome-icon @click="setQueryString({ queryString: '' })"
            class="w-5 h-5 text-gray-500 dark:text-gray-400" icon="backspace" />
        </div>
      </div>
    </div>

    <grid-filters v-if="!searchState.showSearchResults"></grid-filters>

    <template v-if="searchState.showSearchResults && (!searchState.modalSearchOpen || modalSearch)">
      <div class="ttt-wrapper t3-search" v-on:click.stop.prevent>
        <div class="relative">
          <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
            <div v-if="searchState.showSearchResults" class="relative">
              <div class="search-bar flex absolute w-full flex-col bg-white rounded-b-md" style="height: 85vh">
                <div class="flex-grow overflow-y-auto">
                  <div class="hide-scrollbar grid grid-rows-3 grid-cols-2 h-full min-h-screen"
                    style="grid-template-columns: 36rem 1fr; grid-template-rows: min-content auto 1fr">
                    <template v-if="searchState.queryString.length > 0">
                      <div class="col-span-2 flex flex-col items-stretch">
                        <div class="flex flex-row items-center space-x-2 py-2 px-4 border-purple-300 border-b">
                          <template v-if="searchState.status === SearchStatus.INFLIGHT">
                            <b-spinner class="ttt-purple mr-2" />
                          </template>

                          <p class="text-lg text-gray-600">
                            <span class="font-semibold text-purple-600">{{ searchState.searchResults.length }}</span>
                            results for <span class="font-semibold text-gray-900">{{
                              searchState.queryString }}</span>
                          </p>

                          <search-control-panel
                            :class="{ 'pt-2': true, 'bg-red-300': highlightControlPanel }"></search-control-panel>

                          <div class="flex-grow"></div>
                        </div>
                      </div>

                      <div class="flex flex-col overflow-y-auto bg-gray-50 min-h-screen">

                        <div class="text-center text-sm px-4 py-1">Not finding what you need? <b-button size="sm"
                            variant="link" class="underline font-bold" @click="enableHighlightControlPanel()">Adjust
                            your search filters</b-button>
                        </div>

                        <search-result-preview v-for="(searchResult, idx) in searchState.searchResults" v-bind:key="idx"
                          :searchResult="searchResult"></search-result-preview>

                        <div class="flex-grow bg-gray-50"></div>
                      </div>

                      <div class="flex flex-col overflow-y-auto">
                        <div class="pl-24">
                          <search-result-detail></search-result-detail>
                        </div>
                      </div>
                    </template>

                    <template v-else>
                      <div class="col-span-2">
                        <!-- Top row is sized "auto", so this placeholer is needed -->
                      </div>

                      <div class="grid grid-cols-2 overflow-y-auto col-span-2 gap-2"
                        style="grid-template-columns: 240px 1fr;">
                        <history-list />

                        <search-control-panel class="bg-white border-b border-gray-200 "></search-control-panel>
                      </div>
                    </template>
                  </div>
                </div>

                <div v-if="!searchState.modalSearchOpen"
                  class="flex flex-row items-center space-x-1 p-1 text-xs text-gray-500 border-purple-300 border-t">
                  <span>Press</span>
                  <b-badge variant="light">esc</b-badge>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import GridFilters from "@/components/search/shared/GridFilters.vue";
import HistoryList from "@/components/search/shared/HistoryList.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  SearchActions,
  SearchStatus,
  SearchType,
} from "@/store/page-overlay/modules/search/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import SearchControlPanel from "./SearchControlPanel.vue";
import SearchResultDetail from "./SearchResultDetail.vue";
import SearchResultPreview from "./SearchResultPreview.vue";

export default Vue.extend({
  name: "UnifiedSearchWidget",
  store,
  router,
  props: {
    modalSearch: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  components: {
    HistoryList,
    SearchResultPreview,
    SearchResultDetail,
    GridFilters,
    SearchControlPanel
  },
  computed: {
    ...mapState<IPluginState>({
      searchState: (state: IPluginState) => state.search,
    }),
    inlineControlPanelDisplayed(): boolean {
      return this.$data.showInlineControlPanel && !store.state.search.showSearchResults;
    },
    queryString: {
      get(): string {
        return store.state.search.queryString;
      },
      set(queryString: string): void {
        this.setQueryString({ queryString });
      },
    },
  },
  data() {
    return {
      showInlineControlPanel: false,
      SearchType,
      SearchStatus,
      highlightControlPanel: false
    };
  },
  methods: {
    ...mapActions({
      setQueryString: `search/${SearchActions.SET_QUERY_STRING}`,
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    setFocus() {
      setTimeout(() => {
        // @ts-ignore
        this.$refs.search.focus();
      }, 100);
    },
    enableHighlightControlPanel() {
      this.$data.highlightControlPanel = true;

      setTimeout(() => {
        this.$data.highlightControlPanel = false;
      }, 1000);
    }
  },
  watch: {
    "searchState.showSearchResults": {
      immediate: true,
      handler(newValue: boolean, oldValue: boolean) {
        if (newValue) {
          // this.setFocus();
        }
      },
    },
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss">
.max-z {
  position: fixed !important;
  width: 100% !important;
  z-index: 1000000 !important;
  top: 0 !important;
  left: 0 !important;
  height: 0 !important;
}

.modal-search {
  max-width: 100% !important;
}

.inline-search.search-expanded {
  max-width: 100% !important;
}

.inline-search.search-collapsed {
  max-width: 480px !important;
}
</style>
