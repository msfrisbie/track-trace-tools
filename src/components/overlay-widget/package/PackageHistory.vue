<template>
  <div class="flex flex-col items-stretch w-full h-full">
    <template v-if="!sourcePackage">
      <single-package-picker
        class=""
        :selectedPackages="sourcePackage ? [sourcePackage] : []"
        v-on:removePackage="setPackage({ pkg: null })"
        v-on:addPackage="setPackage({ pkg: $event })"
        :selectAllPackageTypes="true"
      ></single-package-picker>
    </template>
    <template v-else>
      <div class="flex flex-col">
        <div class="col-span-3 flex flex-col gap-4">
          <div>{{ sourcePackage.Label }}</div>
          <div>{{ status }}</div>
          <button @click="setPackage({ pkg: null })">RESET</button>
        </div>
        <div class="flex flex-col items-start overflow-x-scroll">
          <div>Ancestors</div>
          <package-history-tile :ancestorTree="ancestorTree"></package-history-tile>
        </div>
        <div class="flex flex-col items-start overflow-x-scroll">
          <div>Children</div>
          <package-history-tile :childTree="childTree"></package-history-tile>
        </div>
        <div class="flex flex-col items-stretch gap-2">
          <div v-for="entry of log" v-bind:key="entry">
            {{ entry }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageHistoryTile from "@/components/overlay-widget/shared/PackageHistoryTile.vue";
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
    PackageHistoryTile,
  },
  computed: {
    ...mapState<IPluginState>({
      sourcePackage: (state: IPluginState) => state.packageHistory.sourcePackage,
      ancestorTree: (state: IPluginState) => state.packageHistory.ancestorTree,
      childTree: (state: IPluginState) => state.packageHistory.childTree,
      sourceHarvests: (state: IPluginState) => state.packageHistory.sourceHarvests,
      status: (state: IPluginState) => state.packageHistory.status,
      log: (state: IPluginState) => state.packageHistory.log,
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
  async destroyed() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
