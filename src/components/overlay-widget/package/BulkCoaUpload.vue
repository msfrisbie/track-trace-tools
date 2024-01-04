<template>
  <div class="grid grid-cols-2 gap-8" style="grid-template-columns: 300px 1fr">
    <div class="h-full flex flex-col justify-start items-stretch gap-2">
      <label v-if="labCsvState.status === LabCsvStatus.INITIAL" class="btn btn-primary mb-0">
        <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>

        UPLOAD CSV
      </label>

      <b-button
        v-if="labCsvState.status === LabCsvStatus.UPLOADED_COAS"
        :disabled="hasErrors"
        variant="success"
        @click="submit()"
        >SUBMIT</b-button
      >

      <b-button
        v-if="labCsvState.status === LabCsvStatus.SELECTED_COAS"
        :disabled="hasErrors"
        variant="success"
        @click="uploadCOAs()"
        >UPLOAD COA PDFs TO METRC</b-button
      >

      <label
        v-if="
          (!hasErrors || labCsvState.status !== LabCsvStatus.UPLOADED_CSV) &&
          [LabCsvStatus.UPLOADED_CSV, LabCsvStatus.SELECTED_COAS].includes(labCsvState.status)
        "
        class="btn btn-outline-primary mb-0"
      >
        <b-form-file class="hidden" v-model="coaFiles" accept=".pdf" multiple></b-form-file>

        SELECT COA PDFs
      </label>
      <b-button
        v-if="labCsvState.status !== LabCsvStatus.INITIAL"
        @click="reset()"
        variant="outline-dark"
        >RESET</b-button
      >

      <div class="flex flex-col justify-start items-stretch gap-2 text-base">
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

    <div class="h-full flex flex-col justify-start">
      <template v-if="showOutputTable">
        <div class="grid grid-cols-3 gap-2" style="grid-template-columns: 1fr 80px 1fr">
          <fragment v-for="[idx, richPackage] of richPackageLabData.entries()" v-bind:key="idx">
            <template v-if="!richPackage.pkg">
              <div
                class="rounded-md border border-red-500 flex flex-row items-center justify-center gap-2 text-red-500 text-lg"
              >
                <font-awesome-icon icon="exclamation-triangle"></font-awesome-icon>
                <div>No active package matches "{{ richPackage.packageLabel }}"</div>
              </div>
            </template>
            <template v-else>
              <canonical-package-card
                v-if="richPackage.pkg"
                :pkg="richPackage.pkg"
              ></canonical-package-card>
            </template>

            <div class="grid place-items-center text-xl">
              <font-awesome-icon icon="arrow-right"></font-awesome-icon>
            </div>

            <template v-if="!richPackage.file">
              <div
                class="rounded-md border border-gray-200 flex flex-row items-center justify-center gap-2 text-lg text-gray-200"
                style="border-style: dashed !important"
              >
                <font-awesome-icon icon="file-pdf"></font-awesome-icon>
                <div>{{ richPackage.filename }}</div>
              </div>
            </template>
            <template v-else>
              <template v-if="richPackage.file.metrcFileId">
                <div
                  class="rounded-md border flex flex-row items-center justify-center gap-2 text-lg text-green-600"
                  style="border-color: rgb(5, 150, 105) !important"
                >
                  <font-awesome-icon icon="file-pdf"></font-awesome-icon>
                  <div>{{ richPackage.filename }}</div>
                </div>
              </template>
              <template v-else>
                <div
                  class="rounded-md border border-gray-600 flex flex-row items-center justify-center gap-2 text-lg text-gray-600"
                >
                  <font-awesome-icon icon="file-pdf"></font-awesome-icon>
                  <div>{{ richPackage.filename }}</div>
                </div>
              </template>
            </template>
          </fragment>
        </div>
      </template>
      <template v-else>
        <div>TODO INSTRUCTIONS</div>
      </template>
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
import CanonicalPackageCard from "../shared/CanonicalPackageCard.vue";

export default Vue.extend({
  name: "BulkCoaUpload",
  store,
  router,
  props: {},
  components: {
    CanonicalPackageCard,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      labCsvState: (state: IPluginState) => state.labCsv,
    }),
    ...mapGetters({
      hasErrors: `labCsv/${LabCsvGetters.HAS_ERRORS}`,
      richPackageLabData: `labCsv/${LabCsvGetters.RICH_PACKAGE_LAB_DATA}`,
      showOutputTable: `labCsv/${LabCsvGetters.SHOW_OUTPUT_TABLE}`,
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
      submit: `labCsv/${LabCsvActions.ASSIGN_COA_FILES}`,
    }),
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
