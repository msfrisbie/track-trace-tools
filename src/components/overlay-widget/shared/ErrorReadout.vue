<template>
  <div class="w-full flex flex-col items-center space-y-4">
    <template v-if="inflight">
      <div class="flex flex-row space-x-4 text-gray-500">
        <b-spinner small /> <span>{{ loadingMessage }}</span>
      </div>
    </template>

    <template v-if="error">
      <span class="text-red-700 font-bold">
        {{ errorMessage }}
      </span>

      <template v-if="permissionError">
        <span class="text-red-700">
          {{ permissionsErrorMessage }}
        </span>
      </template>

      <template v-if="zeroResultsError">
        <span class="text-red-700">
          {{ zeroResultsErrorMessage || "Metrc returned zero results." }}
          <template v-if="zeroResultsErrorSuggestionMessage">{{
            zeroResultsErrorSuggestionMessage
          }}</template>
        </span>
      </template>

      <template v-if="serverError">
        <span class="text-red-700">Metrc returned an error. Try again in a few seconds.</span>

        <b-button variant="outline-dark" @click="emitRetry()">RETRY</b-button>
      </template>

      <template v-if="networkError">
        <span class="text-red-700">Network error. Check your internet connection.</span>

        <b-button variant="outline-dark" @click="emitRetry()">RETRY</b-button>
      </template>

      <template v-if="unknownError">
        <span class="text-red-700">
          T3 is blocked from accessing Metrc. Check if internet firewalls or other browser
          extensions are causing this.
        </span>

        <span class="text-red-700">
          {{ error.toString() }}
        </span>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { DataLoadError, DataLoadErrorType } from '@/modules/data-loader/data-loader-error';
import store from '@/store/page-overlay/index';
import Vue from 'vue';

export default Vue.extend({
  name: 'ErrorReadout',
  store,
  props: {
    inflight: { type: Boolean, required: true },
    error: { type: Error, required: false },
    loadingMessage: { type: String, required: true },
    errorMessage: { type: String, required: true },
    permissionsErrorMessage: { type: String, required: true },
    zeroResultsErrorMessage: { type: String, required: false },
    zeroResultsErrorSuggestionMessage: { type: String, required: false },
  },
  methods: {
    emitRetry() {
      this.$emit('retry');
    },
  },
  watch: {
    error: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue) {
          analyticsManager.track(AnalyticsEvent.BUILDER_ERROR_READOUT, {
            error: newValue,
            errorMessage: newValue.toString(),
            errorType: newValue.errorType,
          });
        }
      },
    },
  },
  computed: {
    permissionError() {
      // @ts-ignore
      return this.$props.error?.errorType === DataLoadErrorType.PERMISSIONS;
    },
    serverError() {
      // @ts-ignore
      return this.$props.error?.errorType === DataLoadErrorType.SERVER;
    },
    networkError() {
      // @ts-ignore
      return this.$props.error?.errorType === DataLoadErrorType.NETWORK;
    },
    zeroResultsError() {
      // @ts-ignore
      return this.$props.error?.errorType === DataLoadErrorType.ZERO_RESULTS;
    },
    unknownError() {
      // @ts-ignore
      return !(this.$props.error instanceof DataLoadError);
    },
  },
});
</script>
