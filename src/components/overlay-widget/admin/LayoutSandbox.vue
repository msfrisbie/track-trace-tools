<template>
  <div class="w-full bg-blue-200 grid grid-cols-2 h-full">
    <!-- <div class="bg-red-200">
      <div v-for="r of range" v-bind:key="r">Full body scroll</div>
    </div> -->

    <div class="bg-green-200 h-full">
      <!-- <div class="flex-grow"> -->
      <div v-for="r of range" v-bind:key="r">Flex scroll</div>
      <!-- </div> -->

      <div class="bg-yellow-200">Static</div>
    </div>

    <div class="bg-red-200 h-full">Col 2</div>

    <div class="bg-blue-200 grid grid-cols-2">
      <div>Col 1</div>
      <div>Col 2</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";

export default Vue.extend({
  name: "LayoutSandbox",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
    range() {
      return new Array(200).map(x => 0);
    }
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {}
});
</script>

<style type="text/scss" lang="scss" scoped></style>
