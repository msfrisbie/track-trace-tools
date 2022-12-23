<template>
  <div>{{ pkg.Label }}</div>
</template>

<script lang="ts">
import { IPackageData } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistoryTile",
  store,
  router,
  props: {
    pkg: Object as () => IPackageData,
  },
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
