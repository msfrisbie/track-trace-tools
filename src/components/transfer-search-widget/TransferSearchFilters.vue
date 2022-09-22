<template>
  <div v-show="isOnTransfersPage" v-if="hasManifestNumberFilter" class="flex flex-row gap-2">
    <b-button-group v-if="hasManifestNumberFilter">
      <b-button size="sm" variant="light" disabled
        >Manifest #:
        <span class="metrc-tag">{{ transferSearchFilters.manifestNumber }}</span>
      </b-button>
      <b-button size="sm" variant="light" @click="clearTransferManifestNumberFilter"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group>
      <b-button size="sm" variant="danger" @click="clearMetrcSearch">RESET FILTERS</b-button>
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { ITransferSearchFilters } from "@/interfaces";
import { pageManager, TRANSFER_TAB_REGEX } from "@/modules/page-manager.module";
import { mapState } from "vuex";
import { TransferFilterIdentifiers } from "@/consts";
import { MutationType } from "@/mutation-types";

interface ComponentData {
  transferSearchFilters: ITransferSearchFilters;
}

export default Vue.extend({
  name: "TransferSearchFilters",
  store,
  computed: {
    isOnTransfersPage() {
      return window.location.pathname.match(TRANSFER_TAB_REGEX);
    },
    hasManifestNumberFilter() {
      return !!this.$store.state.transferSearchFilters.manifestNumber;
    },
    ...mapState(["transferSearchFilters"])
  },
  methods: {
    clearTransferManifestNumberFilter() {
      pageManager.setTransferFilter(TransferFilterIdentifiers.ManifestNumber, "");
    },
    clearMetrcSearch() {
      pageManager.resetMetrcTransferFilters();
    }
  },
  async mounted() {
    if (!this.isOnTransfersPage) {
      this.$store.commit(MutationType.SET_TRANSFER_SEARCH_FILTERS, {});
    }
  }
});
</script>
