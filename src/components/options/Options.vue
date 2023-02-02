<template>
  <div class="w-full flex flex-col gap-8 items-stretch h-full overflow-y-auto">
    <b-navbar type="light" class="bg-white">
      <b-navbar-brand href="#/">
        <title-banner />
      </b-navbar-brand>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item href="#/">Welcome</b-nav-item>
          <b-nav-item href="#/custom-features">Custom Features</b-nav-item>
          <b-nav-item href="#/faq">FAQ</b-nav-item>
          <b-nav-item href="#/changelog">Changelog</b-nav-item>
          <b-nav-item href="#/google-sheets">Google Sheets</b-nav-item>
          <b-nav-item href="#/license">License</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import TitleBanner from "@/components/shared/TitleBanner.vue";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { messageBus } from "@/modules/message-bus.module";
import { library } from "@fortawesome/fontawesome-svg-core";
import * as fontawesomeSolid from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { BootstrapVue } from "bootstrap-vue";
import Vue from "vue";
import VueRouter from "vue-router";
import router from "./router";

Vue.use(VueRouter);
Vue.use(BootstrapVue);

Vue.component("font-awesome-icon", FontAwesomeIcon);
library.add(
  // @ts-ignore
  fontawesomeSolid.faSignOutAlt
);

export default Vue.extend({
  name: "Options",
  router,
  components: {
    TitleBanner,
  },
  async mounted() {
    messageBus.init();

    analyticsManager.track(MessageType.VIEWED_STANDALONE_PAGE, {
      url: window.location.href,
    });
  },
  methods: {},
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

body {
  font-family: "Roboto", sans-serif;
}
</style>
