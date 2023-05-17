<template>
  <div class="flex flex-col space-y-20">
    <div class="w-full grid gap-12 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 place-items-center">
      <div
        v-for="option of options"
        :key="option.text"
        class="flex flex-col items-center justify-center space-y-4 max-w-sm"
        style="min-width: 300px"
        v-bind:style="{
          opacity: option.enabled ? '1' : '0.4',
          display: option.visible ? 'flex' : 'none',
        }"
      >
        <font-awesome-icon size="3x" class="text-gray-500" :icon="option.icon" />

        <div class="w-full">
          <b-button
            class="w-full flex flex-row items-center justify-center space-x-4 text-white opacity-70 hover:opacity-100"
            v-bind:style="{
              'background-color': option.backgroundColor,
            }"
            :disabled="!option.enabled"
            @click.stop.prevent="selectBuilderType(option)"
            ><span>{{ option.text }}</span>

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
            >
          </b-button>

          <div class="w-full text-gray-500 text-center" style="height: 1rem; margin-top: 1rem">
            <template v-if="!option.enabled && option.showDisabledMessage">
              {{ notAvailableMessage }}
              <b-button variant="link" @click.stop.prevent="open('/help/unavailable')"
                >Why?</b-button
              >
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { HOST_WILDCARD, isCurrentHostAllowed } from "@/utils/builder";
import { notAvailableMessage } from "@/utils/text";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PackageBuilderListView",
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
      facilityUsesLocationForPackages: false,
    };
  },
  async mounted() {
    this.$data.facilityUsesLocationForPackages =
      await dynamicConstsManager.facilityUsesLocationForPackages();
  },
  async created() {},
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      debugMode: (state: any) => state.debugMode,
    }),
    options() {
      return [
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
        // {
        //   route: "/package/cogs",
        //   text: "COGS",
        //   icon: "sitemap",
        //   backgroundColor: "#2774ae",
        //   // isBeta: true,
        //   isNew: false,
        //   enabled: isCurrentHostAllowed([HOST_WILDCARD]),
        //   visible: clientBuildManager.assertValues(["ENABLE_COGS"]),
        // },
        {
          route: "/package/split-package",
          text: "SPLIT PACKAGE",
          icon: "expand-alt",
          backgroundColor: "#2774ae",
          // isBeta: true,
          isNew: false,
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          visible: true,
          showDisabledMessage: true,
        },
        {
          route: "/package/move-packages",
          text: "MOVE PACKAGES",
          icon: "exchange-alt",
          isBeta: false,
          // isNew: true,
          backgroundColor: "#2774ae",
          enabled:
            isCurrentHostAllowed([HOST_WILDCARD]) && this.$data.facilityUsesLocationForPackages,
          visible: true,
          showDisabledMessage: false,
        },
        {
          route: "/package/merge-packages",
          text: "MERGE PACKAGES",
          icon: "compress-arrows-alt",
          isBeta: false,
          isNew: false,
          backgroundColor: "#2774ae",
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          visible: true,
          showDisabledMessage: true,
        },
        {
          route: "/package/finish-packages",
          text: "FINISH PACKAGES",
          icon: "check-square",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: isCurrentHostAllowed([HOST_WILDCARD]),
          visible: true,
          showDisabledMessage: true,
        },
        {
          route: "/package/add-item-group",
          text: "ADD ITEM GROUP",
          icon: "boxes",
          backgroundColor: "#2774ae",
          // isBeta: true,
          isNew: false,
          enabled: false, //isCurrentHostAllowed([HOST_WILDCARD]),
          visible: false,
          showDisabledMessage: true,
        },
        {
          route: "/package/allocate-samples",
          text: "ALLOCATE SAMPLES",
          icon: "boxes",
          backgroundColor: "#2774ae",
          // isBeta: true,
          isNew: false,
          enabled: true, //isCurrentHostAllowed([HOST_WILDCARD]),
          visible: clientBuildManager.assertValues(["ENABLE_EMPLOYEE_SAMPLE_TOOL"]),
          showDisabledMessage: true,
        },
      ];
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
