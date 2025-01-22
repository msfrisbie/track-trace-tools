<template>
  <fragment>
    <b-button variant="primary" title="Announcements" class="relative" @click="openBuilder($event)" style="padding: 0">
      <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
        <font-awesome-icon icon="bell" style="height: 26px"></font-awesome-icon>
      </div>
    </b-button>

    <b-badge v-if="notificationCount > 0" @click="openBuilder($event)" variant="danger" class="cursor-pointer absolute"
      style="right: 0.1rem; bottom: 0.1rem">{{ "1"
      }}</b-badge>
  </fragment>
</template>

<script lang="ts">
import { ModalAction, ModalType } from '@/consts';
import { IPluginState } from '@/interfaces';
import { builderManager } from '@/modules/builder-manager.module';
import { modalManager } from '@/modules/modal-manager.module';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import {
  failedRowCount,
  pendingOrInflightRowCount,
  successRowCount,
  totalRowCount,
} from '@/utils/builder';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'AnnouncementsButton',
  store,
  components: {
  },
  computed: {
    ...mapState({
      // @ts-ignore
      authState: (state: IPluginState) => state.pluginAuth.authState,
      trackedInteractions: (state: IPluginState) => state.trackedInteractions,
      metrcStatusData: (state: IPluginState) => state.metrcStatusData,
      settings: (state: IPluginState) => state.settings,
      notificationCount: (state: IPluginState) => state.announcements.notificationCount,
    }),
    pendingOrInflightRowCount() {
      return pendingOrInflightRowCount(this.$data.activeProject);
    },
    successRowCount() {
      return successRowCount(this.$data.activeProject);
    },
    failedRowCount() {
      return failedRowCount(this.$data.activeProject);
    },
    totalRowCount() {
      return totalRowCount(this.$data.activeProject);
    },
    progressVariant() {
      if (pendingOrInflightRowCount(this.$data.activeProject) > 0) {
        if (failedRowCount(this.$data.activeProject) > 0) {
          return 'warning';
        }
        return 'primary';
      }

      // This means there are no pending rows
      if (failedRowCount(this.$data.activeProject) > 0) {
        return 'danger';
      }

      return 'success';
    },
  },
  data() {
    return {
      activeProject: null,
    };
  },
  methods: {
    dismissBuilderPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedBuilderPopover = true;
      trackedInteractions.dismissedToolboxPopover = true;

      // @ts-ignore
      this.$refs['builder-popover'].$emit('close');
      // @ts-ignore
      this.$refs['builder-popover'].$emit('disable');

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openBuilder() {
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/announcements",
      });
    },
  },
  async created() {
    this.$data.activeProject = builderManager.activeBuilderProject;

    builderManager.activeBuilderProjectUpdate.subscribe(() => {
      this.$data.activeProject = builderManager.activeBuilderProject;
    });
  },
});
</script>

<style type="text/scss" lang="scss">
// Override metrc bootstrap
#popover-container {
  .btn-group {
    border-radius: 4px;
    padding-top: 0;
  }
}

@keyframes colorAndSizeChange {

  0%,
  100% {
    // background-color: rgb(255, 0, 0) !important;
    transform: scale(1);
  }

  50% {
    // background-color: rgb(255, 98, 50) !important;
    transform: scale(1.2);
  }
}

.notification-breathe {
  background-color: rgb(221, 46, 119) !important;
  animation: colorAndSizeChange 4s infinite;
}
</style>
