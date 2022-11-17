<template>
  <router-view class="w-full flex flex-col items-stretch"></router-view>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { messageBus } from "@/modules/message-bus.module";
import { BootstrapVue } from "bootstrap-vue";
import Vue from "vue";
import VueRouter from "vue-router";
import router from "./router";

Vue.use(VueRouter);
Vue.use(BootstrapVue);

export default Vue.extend({
  name: "Standalone",
  router,
  components: {},
  async mounted() {
    messageBus.init();
    analyticsManager.track(MessageType.VIEWED_STANDALONE_PAGE);
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
