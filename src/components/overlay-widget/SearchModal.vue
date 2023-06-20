<template>
  <!-- animation is breaking modal, disable -->
  <b-modal
    id="search-modal"
    modal-class="ttt-modal"
    size="xl"
    :static="true"
    no-fade
    centered
    hide-header
    hide-footer
    content-class="ttt-content"
    dialog-class="ttt-dialog search-dialog"
    body-class="search-body flex flex-column-shim flex-col items-stretch"
    ref="search"
    @show="handleOpen()"
    @hidden="handleClose()"
  >
    <unified-search-widget ref="unifiedsearch" :modalSearch="true"></unified-search-widget>
  </b-modal>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import Vue from "vue";
import UnifiedSearchWidget from "@/components/page-overlay/UnifiedSearchWidget.vue";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";

export default Vue.extend({
  name: "SearchModal",
  store,
  computed: {},
  components: {
    UnifiedSearchWidget,
  },
  methods: {
    show() {
      this.$bvModal.show("search-modal");
    },
    hide() {
      this.$bvModal.hide("search-modal");
    },
    toggle() {
      // @ts-ignore
      this.$refs["search"].toggle();
    },
    handleOpen() {
      analyticsManager.track(MessageType.OPENED_SEARCH_MODAL);

      this.$store.state.search.modalSearchOpen = true;

      // @ts-ignore
      this.$refs.unifiedsearch!.setFocus();
    },
    handleClose() {
      analyticsManager.track(MessageType.CLOSED_SEARCH_MODAL);

      this.$store.state.search.modalSearchOpen = false;
    },
  },
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss">
.search-body {
  // If min-height is set, scroll doesn't work
  max-height: none !important;
  height: 92vh;
  overflow-y: auto;
  padding: 0 !important;
}

.search-header {
  // border-bottom: 0 !important;
  padding: 0 !important;
}

.search-dialog {
}

.search-footer {
  background-color: white !important;
}
</style>
