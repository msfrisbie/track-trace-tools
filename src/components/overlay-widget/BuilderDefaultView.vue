<template>
  <!-- need this wrapping element to absorb the inherited classes -->

  <div>
    <div ref="mainmenu" class="w-full grid gap-8 grid-cols-3"
      style="grid-template-columns: minmax(280px, auto) 1fr minmax(280px, 400px)">
      <div class="flex gap-2 flex-col p-4 bg-purple-50">
        <!-- <div
          v-for="option of options"
          v-bind:key="option.text"
          class="flex flex-col items-center justify-center space-y-4"
          style="min-width: 300px"
          v-bind:style="{
          }"
        > -->
        <!-- <font-awesome-icon size="3x" class="text-gray-500" :icon="option.icon" /> -->
        <b-button-group vertical class="rounded border border-purple-600 overflow-hidden">
          <b-button v-for="option of options" v-bind:key="option.text"
            class="w-full flex flex-row items-center justify-between space-x-4 opacity-70 hover:opacity-100 border-0"
            v-bind:style="{
              // 'background-color': option.backgroundColor,
              opacity: option.enabled ? 'inherit' : '0.4',
              display: option.visible ? 'flex' : 'none',
            }" variant="outline-primary" :disabled="!option.enabled" @click.stop.prevent="open(option)">
            <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr 2rem">
              <div class="aspect-square grid place-items-center">
                <font-awesome-icon :icon="option.icon" />
              </div>

              <span>{{ option.text }}</span>

              <div class="aspect-square grid place-items-center">
                <template v-if="option.isPlus">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="primary">T3+</b-badge></template>
                <template v-else-if="option.isBeta">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="primary">BETA</b-badge></template>
                <template v-else-if="option.isNew">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="primary">NEW!</b-badge></template>
              </div>
            </div>
          </b-button>
        </b-button-group>
      </div>
      <builder-dashboard class="py-4"></builder-dashboard>
      <announcements class="bg-purple-50 p-4"></announcements>
    </div>
  </div>
</template>

<script lang="ts">
import Announcements from "@/components/overlay-widget/Announcements.vue";
import BuilderDashboard from "@/components/overlay-widget/BuilderDashboard.vue";
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { hasPlusImpl } from "@/utils/plus";
import { notAvailableMessage } from "@/utils/text";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

interface IOption {
  backgroundColor: string;
  text: string;
  route?: string;
  url?: string;
  icon: string;
  visible: boolean;
  enabled: boolean;
  isBeta: boolean;
  isNew: boolean;
}

export default Vue.extend({
  name: "BuilderDefaultView",
  router,
  store,
  components: {
    Announcements,
    BuilderDashboard,
  },
  data() {
    return {
      notAvailableMessage: notAvailableMessage(),
    };
  },
  computed: {
    ...mapState<IPluginState>({
      pluginAuth: (state: IPluginState) => state.pluginAuth,
      clientValues: (state: IPluginState) => state.client.values,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      credentials: (state: IPluginState) => state.credentials,
      accountEnabled: (state: IPluginState) => state.accountEnabled,
      flags: (state: IPluginState) => state.flags,
      debugMode: (state: IPluginState) => state.debugMode,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    options() {
      return [
        {
          backgroundColor: "#2774ae",
          text: "VERIFY",
          route: "/verify",
          icon: "check",
          enabled: true,
          visible: false,
          isBeta: false,
          isNew: true,
          isPlus: false,
          // helpRoute: "/help/package",
        },
        {
          backgroundColor: "#2774ae",
          text: "PACKAGE TOOLS",
          route: "/package",
          icon: "box",
          enabled: true,
          visible: true,
          isBeta: false,
          isNew: false,
          helpRoute: "/help/package",
        },
        {
          backgroundColor: "#48b867",
          text: "CULTIVATION TOOLS",
          route: "/cultivator",
          icon: "leaf",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          helpRoute: "/help/cultivator",
        },
        {
          backgroundColor: "#48b867",
          text: "QUICK SCRIPTS",
          route: "/quick-scripts",
          icon: "bolt",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        {
          backgroundColor: "#c14747",
          text: "REPORTS",
          route: "/google-sheets-export",
          icon: "table",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          isPlus: true,
        },
        {
          backgroundColor: "#c14747",
          text: "EXPLORER",
          route: "/metrc-explorer",
          icon: "sitemap",
          visible: true,
          enabled: store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus,
          isBeta: false,
          isNew: false,
          isPlus: true,
        },
        {
          backgroundColor: "#c14747",
          text: "GRAPH",
          route: "/graph",
          icon: "project-diagram",
          visible: true,
          enabled: store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus,
          isBeta: false,
          isNew: false,
          isPlus: true,
        },
        {
          backgroundColor: "#773c77",
          text: "TRANSFER BUILDER",
          route: "/transfer/transfer-builder",
          icon: "truck-loading",
          enabled: store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus,
          visible: true,
          isBeta: false,
          isNew: false,
          isPlus: true,
          helpRoute: "/help/transfer",
        },
        {
          backgroundColor: "#c14747",
          text: "VOID TAGS",
          route: "/tags/void-tags",
          icon: "tags",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        {
          backgroundColor: "orange",
          text: "FINALIZE SALES",
          route: "/sales/finalize-sales",
          icon: "dollar-sign",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        {
          backgroundColor: "gray",
          text: "SETTINGS",
          route: "/settings/all",
          icon: "sliders-h",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        {
          backgroundColor: "gray",
          text: "COMMUNITY",
          icon: "users",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          url: "https://track-trace-tools.talkyard.net/",
        },
        {
          backgroundColor: "gray",
          text: "REPORT A PROBLEM",
          icon: "exclamation-triangle",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          url: "https://docs.google.com/forms/d/e/1FAIpQLSd2hQFwtXyv1Bco9nHN9d4tEqkgbhe3w-WdbZAemBCTD_19VQ/viewform?usp=sf_link",
        },
        {
          backgroundColor: "black",
          text: "ADMIN",
          route: "/admin",
          icon: "cog",
          visible: store.state.debugMode,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        {
          backgroundColor: "gray",
          text: "MANAGE T3+",
          icon: "plus",
          visible: store.getters[`client/${ClientGetters.T3PLUS}`],
          enabled: true,
          isBeta: false,
          isNew: false,
          isPlus: false,
          url: "https://dash.trackandtrace.tools",
        },
      ];
    },
  },
  methods: {
    ...mapActions({}),
    open({ route, url, handler }: { route?: string; url?: string; handler?: Function }) {
      if (!route && !url && !handler) {
        throw new Error("Must provide a route or URL or handler");
      }

      if (route) {
        analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
          action: `Navigated to ${route}`,
        });

        this.$router.push(route);
      }

      if (url) {
        analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
          action: `Navigated to ${url}`,
        });

        window.open(url, "_blank");
      }

      if (handler) {
        analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
          action: "Calling handler",
        });

        handler();
      }
    },
  },
  async created() { },
});
</script>
