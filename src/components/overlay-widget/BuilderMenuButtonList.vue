<template>
  <div class="flex gap-2 flex-col bg-purple-50 hover-expand" style="z-index:1000"
    v-bind:class="$route.path === '/' ? '' : 'hover-expand'">
    <div class="rounded border border-purple-600 sticky top-0">
      <b-button v-for="option of options" v-bind:key="option.text"
        class="w-full flex flex-row items-center justify-between space-x-4 opacity-70 hover:opacity-100 border-0 text-xl h-10"
        v-bind:style="{
          // 'background-color': option.backgroundColor,
          opacity: option.enabled ? 'inherit' : '0.4',
          display: option.visible ? 'flex' : 'none',
        }" variant="outline-primary" :disabled="!option.enabled" @click.stop.prevent="open(option)">
        <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr 2rem">
          <div class="aspect-square grid place-items-center">
            <font-awesome-icon :icon="option.icon" />
          </div>

          <span v-bind:class="$route.path === '/' ? '' : 'hover-reveal'">{{ option.text }}</span>

          <div class="aspect-square grid place-items-center" v-bind:class="$route.path === '/' ? '' : 'hover-reveal'">
            <template v-if="option.isPlus && !hasPlus">
              <!-- flex struggles to vertical align the badge for some reason -->
              <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                variant="primary">T3+</b-badge></template>

            <template v-else-if="option.isBeta">
              <!-- flex struggles to vertical align the badge for some reason -->
              <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                variant="primary">BETA</b-badge></template>

            <template v-else-if="option.enableNotificationBadge && notificationCount > 0">
              <!-- flex struggles to vertical align the badge for some reason -->
              <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial" variant="danger">{{
                1 }}</b-badge></template>

            <template v-else-if="option.isNew">
              <!-- flex struggles to vertical align the badge for some reason -->
              <b-badge style="
                      padding-top: 0.3rem;
                      margin-top: 0.1rem;
                      margin-left: -0.5rem;
                      line-height: initial;
                      background-color: goldenrod;
                    " variant="primary">NEW</b-badge></template>
          </div>
        </div>
      </b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent } from "@/consts";
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
  enableNotificationBadge?: boolean;
}

export default Vue.extend({
  name: "BuilderMenuButtonList",
  router,
  store,
  components: {
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
      notificationCount: (state: IPluginState) => state.announcements.notificationCount,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    options() {
      return [
        {
          backgroundColor: "gray",
          text: "T3 WIKI",
          icon: "book-open",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          url: "https://trackandtrace.tools/wiki",
        },
        {
          backgroundColor: "gray",
          text: "DASHBOARD",
          icon: "tachometer-alt",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          route: "/dashboard",
        },
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
          backgroundColor: "#48b867",
          text: "ANNOUNCEMENTS",
          route: "/announcements",
          icon: "bell",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          enableNotificationBadge: true
        },
        {
          backgroundColor: "#c14747",
          text: "PRINT LABELS",
          route: "/tags/print-tags",
          icon: "print",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: true,
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
          backgroundColor: "#c14747",
          text: "TAG TOOLS",
          route: "/tags",
          icon: "tags",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        // {
        //   backgroundColor: "#c14747",
        //   text: "VOID TAGS",
        //   route: "/tags/void-tags",
        //   icon: "tags",
        //   visible: true,
        //   enabled: true,
        //   isBeta: false,
        //   isNew: false,
        // },
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
          visible: store.state.settings.enableLegacyTransferTools,
          isBeta: false,
          isNew: false,
          isPlus: true,
          helpRoute: "/help/transfer",
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
          text: "T3 API",
          icon: "file",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          url: "https://trackandtrace.tools/api",
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
          backgroundColor: "gray",
          text: "SEND FEEDBACK",
          icon: "comment",
          visible: true,
          enabled: true,
          isBeta: false,
          isNew: false,
          url: "https://forms.gle/9J5UMXN4FkAZQ5wH9",
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
        {
          backgroundColor: "gray",
          text: "GET T3+",
          icon: "plus",
          visible: !store.getters[`client/${ClientGetters.T3PLUS}`],
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
        analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
          action: `Navigated to ${route}`,
        });

        this.$router.push(route);
      }

      if (url) {
        analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
          action: `Navigated to ${url}`,
        });

        window.open(url, "_blank");
      }

      if (handler) {
        analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
          action: "Calling handler",
        });

        handler();
      }
    },
  },
  async created() { },
});
</script>

<style type="text/scss" lang="scss">
.hover-expand {
  width: initial;

  .hover-reveal {
    visibility: hidden;
    display: none;
  }
}

.hover-expand:hover {
  width: 280px;

  .hover-reveal {
    visibility: visible;
    display: initial;
  }
}
</style>
