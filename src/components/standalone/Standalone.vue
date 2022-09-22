<template>
  <router-view class="w-full flex flex-col items-stretch"></router-view>
</template>

<script lang="ts">
import Vue from "vue";
import VueRouter from "vue-router";
import { BootstrapVue } from "bootstrap-vue";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { MessageType } from "@/consts";
import { messageBus } from "@/modules/message-bus.module";
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
  methods: {}
});
</script>

<style type="text/scss" lang="scss">
@import "node_modules/bootstrap-vue/dist/bootstrap-vue";
@import "node_modules/bootstrap/dist/css/bootstrap";
@import "node_modules/tailwindcss/dist/base";
@import "node_modules/tailwindcss/dist/components";
@import "node_modules/tailwindcss/dist/utilities";

body {
}

html {
}
</style>
