<template>
  <div class="flex flex-col items-stretch w-full h-full">
    <single-package-picker
      class=""
      :selectedPackages="sourcePackage ? [sourcePackage] : []"
      v-on:removePackage="setPackage({ pkg: null })"
      v-on:addPackage="setPackage({ pkg: $event })"
    ></single-package-picker>
  </div>
</template>

<script lang="ts">
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistory",
  store,
  router,
  props: {},
  components: {
    SinglePackagePicker,
  },
  computed: {
    ...mapState<IPluginState>({
      sourcePackage: (state: IPluginState) => state.packageHistory.sourcePackage,
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
