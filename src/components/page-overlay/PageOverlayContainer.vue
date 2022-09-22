<template>
  <div class="bg-gray-50 bottom-5 border border-gray-400" style="height: 100vh">
    <default-overlay-view />
  </div>

  <!-- <font-awesome-icon icon="user-secret" /> -->
</template>

<script lang="ts">
import DefaultOverlayView from "@/components/page-overlay/DefaultOverlayView.vue";
import Vue from "vue";

export default Vue.extend({
  name: "PageOverlayContainer",
  mounted() {
    // browser.runtime.sendMessage({});
  },
  computed: {
    defaultText() {
      // return browser.i18n.getMessage("extName");
      return "TTT";
    },
  },
  components: { DefaultOverlayView },
});
</script>
