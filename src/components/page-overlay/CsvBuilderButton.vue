<template>
  <b-button
    id="csv-builder-popover-target"
    variant="light"
    title="Build CSV"
    @click="openCsvBuilder($event)"
  >
    <!-- class="bg-gray-50 hover:bg-gray-200 rounded-full shadow-2xl border border-gray-400 h-16 w-16 flex items-center justify-center cursor-pointer" -->

    <font-awesome-icon icon="file-csv" size="2x" />

    <b-popover
      target="csv-builder-popover-target"
      triggers="hover"
      placement="top"
      variant="primary"
      ref="csv-builder-popover"
      :disabled="trackedInteractions.dismissedCsvBuilderPopover"
      container="popover-container"
    >
      <template #title>
        <span class="text-base">New: <b>CSV Builder</b></span>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p>Generate and download Metrc CSVs.</p>

        <b-button
          size="sm"
          variant="outline-primary"
          class="mb-2"
          @click="dismissCsvBuilderPopover()"
          >GOT IT</b-button
        >
      </div>
    </b-popover>
  </b-button>
</template>

<script lang="ts">
import { MessageType, ModalType } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { modalManager } from '@/modules/modal-manager.module';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'CsvBuilderButton',
  store,
  data() {
    return {};
  },
  computed: mapState(['trackedInteractions', 'settings']),
  methods: {
    dismissCsvBuilderPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedCsvBuilderPopover = true;

      // @ts-ignore
      this.$refs['csv-builder-popover'].$emit('close');
      // @ts-ignore
      this.$refs['csv-builder-popover'].$emit('disable');

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openCsvBuilder() {
      // Permissions check disabled
      // const result = await messageBus.sendMessageToBackground(
      //   MessageType.CHECK_PERMISSIONS,
      //   CSV_BUILDER_PERMISSIONS
      // );

      // if (!result.data.hasPermissions) {
      //   modalManager.dispatchModalEvent(ModalType.PERMISSIONS);
      //   return;
      // }

      analyticsManager.track(MessageType.OPENED_CSV_BUILDER);

      modalManager.dispatchModalEvent(ModalType.CSV);
    },
  },
});
</script>
