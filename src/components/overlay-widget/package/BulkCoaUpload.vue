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

      <template v-if="labCsvState.status === LabCsvStatus.INITIAL">
        <div class="grid grid-cols-2 gap-4 text-base" style="grid-template-columns: auto 1fr">
          <div class="col-span-2 text-lg text-purple-700">
            The <span class="font-semibold">Bulk Add COAs</span> tool can quickly attach COA PDFs to
            any number of packages.
          </div>
          <div class="font-bold">Step 1</div>
          <div>Record tests for packages in Metrc as you currently do.</div>
          <div class="font-bold">Step 2</div>
          <div class="flex flex-col gap-8">
            <div>
              Upload your <span class="font-semibold">COA CSV</span>. This CSV contains a list of
              packages and the name of the COA PDF file that should be attached.
            </div>
            <div>The CSV you upload should have three colums:</div>
            <div>
              <ul class="list-disc ml-6 font-semibold">
                <li>Sample ID (optional, OK to leave blank)</li>
                <li>Package Tag</li>
                <li>COA PDF file name</li>
              </ul>
            </div>
            <div>Example:</div>
            <div class="font-mono">
              <table>
                <tr>
                  <td class="border border-gray-500 p-2">Sample 01</td>
                  <td class="border border-gray-500 p-2">1A4400000000000000000001</td>
                  <td class="border border-gray-500 p-2">test01.pdf</td>
                </tr>
                <tr>
                  <td class="border border-gray-500 p-2"></td>
                  <td class="border border-gray-500 p-2">1A4400000000000000000002</td>
                  <td class="border border-gray-500 p-2">test02.pdf</td>
                </tr>
              </table>
            </div>
            <div>
              <b-button variant="light" @click="downloadCsvTemplate()">DOWNLOAD EMPTY CSV</b-button>
            </div>
          </div>
          <div class="font-bold">Step 3</div>
          <div>
            <div>
              Select the COA PDF files listed in the CSV.
              <span class="font-bold">The names must match exactly.</span>
            </div>
            <div>If everything matches, you can upload the PDF files directly to Metrc.</div>
          </div>
          <div class="font-bold">Step 4</div>
          <div>Click "Submit" to attach the COA PDFs to the tested packages.</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { BuilderType } from "@/consts";
import { ICsvFile, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  LabCsvActions,
  LabCsvGetters,
  LabCsvStatus,
} from "@/store/page-overlay/modules/lab-csv/consts";
import { downloadCsvFile } from "@/utils/csv";
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
    downloadCsvTemplate() {
      const csvFile: ICsvFile = {
        filename: `coa_list_${Date.now()}`,
        data: [
          [
            "Example Sample ID (optional)",
            "EXAMPLE000000000000000001234",
            "example-test-result-01.pdf",
          ],
        ],
      };

      downloadCsvFile({ csvFile });
    },
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
