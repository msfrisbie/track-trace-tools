<template>
  <div class="flex flex-col space-y-4 items-center">
    <!-- https://mattzollinhofer.github.io/vue-typeahead-bootstrap-docs/examples/examples.html#prepend-append -->

    <b-form-group class="w-full" :label="label" label-size="sm" :description="inputDescription" label-class="text-gray-400">
      <template v-if="transfer">
        <b-button-group class="self-start">
          <b-button
            size="md"
            variant="primary"
            class="overflow-x-hidden"
            style="max-width: 400px"
            disabled
            >{{ transfer.ManifestNumber }}</b-button
          >
          <b-button
            size="md"
            variant="primary"
            @click="
              $emit('update:transfer', null);
              transferQuery = '';
            "
            >&#10005;</b-button
          >
        </b-button-group>
      </template>

      <template v-if="!transfer">
        <vue-typeahead-bootstrap
          style="position: relative"
          v-model="transferQuery"
          :data="transfers"
          :serializer="(transfer) => `${transfer.ManifestNumber} ${transfer.DeliveryFacilities}`"
          :minMatchingChars="0"
          :showOnFocus="true"
          :maxMatches="100"
          @hit="addTransfer($event)"
          type="text"
          required
          placeholder="Manifest #"
          class="w-full"
          size="md"
          ref="typeahead"
        >
        <template slot="suggestion" slot-scope="{ htmlText, data }">
                <div class="w-full flex flex-col items-start justify-start gap-2">
                  <div>{{ data.ManifestNumber }}: {{ data.DeliveryFacilities }}</div>
                  <div>{{ data.PackageCount }} packages</div>
                </div></template>
      </vue-typeahead-bootstrap>
      </template>
    </b-form-group>

    <error-readout
      v-if="error || inflight"
      class="text-center"
      :inflight="inflight"
      :error="error"
      loadingMessage="Loading transfers..."
      errorMessage="Unable to load transfers."
      zeroResultsErrorMessage="Metrc returned 0 eligible transfers."
      :zeroResultsErrorSuggestionMessage="zeroResultsErrorSuggestionMessage"
      permissionsErrorMessage="Check that your employee account has 'Manage Transfers' permissions."
      v-on:retry="loadTransfers()"
    />
  </div>
</template>

<script lang="ts">
import ErrorReadout from '@/components/overlay-widget/shared/ErrorReadout.vue';
import {
  IIndexedTransferData,
  ITransferData
} from '@/interfaces';
import { DataLoadError, DataLoadErrorType } from '@/modules/data-loader/data-loader-error';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import store from '@/store/page-overlay/index';
import { timer } from 'rxjs';
import Vue from 'vue';

export default Vue.extend({
  name: 'TransferPicker',
  store,
  components: {
    ErrorReadout,
  },
  async mounted() {
    this.loadTransfers();
  },
  props: {
    label: {
      type: String,
      required: false,
      default: '',
    },
    reopenPickerAfterSelect: {
      type: Boolean,
      default: true,
    },
    inputDescription: {
      type: String,
      default: ""
    },
    transfer: Object as () => IIndexedTransferData,
    zeroResultsErrorSuggestionMessage: String,
  },
  data() {
    return {
      transferQuery: '',
      inflight: false,
      error: null,
      transfers: [],
    };
  },
  computed: {},
  watch: {
    transferQuery: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
      },
    },
  },
  methods: {
    addTransfer(transfer: ITransferData) {
      this.$emit("addTransfer", transfer);

      timer(300).subscribe(() => this.clear());
    },
    focus() {
      // @ts-ignore
      this.$refs.typeahead?.$el.querySelector("input").focus();
    },
    blur() {
      // @ts-ignore
      this.$refs.typeahead?.$el.querySelector("input").blur();
    },
    clear() {
      this.$data.transferQuery = "";
      // @ts-ignore
      this.$refs.typeahead?.$el.querySelector("input").value = "";

      // @ts-ignore
      this.blur();

      if (this.reopenPickerAfterSelect) {
        // @ts-ignore
        timer(0).subscribe(() => this.focus());
      }
    },
    async loadTransfers() {
      this.$data.inflight = false;
      this.$data.error = null;

      // if (this.$data.transferQuery.length === 0) {
      //   this.$data.transfers = [];
      //   return;
      // }

      try {
        this.$data.inflight = true;

        this.$data.transfers = await primaryDataLoader.outgoingTransfers();
      } catch (e) {
        console.log('error', e);
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }

      if (this.$data.transfers.length === 0) {
        console.error('Server returned 0 transfers');
        this.$data.error = new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          'Zero results returned',
        );
      }
    },
  },
});
</script>
