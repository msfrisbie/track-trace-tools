<template>
  <div class="flex flex-col justify-center align-center space-y-2">
    <div class="flex flex-row justify-center align-center space-x-2">
      <a href="https://www.trackandtrace.tools" target="_blank">
        <track-trace-tools-logo :inverted="true" fill="#49276a" />
      </a>

      <span class="text-gray-600 font-extralight tracking-widest text-4xl">T3</span>
    </div>
  </div>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "TitleBanner",
  store,
  components: {
    TrackTraceToolsLogo,
  },
  computed: mapState(["debugMode"]),
  async mounted() {},
});
</script>
