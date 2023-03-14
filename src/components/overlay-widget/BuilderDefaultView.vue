<template>
  <!-- need this wrapping element to absorb the inherited classes -->

  <div>
    <div class="w-full grid gap-8 grid-cols-2" style="grid-template-columns: auto 1fr">
      <div class="flex gap-2 flex-col">
        <div
          v-for="option of options"
          v-bind:key="option.text"
          class="flex flex-col items-center justify-center space-y-4"
          style="min-width: 300px"
          v-bind:style="{
            opacity: option.enabled ? 'inherit' : '0.4',
            display: option.visible ? 'flex' : 'none',
          }"
        >
          <!-- <font-awesome-icon size="3x" class="text-gray-500" :icon="option.icon" /> -->

          <b-button
            class="w-full flex flex-row items-center justify-between space-x-4 opacity-70 hover:opacity-100"
            v-bind:style="{
              // 'background-color': option.backgroundColor,
            }"
            variant="outline-primary"
            :disabled="!option.enabled"
            @click.stop.prevent="open(option)"
          >
            <font-awesome-icon :icon="option.icon" />
            <span>{{ option.text }}</span>
            <div v-bind:style="badgeWidth(option)">
              <template v-if="option.enabled">
                <template v-if="option.isBeta">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge
                    style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="primary"
                    >BETA</b-badge
                  ></template
                >
                <template v-if="option.isNew">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge
                    style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="primary"
                    >NEW!</b-badge
                  ></template
                ></template
              >
            </div>
          </b-button>

          <!-- <div class="text-center" style="height: 1rem; margin-top: 1rem">
          <template v-if="option.enabled">
            <template v-if="option.helpRoute">
              <b-button
                variant="link"
                class="text-gray-500 opacity-70 hover:opacity-100"
                @click.stop.prevent="open({ route: option.helpRoute })"
                >What is this?</b-button
              >
            </template>
          </template>
          <template v-else>
            <span class="text-gray-500 opacity-70"
              >{{ notAvailableMessage }}
              <b-button variant="link" @click.stop.prevent="open('/help/unavailable')"
                >Why?</b-button
              >
            </span>
          </template>
        </div> -->
        </div>
      </div>
      <builder-dashboard></builder-dashboard>
    </div>
  </div>
</template>

<script lang="ts">
import BuilderDashboard from "@/components/overlay-widget/BuilderDashboard.vue";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { isIdentityEligibleForTransferTools } from "@/utils/access-control";
import { HOST_WILDCARD, isCurrentHostAllowed } from "@/utils/builder";
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
    BuilderDashboard,
  },
  data() {
    return {
      notAvailableMessage: notAvailableMessage(),
    };
  },
  computed: {
    ...mapState({
      pluginAuth: (state: any) => state.pluginAuth,
      authState: (state: any) => state.pluginAuth.authState,
      credentials: (state: any) => state.credentials,
      accountEnabled: (state: any) => state.accountEnabled,
      flags: (state: any) => state.flags,
      debugMode: (state: any) => state.debugMode,
    }),
    options() {
      return [
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
          text: "GOOGLE SHEETS",
          route: "/google-sheets-export",
          icon: "table",
          visible: true,
          enabled: true,
          isBeta: true,
          isNew: false,
        },
        {
          route: "/package/history",
          text: "PACKAGE HISTORY",
          icon: "sitemap",
          backgroundColor: "#2774ae",
          // isBeta: true,
          isNew: false,
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          visible: true,
        },
        {
          backgroundColor: "#48b867",
          text: "CULTIVATION TOOLS",
          route: "/cultivator",
          icon: "leaf",
          visible: true,
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          isBeta: false,
          isNew: false,
          helpRoute: "/help/cultivator",
        },
        {
          backgroundColor: "#2774ae",
          text: "PACKAGE TOOLS",
          route: "/package",
          icon: "box",
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          visible: true,
          isBeta: false,
          isNew: false,
          helpRoute: "/help/package",
        },
        {
          backgroundColor: "#773c77",
          text: "NEW TRANSFER",
          route: "/transfer/create-transfer",
          icon: "truck-loading",
          enabled: isIdentityEligibleForTransferTools({
            identity: this.authState?.identity,
            hostname: window.location.hostname,
          }),
          visible: true,
          isBeta: false,
          isNew: false,
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
          backgroundColor: "black",
          text: "ADMIN",
          route: "/admin",
          icon: "cog",
          visible: this.debugMode,
          enabled: true,
          isBeta: false,
          isNew: false,
        },
      ];
    },
    showFeedback() {
      const identities: string[] = [];

      if (this.authState?.identity && !identities.includes(this.authState?.identity)) {
        return true;
      }

      return false;
    },
  },
  methods: {
    ...mapActions({}),
    badgeWidth(option: any) {
      return { width: !option.enabled || (!option.isBeta && !option.isNew) ? "0rem" : "" };
    },
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
          action: `Calling handler`,
        });

        handler();
      }
    },
    reportsAccessRoute() {
      return this.accountEnabled ? "/reports" : "";
    },
  },
  async mounted() {},
});
</script>
