<template>
  <div>
    <div>PackageHistory</div>
    <single-package-picker
      :selectedPackages="sourcePackage ? [sourcePackage] : []"
      v-on:removePackage="setPackage({ pkg: null })"
      v-on:addPackage="setPackage({ pkg: $event })"
    ></single-package-picker>
  </div>
</template>

<script lang="ts">
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import { IPackageData } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistory",
  store,
  router,
  props: {},
  components: {
    SinglePackagePicker,
  },
  computed: {
    ...mapState({
      sourcePackage: (state: any) => state.packgeHistory.sourcePackage,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      setPackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
