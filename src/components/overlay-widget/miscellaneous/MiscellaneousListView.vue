<template>
  <div class="flex flex-col space-y-20">
    <div class="w-full grid gap-12 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 place-items-center">
      <div v-for="option of options" :key="option.text"
        class="flex flex-col items-center justify-center space-y-4 max-w-sm" style="min-width: 300px" v-bind:style="{
          opacity: option.enabled ? '1' : '0.4',
        }">
        <font-awesome-icon size="3x" class="text-gray-500" :icon="option.icon" />

        <div class="w-full">
          <b-button
            class="w-full flex flex-row items-center justify-center space-x-4 text-white opacity-70 hover:opacity-100"
            v-bind:style="{
              'background-color': option.backgroundColor,
            }" :disabled="!option.enabled" @click.stop.prevent="open(option.route)"><span>{{ option.text }}</span>

            <template v-if="option.isBeta">
              <!-- flex struggles to vertical align the badge for some reason -->
              <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                variant="light">BETA</b-badge></template>
            <template v-if="option.isNew">
              <!-- flex struggles to vertical align the badge for some reason -->
              <b-badge style="padding-top: 0.3rem; margin-top: 0.1rem; line-height: initial"
                variant="light">NEW!</b-badge></template>
          </b-button>

          <div class="w-full text-gray-500 text-center" style="height: 1rem; margin-top: 1rem">
            <template v-if="!option.enabled">
              {{ notAvailableMessage }}
              <b-button variant="link" @click.stop.prevent="open('/help/unavailable')">Why?</b-button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import store from '@/store/page-overlay/index';
import { notAvailableMessage } from '@/utils/text';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'MiscellaneousListView',
  store,
  methods: {
    selectBuilderType({ text, route }: { text: string; route: string }) {
      this.$router.push(route);

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        action: `Selected builder type ${text}`,
      });
    },
    open(path: string) {
      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${path}`,
      });

      this.$router.push(path);
    },
  },
  data() {
    return {
      notAvailableMessage: notAvailableMessage(),
    };
  },
  async mounted() { },
  async created() { },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
    }),
    options() {
      return [
        {
          backgroundColor: 'gray',
          text: 'FINALIZE SALES',
          route: '/sales/finalize-sales',
          icon: 'dollar-sign',
          enabled: true,
          isBeta: false,
          isNew: false,
        },
        // {
        //   backgroundColor: "gray",
        //   text: "ACCOUNT",
        //   route: "/account/account-detail",
        //   icon: "user",
        //   enabled: true,
        //   isBeta: false,
        //   isNew: false
        // },
        // {
        //   backgroundColor: "gray",
        //   text: "BACKUPS",
        //   route: "/backups/all",
        //   icon: "save",
        //   enabled: true,
        //   isBeta: false,
        //   isNew: false
        // },
        {
          backgroundColor: 'gray',
          text: 'SETTINGS',
          route: '/settings/all',
          icon: 'sliders-h',
          enabled: true,
          isBeta: false,
          isNew: false,
        },
      ];
    },
  },
});
</script>

<style type="text/scss" lang="scss"></style>
