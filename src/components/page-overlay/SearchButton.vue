<template>
  <b-button id="search-popover-target" variant="light" title="Search" @click="openSearch($event)">
    <!-- class="bg-gray-50 hover:bg-gray-200 rounded-full shadow-2xl border border-gray-400 h-16 w-16 flex items-center justify-center cursor-pointer" -->

    <font-awesome-icon icon="search" size="2x" />

    <b-popover
      target="search-popover-target"
      triggers="hover"
      placement="top"
      variant="primary"
      ref="search-popover"
      :disabled="trackedInteractions.dismissedSearchPopover"
      container="popover-container"
    >
      <template #title>
        <span class="text-base">New: <b>Unified Search</b></span>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Search packages, transfers, and tags from one simple interface.</p>

        <p>To quick open, press <b>Alt + s</b></p>

        <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissSearchPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import { ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "SearchButton",
  store,
  data() {
    return {};
  },
  computed: mapState(["trackedInteractions", "settings"]),
  methods: {
    dismissSearchPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(this.$store.state.trackedInteractions));

      trackedInteractions.dismissedSearchPopover = true;

      // @ts-ignore
      this.$refs["search-popover"].$emit("close");
      // @ts-ignore
      this.$refs["search-popover"].$emit("disable");

      this.$store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openSearch() {
      modalManager.dispatchModalEvent(ModalType.SEARCH);
    },
  },
});
</script>
