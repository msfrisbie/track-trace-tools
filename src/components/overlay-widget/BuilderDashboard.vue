<template>
  <div class="grid grid-cols-3 gap-4 text-center">
    <div class="col-span-3 text-2xl text-gray-400 font-thin">PLANT BATCHES</div>
    <b-card variant="ttt" class="cursor-pointer">Active</b-card>
    <b-card>Inactive</b-card>

    <b-spinner variant="ttt"></b-spinner>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "BuilderDashboard",
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
