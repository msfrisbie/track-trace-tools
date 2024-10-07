<template>
  <builder-list :options="options"></builder-list>
</template>

<script lang="ts">
import BuilderList from "@/components/overlay-widget/shared/BuilderList.vue";
import { IBuilderListOption, IPluginState } from "@/interfaces";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { HOST_WILDCARD, isCurrentHostAllowed } from "@/utils/builder";
import { hasPlusImpl } from "@/utils/plus";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageBuilderListView",
  store,
  components: {
    BuilderList,
  },
  methods: {},
  data() {
    return {
      facilityUsesLocationForPackages: false,
    };
  },
  async mounted() {
    this.$data.facilityUsesLocationForPackages =
      await dynamicConstsManager.facilityUsesLocationForPackages();
  },
  async created() { },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      debugMode: (state: IPluginState) => state.debugMode,
      clientState: (state: IPluginState) => state.client,
    }),
    options(): IBuilderListOption[] {
      return [
        {
          route: "/package/create-package-csv",
          text: "NEW PACKAGES CSV",
          icon: "file-csv",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: true,
          visible: false,
          isPlus: true,
          showDisabledMessage: false,
        },
        {
          route: "/package/split-package",
          text: "SPLIT PACKAGE",
          icon: "expand-alt",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: hasPlusImpl(),
          visible: true,
          showDisabledMessage: true,
          isPlus: true,
        },
        {
          route: "/package/merge-packages",
          text: "MERGE PACKAGES",
          icon: "compress-arrows-alt",
          isBeta: false,
          isNew: false,
          backgroundColor: "#2774ae",
          enabled: hasPlusImpl(),
          visible: true,
          showDisabledMessage: true,
          isPlus: true,
        },
        {
          route: "/package/move-packages",
          text: "MOVE PACKAGES",
          icon: "exchange-alt",
          isBeta: false,
          isNew: false,
          backgroundColor: "#2774ae",
          enabled: this.$data.facilityUsesLocationForPackages,
          visible: true,
          showDisabledMessage: false,
          isPlus: false,
        },
        {
          route: "/package/finish-packages",
          text: "FINISH PACKAGES",
          icon: "check-square",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: true,
          visible: true,
          showDisabledMessage: true,
          isPlus: false,
        },
        {
          route: "/package/add-item-group",
          text: "ADD ITEM GROUP",
          icon: "boxes",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: false,
          visible: false,
          showDisabledMessage: true,
          isPlus: false,
        },
        {
          route: "/package/allocate-samples",
          text: "ALLOCATE SAMPLES",
          icon: "boxes",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: true,
          visible: store.state.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
          showDisabledMessage: true,
          isPlus: false,
        },
        {
          route: "/package/history",
          text: "PACKAGE HISTORY",
          icon: "sitemap",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          visible: store.state.client.values.ENABLE_PACKAGE_HISTORY,
          isPlus: false,
          showDisabledMessage: false,
        },
        {
          route: "/package/bulk-coa",
          text: "BULK ADD COAs",
          icon: "file-csv",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: hasPlusImpl() || store.state.client.values.ENABLE_BULK_COA,
          visible: true,
          isPlus: true,
          showDisabledMessage: false,
        },
      ];
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
