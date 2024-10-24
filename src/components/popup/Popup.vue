<template>
  <div class="flex flex-col items-stretch p-4 space-y-6 w-96">
    <div class="flex flex-row justify-center items-center">
      <title-banner />
    </div>

    <!-- <ttt-permissions-button /> -->
    <o-auth-login></o-auth-login>

    <div class="p-2 flex flex-col items-stretch gap-2">
      <!-- <b-button
        variant="outline-primary"
        @click="openOptions('#/plus')"
        class="flex flex-row gap-2 justify-center items-center"
      >
        <font-awesome-icon icon="plus-circle"></font-awesome-icon><span>T3+</span>
      </b-button> -->

      <b-button variant="outline-primary" @click="openOptions()"
        class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="info-circle"></font-awesome-icon><span>ABOUT</span>
      </b-button>
    </div>

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
  fontawesomeSolid.faPlusCircle,
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
    async openOptions(path = "") {
      window.open(await chrome.runtime.getURL(TRACK_TRACE_TOOLS_STANDALONE_PAGE + path), "_blank");
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/extension-page-shared";
</style>
