<template>
  <div
    class="hide-scrollbar grid grid-cols-6 grid-rows-3 h-full"
    style="grid-template-rows: auto auto 1fr"
  >
    <template v-if="searchState.queryString.length > 0">
      <search-view-selector />

      <div class="col-span-6 flex flex-row items-center space-x-2 p-4 border-purple-300 border-b">
        <p class="text-lg text-gray-600">
          <span class="font-bold text-gray-900">{{ searchState.queryString }}</span>
          matches {{ transfers.length }}{{ transfers.length === 500 ? "+" : "" }} transfers
        </p>

        <div class="flex-grow"></div>

        <template v-if="inflight">
          <b-spinner class="ttt-purple mr-2" />
        </template>
      </div>
    </template>

    <template v-if="searchState.queryString.length > 0">
      <div class="flex flex-col overflow-y-auto bg-purple-50 col-span-3">
        <transfer-result-groups :transfers="transfers" />

        <div class="flex-grow bg-purple-50"></div>
      </div>

      <div class="flex flex-col overflow-y-auto col-span-3">
        <transfer-search-result-detail />
      </div>
    </template>

    <template v-else>
      <div class="col-span-6">
        <!-- Top row is sized "auto", so this placeholer is needed -->
      </div>

      <div class="flex flex-col overflow-y-auto col-span-6">
        <history-list />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import TransferHistoryList from "@/components/search/transfer-search/TransferHistoryList.vue";
import TransferResultGroups from "@/components/search/transfer-search/TransferResultGroups.vue";
import TransferSearchResultDetail from "@/components/search/transfer-search/TransferSearchResultDetail.vue";
import { IIndexedTransferData, ITransferData, IPluginState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import HistoryList from "@/components/search/shared/HistoryList.vue";
import SearchViewSelector from "@/components/search/shared/SearchViewSelector.vue";

export default Vue.extend({
  name: "TransferSearchResults",
  store,
  components: {
    TransferSearchResultDetail,
    TransferResultGroups,
    HistoryList,
    SearchViewSelector,
  },
  data() {
    return {};
  },
  props: {
    transfers: Array as () => IIndexedTransferData[],
    inflight: Boolean,
  },
  methods: {
    ...mapActions({
      partialUpdateTransferSearchFilters: `transferSearch/${TransferSearchActions.PARTIAL_UPDATE_TRANSFER_SEARCH_FILTERS}`,
      setTransferSearchFilters: `transferSearch/${TransferSearchActions.SET_TRANSFER_SEARCH_FILTERS}`,
    }),
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      transferSearchState: (state: IPluginState) => state.transferSearch,
      searchState: (state: IPluginState) => state.search,
    }),
    ...mapGetters({}),
    filtersApplied() {
      return (
        Object.values(this.$store.state.transferSearchState.transferSearchFilters || {}).filter(
          (x) => !!x
        ).length > 0
      );
    },
  },
});
</script>

<style scoped type="text/scss" lang="scss"></style>
