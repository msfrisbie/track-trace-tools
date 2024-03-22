<template>
  <builder-list :options="options"></builder-list>
</template>

<script lang="ts">
import BuilderList from "@/components/overlay-widget/shared/BuilderList.vue";
import { CALIFORNIA_METRC_HOSTNAME, TESTING_AZ_METRC_HOSTNAME } from "@/consts";
import { IBuilderListOption, IPluginState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { isCurrentHostAllowed } from "@/utils/builder";
import { hasPlusImpl } from "@/utils/plus";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "CultivatorBuilderListView",
  store,
  components: {
    BuilderList,
  },
  methods: {},
  data() {
    return {};
  },
  async mounted() { },
  async created() { },
  computed: {
    ...mapState<IPluginState>({
      clientState: (state: IPluginState) => state.client,
    }),
    options(): IBuilderListOption[] {
      return [
        {
          route: "/cultivator/harvest-plants",
          text: "HARVEST PLANTS",
          icon: "cut",
          backgroundColor: "#48b867",
          enabled: hasPlusImpl() || store.state.client.flags.enable_t3plus_free_tools === "true",
          isPlus: true,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/manicure-plants",
          text: "MANICURE PLANTS",
          icon: "cut",
          backgroundColor: "#48b867",
          enabled: hasPlusImpl() || store.state.client.flags.enable_t3plus_free_tools === "true",
          isPlus: true,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/mother",
          text: "MOTHER CLONES/SEEDS",
          icon: "leaf",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/destroy-plant-batches",
          text: "DESTROY PLANT BATCHES",
          icon: "trash-alt",
          backgroundColor: "#48b867",
          enabled: hasPlusImpl(),
          isPlus: true,
          isBeta: false,
          isNew: true,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/destroy-plants",
          text: "DESTROY PLANTS",
          icon: "trash-alt",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/move-plants",
          text: "MOVE PLANTS",
          icon: "exchange-alt",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/move-plant-batches",
          text: "MOVE PLANT_BATCHES",
          icon: "exchange-alt",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: true,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/unpack-immature-plants",
          text: "UNPACK IMMATURE PLANTS",
          icon: "box-open",
          backgroundColor: "#48b867",
          enabled: isCurrentHostAllowed([CALIFORNIA_METRC_HOSTNAME, TESTING_AZ_METRC_HOSTNAME]),
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/pack-immature-plants",
          text: "PACK IMMATURE PLANTS",
          icon: "box",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/promote-immature-plants",
          text: "PROMOTE IMMATURE PLANTS",
          icon: "seedling",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/retag-plants",
          text: "RETAG PLANTS",
          icon: "tags",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/cultivator/retag-plant-batches",
          text: "RETAG PLANT BATCHES",
          icon: "tags",
          backgroundColor: "#48b867",
          enabled: true,
          isPlus: false,
          isBeta: false,
          isNew: false,
          visible: true,
          showDisabledMessage: false,
        },
        // {
        //   route: "/cultivator/create-harvest-package",
        //   text: "CREATE HARVEST PACKAGE",
        //   icon: "box",
        //   backgroundColor: "#48b867",
        //   enabled: isCurrentHostAllowed([]),
        //   isPlus: false, isBeta: false
        // }
      ];
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
