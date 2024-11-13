<template>
  <div class="flex flex-col items-center text-center gap-8">
    <p class="text-2xl text-purple-700">Thanks for installing Track &amp; Trace Tools!</p>

    <div class="text-lg">
      You're all set! Track &amp; Trace Tools will automatically be added to metrc.com next time you
      use it.
    </div>

    <div class="text-lg">Don't know where to begin? <a class="underline text-purple-700"
        href="https://trackandtrace.tools/wiki" target="_blank">Check out the T3 Wiki</a>
      for tips on getting started, lists of features, and tons of other valuable resources.
    </div>

    <!-- <div class="flex flex-col items-center gap-2">
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

    </div> -->

    <iframe width="950" height="534" src="https://www.youtube.com/embed/p1ubKzy4ZKQ"
      title="Track &amp; Trace Tools Demo" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>
  </div>
</template>

<script lang="ts">
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import Vue from 'vue';
import { mapState } from 'vuex';

require('@/assets/images/metrc-background.svg');

export default Vue.extend({
  name: 'Welcome',
  store,
  router,
  props: {},
  components: {
    // TrackTraceToolsLogo,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {},
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped>
.fake-metrc-container {
  background: linear-gradient(to top,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 90%,
      rgba(255, 255, 255, 1) 100%),
    linear-gradient(to left,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 95%,
      rgba(255, 255, 255, 1) 100%),
    url(/img/metrc-background.svg);
  padding: 4rem 1rem 1rem 4rem;
}
</style>
