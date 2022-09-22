<template>
  <!-- animation is breaking modal, disable -->
  <b-modal
    id="debug-modal"
    modal-class="ttt-modal"
    content-class="ttt-content"
    dialog-class="ttt-dialog"
    size="xl"
    :static="true"
    no-fade
    centered
    hide-header
    ok-only
  >
    <debug-form />
  </b-modal>
</template>

<script lang="ts">
import DebugForm from "@/components/page-overlay/forms/DebugForm.vue";
import Vue from "vue";

export default Vue.extend({
  components: { DebugForm },
  name: "DebugModal",
  data() {
    return {};
  },
  methods: {
    show() {
      this.$bvModal.show("debug-modal");
    },
  },
  async mounted() {},
});
</script>
