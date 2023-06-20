<template>
  <div
    class="ttt-wrapper flex flex-col items-stretch"
    v-bind:class="{
      'inline-search': !modalSearch,
      'modal-search': modalSearch,
      'search-expanded': searchState.showSearchResults,
      'search-collapsed': !searchState.showSearchResults,
    }"
  >
    <div class="flex flex-row space-x-2">
      <div v-on:click.stop.prevent class="flex flex-col flex-grow">
        <!-- <b-input-group size="md" style=""> -->
        <!-- <b-input-group-prepend @click="setShowSearchResults({ showSearchResults: true })"
            ><b-input-group-text class="search-icon">
              <font-awesome-icon icon="search" />
            </b-input-group-text>

            <search-picker-select />
          </b-input-group-prepend> -->

        <!-- <b-form-input
          v-model="queryString"
          type="text"
          placeholder="Packages, plants, tags, transfers"
          autocomplete="off"
          @input="setQueryString({ queryString: $event })"
          @click="setShowSearchResults({ showSearchResults: true })"
          @focus="setShowSearchResults({ showSearchResults: true })"
          ref="search"
        ></b-form-input> -->

        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              aria-hidden="true"
              class="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <div class="flex">
            <input
              v-bind:style="{
                borderBottomRightRadius: searchState.showSearchResults ? '0 !important' : 'inherit',
                borderBottomLeftRadius: searchState.showSearchResults ? '0 !important' : 'inherit',
              }"
              v-model="queryString"
              type="search"
              id="default-search"
              class="block w-full px-6 py-2 pl-12 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Packages, plants, tags, transfers"
              autocomplete="off"
              @input="setQueryString({ queryString: $event.target.value })"
              @click="setShowSearchResults({ showSearchResults: true })"
              @focus="setShowSearchResults({ showSearchResults: true })"
              ref="search"
            />
          </div>
          <div
            v-if="searchState.queryString.length > 0 && searchState.showSearchResults"
            class="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <font-awesome-icon
              @click="setQueryString({ queryString: '' })"
              class="w-5 h-5 text-gray-500 dark:text-gray-400"
              icon="backspace"
            />
          </div>
          <!-- <button
            type="submit"
            class="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Search
          </button> -->
        </div>

        <!-- <b-input-group-append v-if="searchState.queryString.length > 0">
            <b-button variant="light" @click="setQueryString({ queryString: '' })"
              ><font-awesome-icon icon="backspace"
            /></b-button>
          </b-input-group-append>
        </b-input-group> -->
      </div>
    </div>

    <template v-if="!searchState.modalSearchOpen || modalSearch">
      <template v-if="searchType === 'PACKAGES'">
        <package-search-widget />
      </template>
      <template v-if="searchType === 'TRANSFERS'">
        <transfer-search-widget />
      </template>
      <template v-if="searchType === 'TAGS'">
        <tag-search-widget />
      </template>
      <template v-if="searchType === 'PLANTS'">
        <plant-search-widget />
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState, mapActions } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import TagSearchWidget from "@/components/search/tag-search/TagSearchWidget.vue";
import TransferSearchWidget from "@/components/search/transfer-search/TransferSearchWidget.vue";
import PackageSearchWidget from "@/components/search/package-search/PackageSearchWidget.vue";
import PlantSearchWidget from "@/components/search/plant-search/PlantSearchWidget.vue";
import { SearchActions, SearchType } from "@/store/page-overlay/modules/search/consts";
import { IPluginState } from "@/interfaces";
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";

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
    TagSearchWidget,
    TransferSearchWidget,
    PackageSearchWidget,
    PlantSearchWidget,
    // SearchPickerSelect,
  },
  computed: {
    ...mapState<IPluginState>({
      searchType: (state: IPluginState) => state.search.searchType,
      searchState: (state: IPluginState) => state.search,
    }),
    queryString: {
      get(): string {
        return this.$store.state.search.queryString;
      },
      set(queryString: string): void {
        this.setQueryString({ queryString });
      },
    },
  },
  data() {
    return {
      SearchType,
    };
  },
  methods: {
    ...mapActions({
      setSearchType: `search/${SearchActions.INITIALIZE_SEARCH_TYPE}`,
      setQueryString: `search/${SearchActions.SET_QUERY_STRING}`,
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    setFocus() {
      setTimeout(() => {
        // @ts-ignore
        this.$refs.search.focus();
      }, 100);
    },
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
  async created() {},
  async mounted() {},
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
