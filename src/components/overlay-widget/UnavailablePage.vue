<template>
  <div>
    <div class="max-w-xl flex flex-col space-y-12 text-start">
      <div class="text-2xl text-purple-700">Why are some tools not available to me?</div>

      <div class="text-base">Tools are disabled for a variety of reasons:</div>

      <div class="list-disc ml-4 text-base">
        <li>The tool is not needed in a certain state.</li>
        <li>The tool requires customization on a per-business or per-state basis.</li>
        <li>The tool is not stable enough to be used in certain situations.</li>
      </div>

      <div class="text-base">
        If you'd like to learn more, reach out:
        <a class="underline text-purple-500" href="mailto:matt@trackandtrace.tools"
          >matt@trackandtrace.tools</a
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "UnavailablePage",
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
