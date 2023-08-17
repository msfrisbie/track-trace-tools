<template>
  <b-button
    id="search-popover-target"
    variant="primary"
    title="Search"
    @click="openSearch($event)"
    style="padding: 0"
  >
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      <font-awesome-icon icon="search" style="height: 26px"></font-awesome-icon>
    </div>

    <b-popover
      target="search-popover-target"
      triggers="hover"
      placement="top"
      variant="light"
      ref="search-popover"
      :disabled="trackedInteractions.dismissedSearchPopover"
      container="popover-container"
    >
      <template #title>
        <span class="text-base">New: <b>Search v2</b></span>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Search from anywhere in Metrc.</p>

        <div class="flex flex-row items-center space-x-1 p-1 text-gray-500">
          <span>Windows:</span>
          <b-badge class="shadow-xl" variant="light">Alt</b-badge>
          <span>+</span>
          <b-badge class="shadow-xl" variant="light">s</b-badge>
        </div>

        <div class="flex flex-row items-center space-x-1 p-1 text-gray-500">
          <span>Mac:</span>
          <b-badge class="shadow-xl" variant="light">option</b-badge>
          <span>+</span>
          <b-badge class="shadow-xl" variant="light">s</b-badge>
        </div>

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
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedSearchPopover = true;

      // @ts-ignore
      this.$refs["search-popover"].$emit("close");
      // @ts-ignore
      this.$refs["search-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openSearch() {
      modalManager.dispatchModalEvent(ModalType.SEARCH);
    },
  },
});
</script>
