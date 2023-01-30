<template>
  <div class="flex flex-col items-stretch p-4 space-y-6 w-96">
    <div class="flex flex-row justify-center items-center">
      <title-banner />
    </div>

    <!-- <ttt-permissions-button /> -->
    <o-auth-login></o-auth-login>

    <b-button
      variant="outline-primary"
      @click="openStandalone()"
      class="flex flex-row gap-2 justify-center items-center"
    >
      <font-awesome-icon icon="info-circle"></font-awesome-icon><span>ABOUT</span>
    </b-button>

    <!-- <b-button variant="outline-primary" style="opacity: 0.5"
      >LICENSE</b-button
    > -->

    <div class="text-center text-gray-500">v{{ version }}</div>
  </div>
</template>

<script lang="ts">
import OAuthLogin from "@/components/shared/OAuthLogin.vue";
import TitleBanner from "@/components/shared/TitleBanner.vue";
import { TRACK_TRACE_TOOLS_STANDALONE_PAGE } from "@/consts";
import { messageBus } from "@/modules/message-bus.module";
import { version } from "@/modules/version";
import { library } from "@fortawesome/fontawesome-svg-core";
import * as fontawesomeSolid from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { BootstrapVue } from "bootstrap-vue";
import Vue from "vue";

Vue.use(BootstrapVue);

Vue.component("font-awesome-icon", FontAwesomeIcon);
library.add(
  // @ts-ignore
  fontawesomeSolid.faInfoCircle,
  fontawesomeSolid.faSignOutAlt
);

export default Vue.extend({
  name: "Popup",
  components: {
    TitleBanner,
    OAuthLogin,
  },
  data() {
    return {
      version,
    };
  },
  async mounted() {
    messageBus.init();
  },
  methods: {
    async enableAccountPermissions() {},
    async openStandalone() {
      window.open(await browser.runtime.getURL(TRACK_TRACE_TOOLS_STANDALONE_PAGE), "_blank");
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/bootstrap-theme";

@import "node_modules/tailwindcss/dist/base";
@import "node_modules/tailwindcss/dist/components";
@import "node_modules/tailwindcss/dist/utilities";

@import "@/scss/bootstrap-override";

@import "@/scss/misc";
@import "@/scss/fonts";

html {
  /* Firefox doesnt seem to collapse, this allows for cross-browser compat */
  min-width: 300px;
}

body {
  font-family: "Roboto", sans-serif;
}
</style>
