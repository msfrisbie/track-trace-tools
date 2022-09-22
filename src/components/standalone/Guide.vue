<template>
  <div style="height: 100vh">
    <div class="flex flex-col p-4 space-y-6" style="height: 100%; overflow-y: auto">
      <div class="flex flex-row justify-between items-center">
        <title-banner />

        <div class="text-center text-gray-500">v{{ version }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import TitleBanner from "@/components/shared/TitleBanner.vue";
import { version } from "@/modules/version";
import Vue from "vue";
import router from "./router";

export default Vue.extend({
  name: "Guide",
  router,
  props: {},
  components: {
    TitleBanner,
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
