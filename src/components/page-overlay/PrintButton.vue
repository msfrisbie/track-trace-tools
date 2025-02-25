<template>
  <fragment>
    <b-button id="print-popover-target" variant="primary" title="Print" class="relative" @click="openPrint($event)"
      style="padding: 0">
      <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
        <complex-icon primaryIconName="print" primaryIconSize="2xl" :secondaryIconName="['far', 'list-alt']"
          secondaryIconClass="ttt-purple w-7 h-7 border-2 ttt-purple-border"></complex-icon>
      </div>

      <b-popover target="print-popover-target" triggers="hover" placement="topleft" variant="light" ref="print-popover"
        :disabled="trackedInteractions.dismissedPrintPopover" container="popover-container">
        <template #title>
          <div class="flex flex-row items-center space-x-2">
            <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
            <span class="text-base font-bold">Label Printing</span>
          </div>
        </template>

        <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
          <p>Instantly generate printable labels prefilled with Metrc data.</p>

          <b-button size="sm" variant="outline-primary" class="mb-2" @click="dismissPrintPopover()">GOT IT</b-button>
        </div>
      </b-popover>
    </b-button>

    <!-- TODO -->
    <!-- <b-badge v-if="metrcTableState.barcodeValues.length > 0" @click="openPrint($event)" variant="warning"
      class="cursor-pointer absolute" style="right: 0.1rem; bottom: 0.1rem">+{{
        metrcTableState.barcodeValues.length
      }}</b-badge> -->
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
  name: "PrintButton",
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
    dismissPrintPopover() {
      const trackedInteractions = JSON.parse(JSON.stringify(store.state.trackedInteractions));

      trackedInteractions.dismissedPrintPopover = true;

      // @ts-ignore
      this.$refs["print-popover"].$emit("close");
      // @ts-ignore
      this.$refs["print-popover"].$emit("disable");

      store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, trackedInteractions);
    },
    async openPrint() {
      // const licenseNumber = (await authManager.authStateOrError()).license;

      // const packageState: PackageState | null = null;
      // const plantState: PlantState | null = null;
      // const plantBatchState: PlantBatchState | null = null;

      // const labelDataList: ILabelData[] = store.state.metrcTable.barcodeValues.map((x) => ({
      //   primaryValue: x,
      //   secondaryValue: null,
      //   tertiaryValue: null,
      //   count: 1,
      //   licenseNumber,
      //   packageState,
      //   plantState,
      //   plantBatchState
      // }));

      // await store.dispatch(`labelPrint/${LabelPrintActions.PUSH_LABELS}`, {
      //   labelDataList
      // });

      // if (labelDataList.length > 0) {
      //   toastManager.openToast(`Added ${labelDataList.length} selected tags to print list`, {
      //     title: "Success",
      //     autoHideDelay: 3000,
      //     variant: "primary",
      //     appendToast: true,
      //     toaster: "ttt-toaster",
      //     solid: true,
      //   });
      // }

      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/tags/print-tags",
      });
    },
  },
});
</script>
