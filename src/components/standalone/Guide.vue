<template>
  <div style="height: 100vh">

    <div class="flex flex-col p-4 space-y-6" style="height: 100%; overflow-y: auto">
      <div class="flex flex-row justify-between items-center">
        <title-banner />

        <div class="text-center text-gray-500">v{{ version }}</div>
      </div>

      <b-card no-body class="flex-grow">
        <b-tabs pills card vertical class="flex-grow" active-nav-item-class="ttt-purple-bg">
          <welcome active></welcome>

          <custom-features></custom-features>

          <faq></faq>

          <changelog></changelog>

          <license></license>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import TitleBanner from "@/components/shared/TitleBanner.vue";
import { version } from "@/modules/version";
import Vue from "vue";
import router from "./router";
import Changelog from "./tabs/Changelog.vue";
import CustomFeatures from "./tabs/CustomFeatures.vue";
import Faq from "./tabs/Faq.vue";
import License from "./tabs/License.vue";
import Welcome from "./tabs/Welcome.vue";

export default Vue.extend({
  name: "Guide",
  router,
  props: {},
  components: {
    TitleBanner,
    Faq,
    CustomFeatures,
    License,
    Changelog,
    Welcome,
  },
  computed: {},
  data() {
    return {
      version,
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
