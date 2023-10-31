<template>
  <div class="ttt-wrapper package-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <div v-if="searchState.showSearchResults" class="relative">
            <div class="search-bar flex absolute w-full flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <package-search-results
                  :packages="packageSearchState.packages"
                  :inflight="packageSearchState.searchInflight"
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
import {
  debounceTime, filter, startWith, tap
} from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";

export default Vue.extend({
  name: "PackageSearchWidget",
  store,
  components: {
    PackageSearchResults,
    PackageSearchFilters,
  },
  data() {
    return {};
  },
  async mounted() {},
  computed: {
    ...mapState<IPluginState>({
      packageSearchState: (state: IPluginState) => state.packageSearch,
      searchState: (state: IPluginState) => state.search,
    }),
  },
  methods: {
    ...mapActions({}),
  },
  watch: {
    "searchState.showSearchResults": {
      immediate: true,
      handler(newValue: boolean, oldValue: boolean) {
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

body.package-search-hidden .package-search {
  display: none;
}
</style>
