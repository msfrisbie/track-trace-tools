<template>
  <fragment>
    <b-button id="report-popover-target" variant="primary" title="Report" class="relative" @click="openReport($event)"
      style="padding: 0">
      <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
        <complex-icon primaryIconName="table" primaryIconSize="2xl"></complex-icon>
      </div>

      <b-popover target="report-popover-target" triggers="hover" placement="topleft" variant="light" ref="report-popover"
        :disabled="trackedInteractions.dismissedReportPopover" container="popover-container">
        <template #title>
          <div class="flex flex-row items-center space-x-2">
            <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
            <span class="text-base font-bold">T3 Reports</span>
          </div>
        </template>

        <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
          <p>Export Metrc data in bulk or generate advanced reports.</p>

          <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissReportPopover()">GOT IT</b-button>
        </div>
      </b-popover>
    </b-button>
  </fragment>
</template>

<script lang="ts">
import { ModalAction, ModalType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { modalManager } from "@/modules/modal-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";
import ComplexIcon from "../overlay-widget/shared/ComplexIcon.vue";
import TrackTraceToolsLogo from "../shared/TrackTraceToolsLogo.vue";

export default Vue.extend({
  name: "ReportButton",
  store,
  components: {
    ComplexIcon,
    TrackTraceToolsLogo
  },
  data() {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      trackedInteractions: (state: IPluginState) => state.trackedInteractions,
      metrcTableState: (state: IPluginState) => state.metrcTable,
    }),
  },
  methods: {
    dismissReportPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedReportPopover = true;

      // @ts-ignore
      this.$refs["report-popover"].$emit("close");
      // @ts-ignore
      this.$refs["report-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openReport() {
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/google-sheets-export",
      });
    },
  },
});
</script>
