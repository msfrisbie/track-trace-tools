<template>
  <div>
    <div class="max-w-xl text-gray-800 flex flex-col space-y-12">
      <div class="text-2xl text-center">
        Why are some tools not available to me?
      </div>

      <div class="text-lg text-start">
        Tools are enabled on a per-state basis, only after they have been thoroughly tested by users
        in that state.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import router from "@/router/index";

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
  methods: {}
});
</script>

<style type="text/scss" lang="scss"></style>
