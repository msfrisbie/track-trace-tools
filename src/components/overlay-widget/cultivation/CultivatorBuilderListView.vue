<template>
  <div class="flex flex-col space-y-20">
    <div class="w-full grid gap-12 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 place-items-center">
      <div
        v-for="builderOption of builderOptions"
        :key="builderOption.text"
        class="flex flex-col items-center justify-center space-y-4 max-w-sm"
        style="min-width: 300px"
        v-bind:style="{
          opacity: builderOption.enabled ? '1' : '0.4',
        }"
      >
        <font-awesome-icon size="3x" class="text-gray-500" :icon="builderOption.icon" />

        <div class="w-full">
          <b-button
            class="w-full text-white opacity-70 hover:opacity-100"
            v-bind:style="{
              'background-color': builderOption.backgroundColor,
            }"
            :disabled="!builderOption.enabled"
            @click.stop.prevent="selectBuilderType(builderOption)"
            >{{ builderOption.text }}
            <template v-if="builderOption.isBeta"
              ><b-badge class="ml-2" variant="light">BETA</b-badge></template
            >
            <template v-if="builderOption.isNew">
              <b-badge
                style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                variant="light"
                >NEW!</b-badge
              ></template
            >
          </b-button>

          <div class="w-full text-gray-500 text-center" style="height: 1rem; margin-top: 1rem">
            <template v-if="!builderOption.enabled">
              <template v-if="builderOption.isPremium && !clientState.t3plus">
                <span class="text-xs flex flex-row items-center justify-center">
                  This tool is enabled with T3+.
                  <b-button
                    size="sm"
                    variant="link"
                    class="underline"
                    @click.stop.prevent="open('/plus')"
                    >Learn&nbsp;more</b-button
                  >
                </span>
              </template>
              <template v-if="!builderOption.isPremium">
                <span class="text-xs flex flex-row items-center justify-center">
                  {{ notAvailableMessage }}
                  <b-button variant="link" size="sm" @click.stop.prevent="open('/help/unavailable')"
                    >Why?</b-button
                  >
                </span>
              </template>
            </template>
            <template
              v-if="builderOption.enabled && builderOption.isPremium && !clientState.t3plus"
            >
              <span class="text-xs flex flex-row items-center justify-center">
                Effective 12/1, this tool is only enabled with T3+.
                <b-button
                  size="sm"
                  variant="link"
                  class="underline"
                  @click.stop.prevent="open('/plus')"
                  >Learn&nbsp;more</b-button
                >
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { CALIFORNIA_METRC_HOSTNAME, MessageType, TESTING_AZ_METRC_HOSTNAME } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import store from "@/store/page-overlay/index";
import { isCurrentHostAllowed } from "@/utils/builder";
import { notAvailableMessage } from "@/utils/text";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "CultivatorBuilderListView",
  store,
  methods: {
    selectBuilderType({ text, route }: { text: string; route: string }) {
      this.$router.push(route);

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        action: `Selected builder type ${text}`,
      });
    },
    open(path: string) {
      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${path}`,
      });

      this.$router.push(path);
    },
  },
  data() {
    return {
      notAvailableMessage: notAvailableMessage(),
      builderOptions: [
        {
          route: "/cultivator/harvest-plants",
          text: "HARVEST PLANTS",
          icon: "cut",
          backgroundColor: "#48b867", // "#c55200",
          enabled:
            store.state.client.t3plus ||
            store.state.client.flags.enable_t3plus_free_tools === "true",
          isPremium: true,
          isBeta: false,
        },
        {
          route: "/cultivator/manicure-plants",
          text: "MANICURE PLANTS",
          icon: "cut",
          backgroundColor: "#48b867", // "#c55200",
          enabled:
            store.state.client.t3plus ||
            store.state.client.flags.enable_t3plus_free_tools === "true",
          isPremium: true,
          isBeta: false,
        },
        {
          route: "/cultivator/mother",
          text: "MOTHER CLONES/SEEDS",
          icon: "leaf",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: false,
        },
        {
          route: "/cultivator/destroy-plants",
          text: "DESTROY PLANTS",
          icon: "trash-alt",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: false,
        },
        {
          route: "/cultivator/move-plants",
          text: "MOVE PLANTS",
          icon: "exchange-alt",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: false,
        },
        {
          route: "/cultivator/unpack-immature-plants",
          text: "UNPACK IMMATURE PLANTS",
          icon: "box-open",
          backgroundColor: "#48b867",
          enabled: isCurrentHostAllowed([CALIFORNIA_METRC_HOSTNAME, TESTING_AZ_METRC_HOSTNAME]),
          isPremium: false,
          isBeta: false,
        },
        {
          route: "/cultivator/pack-immature-plants",
          text: "PACK IMMATURE PLANTS",
          icon: "box",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: false,
          // isNew: true
        },
        {
          route: "/cultivator/promote-immature-plants",
          text: "PROMOTE IMMATURE PLANTS",
          icon: "seedling",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: false,
        },
        {
          route: "/cultivator/retag-plants",
          text: "RETAG PLANTS",
          icon: "tags",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: true,
        },
        {
          route: "/cultivator/retag-plant-batches",
          text: "RETAG PLANT BATCHES",
          icon: "tags",
          backgroundColor: "#48b867",
          enabled: true,
          isPremium: false,
          isBeta: false,
        },
        // {
        //   route: "/cultivator/create-harvest-package",
        //   text: "CREATE HARVEST PACKAGE",
        //   icon: "box",
        //   backgroundColor: "#48b867",
        //   enabled: isCurrentHostAllowed([]),
        //   isPremium: false, isBeta: false
        // }
      ],
    };
  },
  async mounted() {},
  async created() {},
  computed: {
    ...mapState<IPluginState>({
      clientState: (state: IPluginState) => state.client,
    }),
  },
});
</script>

<style type="text/scss" lang="scss"></style>
