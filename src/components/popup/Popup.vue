<template>
  <div class="flex flex-col items-stretch p-4 space-y-6" style="min-width: 400px">
    <div class="flex flex-row justify-center items-center">
      <title-banner />
    </div>

    <!-- <ttt-permissions-button /> -->

    <b-button variant="outline-primary" @click="openStandalone()" style="opacity: 0.5"
      >LICENSE</b-button
    >

    <!-- <b-button variant="outline-primary" style="opacity: 0.5"
      >LICENSE</b-button
    > -->

    <div class="text-center text-gray-500">v{{ version }}</div>
  </div>
</template>

<script lang="ts">
import TitleBanner from "@/components/shared/TitleBanner.vue";
import { TRACK_TRACE_TOOLS_STANDALONE_PAGE } from "@/consts";
import { version } from "@/modules/version";
import { BootstrapVue } from "bootstrap-vue";
import Vue from "vue";

Vue.use(BootstrapVue);

export default Vue.extend({
  name: "Popup",
  components: {
    TitleBanner,
  },
  data() {
    return {
      version,
    };
  },
  async mounted() {},
  methods: {
    async enableAccountPermissions() {},
    async openStandalone() {
      window.open(await browser.runtime.getURL(TRACK_TRACE_TOOLS_STANDALONE_PAGE), "_blank");
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "node_modules/bootstrap-vue/dist/bootstrap-vue";
@import "node_modules/bootstrap/dist/css/bootstrap";
@import "node_modules/tailwindcss/dist/base";
@import "node_modules/tailwindcss/dist/components";
@import "node_modules/tailwindcss/dist/utilities";

html {
  /* Firefox doesnt seem to collapse, this allows for cross-browser compat */
  min-width: 300px;
}
</style>
