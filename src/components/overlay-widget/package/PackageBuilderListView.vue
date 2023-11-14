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
          >
            <div class="w-full grid grid-cols-3 gap-2" style="grid-template-columns: 2rem 1fr 2rem">
              <div class="aspect-square grid place-items-center">
                <!-- <font-awesome-icon :icon="option.icon" /> -->
              </div>

              <span>{{ option.text }}</span>

              <div class="aspect-square grid place-items-center">
                <template v-if="option.isPlus">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge
                    style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="light"
                    >T3+</b-badge
                  ></template
                >
                <template v-else-if="option.isBeta">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge
                    style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="light"
                    >BETA</b-badge
                  ></template
                >
                <template v-else-if="option.isNew">
                  <!-- flex struggles to vertical align the badge for some reason -->
                  <b-badge
                    style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                    variant="light"
                    >NEW!</b-badge
                  ></template
                >
              </div>
            </div>
          </b-button>

          <div class="w-full text-gray-500 text-center" style="height: 1rem; margin-top: 1rem">
            <template v-if="!option.enabled">
              <template v-if="option.isPlus && !clientState.t3plus">
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
              <template v-if="!option.isPlus">
                <span class="text-xs flex flex-row items-center justify-center">
                  {{ notAvailableMessage }}
                  <b-button variant="link" size="sm" @click.stop.prevent="open('/help/unavailable')"
                    >Why?</b-button
                  >
                </span>
              </template>
            </template>
            <template v-if="option.enabled && option.isPlus && !clientState.t3plus">
              <span class="text-xs flex flex-row items-center justify-center">
                This tool is becoming part of T3+.
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
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { HOST_WILDCARD, isCurrentHostAllowed } from "@/utils/builder";
import { hasPlusImpl } from "@/utils/plus";
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
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      debugMode: (state: IPluginState) => state.debugMode,
      clientState: (state: IPluginState) => state.client,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    options() {
      return [
        {
          route: "/package/create-package-csv",
          text: "CSV PACKAGES",
          icon: "file-csv",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: false,
          visible: true,
          isPlus: true,
        },
        {
          route: "/package/split-package",
          text: "SPLIT PACKAGE",
          icon: "expand-alt",
          backgroundColor: "#2774ae",
          isBeta: false,
          isNew: false,
          enabled: hasPlusImpl() || store.state.client.flags.enable_t3plus_free_tools === "true",
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
          enabled: hasPlusImpl() || store.state.client.flags.enable_t3plus_free_tools === "true",
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
          enabled: true,
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
        },
      ];
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
