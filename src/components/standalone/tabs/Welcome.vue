<template>
  <div class="flex flex-col items-center text-center gap-8">
    <p class="text-2xl ttt-purple">Thanks for installing Track &amp; Trace Tools!</p>

    <p>
      You're all set! Track &amp; Trace Tools will automatically be added to metrc.com next time you
      use it.
    </p>

    <div class="flex flex-col items-center gap-2">
      <div
        class="fake-metrc-container flex flex-row justify-end items-end border-b border-r border-gray-500"
        style="height: 250px; width: 500px"
      >
        <b-button variant="primary" title="Toolbox" style="padding: 0">
          <track-trace-tools-logo
            fill="#49276a"
            :inverted="true"
            style="height: 52px; width: 52px"
          />
        </b-button>
      </div>

      <div class="text-sm text-gray-600 text-center">
        The Toolbox button will appear in the bottom right. <br />
        Click it to access tools and change your settings.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

require("@/assets/images/metrc-background.svg");

export default Vue.extend({
  name: "Welcome",
  store,
  router,
  props: {},
  components: {
    TrackTraceToolsLogo,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.fake-metrc-container {
  background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 90%,
      rgba(255, 255, 255, 1) 100%
    ),
    linear-gradient(
      to left,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 95%,
      rgba(255, 255, 255, 1) 100%
    ),
    url(/img/metrc-background.svg);
  padding: 4rem 1rem 1rem 4rem;
}
</style>
