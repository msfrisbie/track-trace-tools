<template>
  <div class="ttt-wrapper package-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <div v-if="searchState.showSearchResults" class="relative">
            <div class="search-bar flex absolute w-full flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <div
                  class="hide-scrollbar grid grid-cols-6 grid-rows-3 h-full"
                  style="grid-template-rows: auto auto 1fr"
                >
                  <template v-if="searchState.queryString.length > 0">
                    <search-view-selector />

                    <!-- <div
                      class="col-span-6 flex flex-row items-center space-x-2 p-4 border-purple-300 border-b"
                    >
                      <p class="text-lg text-gray-600">
                        <span class="font-bold text-gray-900">{{ searchState.queryString }}</span>
                        matches {{ packages.length
                        }}{{ packages.length === 500 ? "+" : "" }} packages
                      </p>

                      <div class="flex-grow"></div>

                      <template v-if="inflight">
                        <b-spinner class="ttt-purple mr-2" />
                      </template>
                    </div> -->
                  </template>

                  <!-- <template v-if="searchState.queryString.length > 0">
                    <div class="flex flex-col overflow-y-auto bg-purple-50 col-span-3">
                      <package-result-groups :packages="packages" />

                      <div class="flex-grow bg-purple-50"></div>
                    </div>

                    <div class="flex flex-col overflow-y-auto col-span-3">
                      <package-search-result-detail />
                    </div>
                  </template> -->

                  <template v-else>
                    <div class="col-span-6">
                      <!-- Top row is sized "auto", so this placeholer is needed -->
                      Search goes here
                    </div>

                    <div class="flex flex-col overflow-y-auto col-span-6">
                      <history-list />
                    </div>
                  </template>
                </div>
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
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { IPluginState } from "@/interfaces";
import SearchViewSelector from "@/components/search/shared/SearchViewSelector.vue";
import { TransferPackageSearchActions } from "@/store/page-overlay/modules/transfer-package-search/consts";

export default Vue.extend({
  name: "TransferPackageSearchWidget",
  store,
  router,
  props: {},
  components: {
    SearchViewSelector,
  },
  computed: {
    ...mapState<IPluginState>({
      transferPackageSearchState: (state: IPluginState) => state.transferPackageSearch,
      searchState: (state: IPluginState) => state.search,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      executeSearch: `transferPackageSearch/${TransferPackageSearchActions.EXECUTE_SEARCH}`,
      stopSearch: `transferPackageSearch/${TransferPackageSearchActions.STOP_SEARCH}`,
      resetSearch: `transferPackageSearch/${TransferPackageSearchActions.RESET_SEARCH}`,
      updateSearchParameters: `transferPackageSearch/${TransferPackageSearchActions.UPDATE_SEARCH_PARAMETERS}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
