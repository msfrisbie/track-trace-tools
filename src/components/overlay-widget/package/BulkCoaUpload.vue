<template>
  <div class="grid grid-cols-3 gap-8">
    <div class="h-full flex flex-col justify-start items-stretch gap-2">
      <label v-if="labCsvState.status === LabCsvStatus.INITIAL" class="btn btn-primary mb-0">
        <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>

        UPLOAD CSV
      </label>

      <label
        v-if="!hasErrors && labCsvState.status === LabCsvStatus.UPLOADED_CSV"
        class="btn btn-primary mb-0"
      >
        <b-form-file class="hidden" v-model="coaFiles" accept=".pdf" multiple></b-form-file>

        SELECT COAs
      </label>

      <b-button
        v-if="!hasErrors && labCsvState.status === LabCsvStatus.UPLOADED_COAS"
        variant="success"
        @click="uploadCOAs()"
        >UPLOAD COAs TO METRC</b-button
      >

      <b-button
        v-if="labCsvState.status !== LabCsvStatus.INITIAL"
        @click="reset()"
        variant="warning"
        >RESET</b-button
      >
    </div>

    <div class="h-full flex flex-col justify-start items-stretch gap-2">
      <div v-for="[idx, filedata] of labCsvState.files.entries()" v-bind:key="idx">
        {{ filedata.filename }}
      </div>
    </div>

    <div class="h-full flex flex-col justify-start items-stretch gap-2">
      <div v-for="[idx, statusMessage] of labCsvState.statusMessages.entries()" v-bind:key="idx">
        <span v-if="statusMessage.variant === 'primary'" class="text-purple-500">{{
          statusMessage.text
        }}</span>
        <span v-if="statusMessage.variant === 'danger'" class="text-red-500">{{
          statusMessage.text
        }}</span>
        <span v-if="statusMessage.variant === 'warning'" class="text-yellow-500">{{
          statusMessage.text
        }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { BuilderType } from "@/consts";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  LabCsvActions,
  LabCsvGetters,
  LabCsvStatus,
} from "@/store/page-overlay/modules/lab-csv/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "BulkCoaUpload",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      labCsvState: (state: IPluginState) => state.labCsv,
    }),
    ...mapGetters({
      hasErrors: `labCsv/${LabCsvGetters.HAS_ERRORS}`,
    }),
  },
  data() {
    return {
      LabCsvStatus,
      csvFile: null,
      coaFiles: null,
      builderType: BuilderType.ASSIGN_LAB_COA,
    };
  },
  methods: {
    ...mapActions({
      reset: `labCsv/${LabCsvActions.RESET}`,
      uploadCOAs: `labCsv/${LabCsvActions.UPLOAD_COA_FILES}`,
    }),
    submit() {},
  },
  async created() {},
  async mounted() {},
  watch: {
    csvFile: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        store.dispatch(`labCsv/${LabCsvActions.LOAD_CSV}`, {
          file: newValue,
        });
      },
    },
    coaFiles: {
      immediate: true,
      handler(newValue, oldValue) {
        console.log({ newValue });

        if (!newValue || (newValue.length ?? 0) === 0) {
          return;
        }

        store.dispatch(`labCsv/${LabCsvActions.SELECT_COA_FILES}`, {
          files: newValue,
        });
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
