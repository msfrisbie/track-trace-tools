<template>
  <div class="flex flex-col">
    <div
      @click="setSearch(query)"
      class="
        flex flex-row
        items-center
        space-x-4
        py-2 px-3
        cursor-pointer
        hover:bg-blue-200
        text-lg
      "
      v-for="query in transferQueryStringHistory"
      :key="query"
    >
      <font-awesome-icon class="text-gray-300" :icon="['far', 'clock']" />

      <span>{{ query }}</span>
    </div>

    <template v-if="transferQueryStringHistory.length === 0">
      <span class="text-gray-500 p-4">Search history will appear here</span>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { searchManager } from "@/modules/search-manager.module";
import { mapState } from "vuex";
export default Vue.extend({
  name: "transferHistoryList",
  store,
  methods: {
    setSearch(queryString: string) {
      // @ts-ignore
      searchManager.transferQueryString.next(queryString);
      analyticsManager.track(MessageType.CLICKED_RECENT_TRANSFER_QUERY, {
        queryString
      });
    }
  },
  computed: {
    ...mapState(["transferQueryStringHistory"])
  }
});
</script>
