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
      <b-button variant="outline-primary" href="https://trackandtrace.tools/wiki" target="_blank"
        class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="book-open"></font-awesome-icon><span>T3 WIKI</span>
      </b-button>

      <b-button variant="outline-primary" href="https://trackandtrace.tools/api" target="_blank"
        class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="file"></font-awesome-icon><span>T3 API</span>
      </b-button>

      <b-button variant="outline-primary" href="https://trackandtrace.tools/community" target="_blank"
        class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="users"></font-awesome-icon><span>COMMUNITY</span>
      </b-button>

      <b-button variant="outline-primary"
        href="https://docs.google.com/forms/d/e/1FAIpQLSd2hQFwtXyv1Bco9nHN9d4tEqkgbhe3w-WdbZAemBCTD_19VQ/viewform?usp=sf_link"
        target="_blank" class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="exclamation-triangle"></font-awesome-icon><span>REPORT A PROBLEM</span>
      </b-button>

      <b-button variant="outline-primary" href="https://forms.gle/9J5UMXN4FkAZQ5wH9" target="_blank"
        class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="comment"></font-awesome-icon><span>SEND FEEDBACK</span>
      </b-button>

      <b-button variant="outline-primary" href="https://trackandtrace.tools/plus" target="_blank"
        class="flex flex-row gap-2 justify-center items-center">
        <font-awesome-icon icon="plus"></font-awesome-icon><span>T3+</span>
      </b-button>

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
  fontawesomeSolid.faSignOutAlt,
  fontawesomeSolid.faUsers,
  fontawesomeSolid.faExclamationTriangle,
  fontawesomeSolid.faComment,
  fontawesomeSolid.faFile,
  fontawesomeSolid.faPlus,
  fontawesomeSolid.faBookOpen
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
