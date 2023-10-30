<template>
  <div>
    <div class="max-w-xl text-gray-800 flex flex-col space-y-12">
      <div class="text-2xl text-center">Why are some tools not available to me?</div>

      <div class="text-lg text-start">
        Some tools require customization on a per-business or per-state basis. If you'd like to
        enable this tool, reach out:
        <a class="underline text-purple-500" href="mailto:matt@trackandtrace.tools"
          >matt@trackandtrace.tools</a
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import Vue from 'vue';

export default Vue.extend({
  name: 'UnavailablePage',
  store,
  router,
  components: {},
  data() {
    return {};
  },
  mounted() {},
  computed: {},
  methods: {},
});
</script>

<style type="text/scss" lang="scss"></style>
