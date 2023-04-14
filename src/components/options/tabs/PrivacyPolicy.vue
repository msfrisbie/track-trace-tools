<template>
  <div class="flex flex-col gap-4 items-center">
    <div class="max-w-lg flex flex-col gap-4">
      <p>
        Read the privacy policy
        <a
          href="https://trackandtrace.tools/privacy-policy"
          class="underline text-blue-500"
          target="_blank"
          >here</a
        >.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "License",
  store,
  router,
  props: {},
  components: {},
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

<style type="text/scss" lang="scss" scoped></style>
