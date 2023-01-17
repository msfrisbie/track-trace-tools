<template>
  <div class="flex flex-col items-center">Quick Scripts</div>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "QuickScripts",
  store,
  data() {
    return {};
  },
  mounted() {},
  computed: {
    ...mapState(["backgroundTasks"]),
  },
  destroyed() {},
  methods: {},
});
</script>
