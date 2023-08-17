<template>
  <div class="flex flex-col items-center">
    <div class="max-w-md w-full flex flex-col space-y-6">
      <span class="text-red-700">
        Note: Metrc's finalize interface is unstable. This tool will halt if it detects that Metrc's
        finalize interface goes down.
      </span>

      <b-form-group label="Finalize all sales receipts prior to:">
        <b-form-datepicker
          v-model="stopIsodate"
          :disabled="isBackgroundTaskRunning"
          @input="setStopIsodate($event)"
        ></b-form-datepicker>
      </b-form-group>

      <template v-if="!isBackgroundTaskRunning">
        <b-button :disabled="!stopIsodate" variant="success" @click="startFinalizer()"
          >START</b-button
        >
      </template>

      <template v-else>
        <b-button variant="danger" @click="stopFinalizer()">STOP</b-button>

        <template v-if="backgroundTasks.finalizeSalesReceiptsReadout">
          <div class="flex flex-row items-center justify-center space-x-2 w-full">
            <b-spinner small />
            <span>{{ backgroundTasks.finalizeSalesReceiptsReadout }}</span>
          </div>
        </template>

        <template v-if="backgroundTasks.finalizeSalesReceiptsRunningTotal > 0">
          <span class="font-bold">
            {{ backgroundTasks.finalizeSalesReceiptsRunningTotal }} sales receipts finalized.
          </span>
        </template>

        <div style="height: 4rem"></div>

        <div class="text-center">
          This will continue to run in the background while you are on metrc.com. Hiding the toolkit
          or navigating around Metrc will not interrupt it.
        </div>
      </template>

      <template v-if="isBackgroundTaskSuccess">
        <span class="text-center font-bold"
          >{{ backgroundTasks.finalizeSalesReceiptsReadout }}.</span
        >
      </template>

      <template v-if="isBackgroundTaskError">
        <span class="text-red-500 text-center">{{
          backgroundTasks.finalizeSalesReceiptsReadout
        }}</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { backgroundTaskManager } from "@/modules/background-task-manager.module";
import { BackgroundTaskState } from "@/consts";
import { MutationType } from "@/mutation-types";
import { mapState } from "vuex";
import { IPluginAuthState } from "@/store/page-overlay/modules/plugin-auth/interfaces";
import { IPluginState } from "@/interfaces";

export default Vue.extend({
  name: "FinalizeSalesReceiptsForm",
  store,
  data() {
    return {
      stopIsodate: store.state.backgroundTasks.finalizeSalesReceiptsStopIsodate,
    };
  },
  mounted() {
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_READOUT, "");
  },
  computed: {
    ...mapState<IPluginState>(["backgroundTasks"]),
    isBackgroundTaskRunning() {
      return store.state.backgroundTasks.finalizeSalesReceiptsState === BackgroundTaskState.RUNNING;
    },
    isBackgroundTaskSuccess() {
      return store.state.backgroundTasks.finalizeSalesReceiptsState === BackgroundTaskState.SUCCESS;
    },
    isBackgroundTaskError() {
      return store.state.backgroundTasks.finalizeSalesReceiptsState === BackgroundTaskState.ERROR;
    },
  },
  destroyed() {},
  methods: {
    setStopIsodate(stopIsodate: string): void {
      console.log(stopIsodate);

      store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_STOP_DATE, stopIsodate);
    },
    startFinalizer(): void {
      this.$data.runningTotal = 0;
      backgroundTaskManager.startFinalize();
    },
    stopFinalizer(): void {
      backgroundTaskManager.stopFinalize();
    },
  },
});
</script>
