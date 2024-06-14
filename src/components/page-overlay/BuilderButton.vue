<template>
  <fragment>
    <b-button variant="primary" @click="openBuilder($event)" title="Toolbox" id="builder-popover-target"
      v-bind:class="{ 'notification-breathe': notificationCount > 0 }" style="padding: 0; width: 52px"
      class="flex flex-col items-center justify-center">
      <!-- class="bg-gray-50 hover:bg-gray-200 rounded-full shadow-2xl border border-gray-400 h-16 w-16 flex items-center justify-center cursor-pointer" -->

      <template v-if="!activeProject">
        <!-- <font-awesome-icon icon="tools" size="2x" v-bind:style="{ color: '#49276a' }" /> -->
        <track-trace-tools-logo fill="transparent" :inverted="true" style="height: 52px; width: 52px" />
      </template>

      <template v-if="activeProject && pendingOrInflightRowCount > 0">
        <b-spinner class="ttt-purple" />
      </template>

      <template v-if="activeProject && pendingOrInflightRowCount === 0 && failedRowCount === 0">
        <font-awesome-icon icon="check" size="2x" class="text-green-700" />
      </template>

      <template v-if="activeProject && pendingOrInflightRowCount === 0 && failedRowCount > 0">
        <font-awesome-icon icon="exclamation-triangle" size="2x" class="text-red-700" />
      </template>

      <b-popover target="builder-popover-target" triggers="hover" placement="top" variant="light" ref="builder-popover"
        :disabled="trackedInteractions.dismissedToolboxPopover" container="popover-container">
        <template #title>
          <div class="flex flex-row items-center space-x-2">
            <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
            <span class="text-base font-bold">TOOLBOX</span>
          </div>
        </template>

        <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
          <p>Rapidly create transfers, harvest plants, manage packages, and more.</p>

          <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissBuilderPopover()">GOT IT</b-button>
        </div>
      </b-popover>
    </b-button>

    <!-- <div v-if="notificationCount > 0"
      class="absolute rounded-full text-white flex flex-col items-center justify-center text-center text-xs border border-white notification-breathe"
      style="width: 0.8rem; height: 0.8rem; bottom: -0.3rem; left: -0.3rem">
    </div> -->
  </fragment>
</template>

<script lang="ts">
import TrackTraceToolsLogo from '@/components/shared/TrackTraceToolsLogo.vue';
import { ModalType } from '@/consts';
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
  name: 'BuilderButton',
  store,
  components: {
    TrackTraceToolsLogo,
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
      modalManager.dispatchModalEvent(ModalType.BUILDER);
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
