<template>
  <div class="hide-scrollbar grid grid-cols-2" style="height: 100%; grid-template-rows: auto 1fr">
    <template v-if="transferQueryString.length > 0">
      <div
        class="
          col-span-2
          flex flex-row
          items-center
          space-x-2
          p-4
          border-blue-300 border-b
        "
      >
        <p class="text-lg text-gray-600">
          <span class="font-bold text-gray-900">{{ transferQueryString }}</span>
          matches {{ transfers.length }} transfers
        </p>

        <div class="flex-grow"></div>

        <template v-if="inflight">
          <b-spinner class="ttt-purple mr-2" />
        </template>
      </div>
    </template>

    <template v-if="transferQueryString.length > 0">
      <div class="flex flex-col overflow-y-auto bg-blue-50">
        <transfer-result-groups :transfers="transfers" />

        <div class="flex-grow border-blue-300"></div>
      </div>

      <div class="flex flex-col overflow-y-auto">
        <transfer-search-result-detail />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col overflow-y-auto col-span-2">
        <transfer-history-list />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { MutationType } from "@/mutation-types";
import { IIndexedTransferData } from "@/interfaces";
import { MessageType, TransferFilterIdentifiers, TransferState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import TransferSearchResultDetail from "@/components/transfer-search-widget/TransferSearchResultDetail.vue";
import TransferResultGroups from "@/components/transfer-search-widget/TransferResultGroups.vue";
import TransferHistoryList from "@/components/transfer-search-widget/TransferHistoryList.vue";
import { searchManager } from "@/modules/search-manager.module";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { mapState } from "vuex";

export default Vue.extend({
  name: "TransferSearchResults",
  store,
  components: {
    TransferSearchResultDetail,
    TransferResultGroups,
    TransferHistoryList
  },
  props: {
    transfers: Array as () => IIndexedTransferData[],
    inflight: Boolean
  },
  watch: {
    transfers: {
      immediate: true,
      handler(newValue, oldValue) {}
    }
  },
  methods: {},
  computed: {
    ...mapState(["transferQueryString"])
  }
});
</script>

<style scoped type="text/scss" lang="scss"></style>
