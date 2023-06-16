<template>
  <!-- animation is breaking modal, disable -->
  <b-modal
    id="search-modal"
    modal-class="ttt-modal"
    size="xl"
    :static="true"
    no-fade
    centered
    hide-footer
    header-bg-variant="light"
    body-class="ttt-search-modal-body"
  >
    <unified-search-widget></unified-search-widget>
  </b-modal>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import Vue from "vue";
import UnifiedSearchWidget from "@/components/page-overlay/UnifiedSearchWidget.vue";

export default Vue.extend({
  name: "SearchModal",
  store,
  computed: {},
  components: {
    UnifiedSearchWidget,
  },
  methods: {},
  async mounted() {},
});
</script>
