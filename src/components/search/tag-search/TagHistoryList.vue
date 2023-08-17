<template>
  <div class="flex flex-col">
    <div
      @click="setSearch(query)"
      class="flex flex-row items-center space-x-4 py-2 px-3 cursor-pointer hover:bg-purple-200 text-lg"
      v-for="query in queryStringHistory"
      :key="query"
    >
      <font-awesome-icon class="text-gray-300" :icon="['far', 'clock']" />

      <span>{{ query }}</span>
    </div>

    <template v-if="queryStringHistory.length === 0">
      <span class="text-gray-500 p-4">Search history will appear here</span>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import Vue from "vue";
import { mapState } from "vuex";
export default Vue.extend({
  name: "TagHistoryList",
  store,
  methods: {
    setSearch(queryString: string) {
      store.dispatch(`search/${SearchActions.SET_QUERY_STRING}`, { queryString });
      analyticsManager.track(MessageType.CLICKED_RECENT_TAG_QUERY, {
        queryString,
      });
    },
  },
  computed: {
    ...mapState<IPluginState>({
      queryStringHistory: (state: IPluginState) => state.search.queryStringHistory,
    }),
  },
});
</script>
