<template>
  <div class="flex flex-col">
    <div
      @click="setSearch(query)"
      class="flex flex-row items-center space-x-4 py-2 px-3 cursor-pointer hover:bg-purple-200 text-lg"
      v-for="query in omniQueryStringHistory"
      :key="query"
    >
      <font-awesome-icon class="text-gray-300" :icon="['far', 'clock']" />

      <span>{{ query }}</span>
    </div>

    <template v-if="omniQueryStringHistory.length === 0">
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
import Vue from "vue";
import { mapActions, mapState } from "vuex";
export default Vue.extend({
  name: "OmniHistoryList",
  store,
  methods: {
    ...mapActions({
      setQueryString: `omniSearch/${OmniSearchActions.SET_QUERY_STRING}`
    }),
    setSearch(queryString: string) {
      // @ts-ignore
      // searchManager.omniQueryString.next(queryString);
      this.setQueryString({queryString});

      analyticsManager.track(MessageType.CLICKED_RECENT_OMNI_QUERY, {
        queryString,
      });
    },
  },
  computed: {
    ...mapState<IPluginState>({
      omniQueryStringHistory: (state: IPluginState) => state.omniSearch.omniQueryStringHistory,
    }),
  },
});
</script>
