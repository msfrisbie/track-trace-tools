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
            >{{ builderOption.text
            }}<template v-if="builderOption.isBeta"
              ><b-badge class="ml-2" variant="light">BETA</b-badge></template
            ></b-button
          >

          <div class="w-full text-gray-500 text-center" style="height: 1rem; margin-top: 1rem">
            <template v-if="!builderOption.enabled">
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
import { CALIFORNIA_METRC_HOSTNAME, MessageType } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import store from '@/store/page-overlay/index';
import { isCurrentHostAllowed } from '@/utils/builder';
import { notAvailableMessage } from '@/utils/text';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'TransferBuilderListView',
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
          route: '/transfer/transfer-builder',
          text: 'CREATE/EDIT TRANSFER',
          icon: 'truck-loading',
          backgroundColor: '#773c77',
          enabled: isCurrentHostAllowed([CALIFORNIA_METRC_HOSTNAME]),
          isBeta: true,
        },
        // {
        //   route: "/transfer/transfer-builder-template",
        //   text: "CREATE TEMPLATE",
        //   icon: "truck-loading",
        //   backgroundColor: "#773c77",
        //   enabled: isCurrentHostAllowed([]),
        // },
        {
          route: '/transfer',
          text: 'TRANSFER TRACKING PAGES',
          icon: 'tasks',
          backgroundColor: '#773c77',
          enabled: isCurrentHostAllowed([]),
        },
        // {
        //   route: "/transfer",
        //   text: "INBOUND TRANSPORT LINKS",
        //   icon: "link",
        //   backgroundColor: "#773c77",
        //   enabled: isCurrentHostAllowed([]),
        // },
      ],
    };
  },
  async mounted() {},
  async created() {},
  computed: {
    ...mapState(['trackedInteractions', 'settings', 'accountEnabled']),
  },
});
</script>

<style type="text/scss" lang="scss"></style>
