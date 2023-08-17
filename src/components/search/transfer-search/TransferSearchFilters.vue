<template>
  <div
    v-show="isOnTransfersPage"
    v-if="transferSearchFilters.manifestNumber"
    class="flex flex-row gap-2"
  >
    <b-button-group v-if="transferSearchFilters.manifestNumber">
      <b-button size="sm" variant="light" disabled
        >Manifest #:
        <span class="metrc-tag">{{ transferSearchFilters.manifestNumber }}</span>
      </b-button>
      <b-button size="sm" variant="light" @click="clearTransferManifestNumberFilter()"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group>
      <b-button size="sm" variant="danger" @click="clearMetrcSearch()">RESET FILTERS</b-button>
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { IPluginState, ITransferSearchFilters } from "@/interfaces";
import { TRANSFER_TAB_REGEX } from "@/modules/page-manager/consts";
import { mapState } from "vuex";
import { TransferFilterIdentifiers } from "@/consts";
import { MutationType } from "@/mutation-types";
import { pageManager } from "@/modules/page-manager/page-manager.module";

export default Vue.extend({
  name: "TransferSearchFilters",
  store,
  computed: {
    ...mapState<IPluginState>({
      transferSearchFilters: (state: IPluginState) => state.transferSearch.transferSearchFilters,
    }),
    isOnTransfersPage() {
      return window.location.pathname.match(TRANSFER_TAB_REGEX);
    },
  },
  methods: {
    clearTransferManifestNumberFilter() {
      pageManager.setTransferFilter(TransferFilterIdentifiers.ManifestNumber, "");
    },
    clearMetrcSearch() {
      pageManager.resetMetrcTransferFilters();
    },
  },
  async mounted() {},
});
</script>
