<template>
  <div class="grid grid-cols-4 gap-8">
    <div class="h-full">
      <div>{{ createPackageCsvState.status }}</div>
      <b-button-group vertical>
        <b-button @click="generateCsvTemplate()">DOWNLOAD TEMPLATE</b-button>
        <b-button
          v-if="createPackageCsvState.status !== PackageCsvStatus.INITIAL"
          @click="reset()"
          variant="warning"
          >RESET</b-button
        >
        <label
          v-if="createPackageCsvState.status === PackageCsvStatus.INITIAL"
          class="btn btn-secondary"
        >
          <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>

          UPLOAD CSV
        </label>
      </b-button-group>

      <div>{{ createPackageCsvState.statusMessage }}</div>
    </div>
    <div class="col-span-3 h-full">
      <template v-if="!createPackageCsvState.csvData"> Upload a CSV </template>

      <b-tabs>
        <b-tab title="Package Template" active>
          <template v-if="createPackageCsvState.rowGroups">
            <div class="grid grid-cols-3 gap-8">
              <div>Input</div>
              <div>Output</div>
              <div>Status</div>

              <template v-for="rowGroup of createPackageCsvState.rowGroups">
                <fragment v-bind:key="rowGroup.destinationLabel">
                  <div class="flex flex-col gap-2">
                    <div>
                      {{ rowGroup.dataRows.length }} Package{{
                        rowGroup.dataRows.length > 0 ? "s" : ""
                      }}
                    </div>
                    <div
                      class="flex flex-col gap-4 p-2 rounded border-1 border-gray-200"
                      v-for="[idx, dataRow] of rowGroup.dataRows.entries()"
                      v-bind:key="dataRow.Index + '_' + idx"
                    >
                      <div class="font-mono font-semibold">
                        {{ dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG] }}
                      </div>
                      <div>
                        {{
                          dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED] ||
                          "[QTY MISSING]"
                        }}
                        {{
                          dataRow[
                            CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE
                          ] || "[UNIT MISSING]"
                        }}
                      </div>
                    </div>
                  </div>

                  <!-- assumes that all values are identical -->
                  <div class="flex flex-col gap-2">
                    <div v-for="outputField of outputFields" v-bind:key="outputField">
                      {{ outputField }}: {{ rowGroup.dataRows[0][outputField] }}
                    </div>
                  </div>

                  <div>
                    <div class="flex flex-col gap-2">
                      <div
                        class="text-red-500"
                        v-for="[idx, error] of rowGroup.errors.entries()"
                        v-bind:key="'error' + idx"
                      >
                        {{ error.text }}
                      </div>
                      <div
                        class="text-orange-500"
                        v-for="[idx, warning] of rowGroup.warnings.entries()"
                        v-bind:key="'warning' + idx"
                      >
                        {{ warning.text }}
                      </div>
                      <div
                        class="text-blue-500"
                        v-for="[idx, message] of rowGroup.messages.entries()"
                        v-bind:key="'message' + idx"
                      >
                        {{ message.text }}
                      </div>
                    </div>
                  </div>
                </fragment>
              </template>
            </div>
          </template>
        </b-tab>

        <b-tab title="Data Table">
          <template v-if="createPackageCsvState.csvData">
            <b-table-simple>
              <b-tr
                v-for="[rowIdx, row] of createPackageCsvState.csvData.entries()"
                v-bind:key="rowIdx"
              >
                <b-td v-for="[colIdx, col] of row.entries()" v-bind:key="colIdx">
                  {{ col }}
                </b-td>
              </b-tr>
            </b-table-simple>
          </template>
        </b-tab>

        <b-tab title="Raw Data">
          <template v-if="createPackageCsvState.csvData">
            <pre>{{ JSON.stringify(createPackageCsvState.csvData, null, 2) }}</pre>
          </template>
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  CreatePackageCsvActions,
  CreatePackageCsvColumns,
  PackageCsvStatus,
} from "@/store/page-overlay/modules/create-package-csv/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "CreatePackageCsvBuilder",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      createPackageCsvState: (state: IPluginState) => state.createPackageCsv,
    }),
  },
  data() {
    return {
      CreatePackageCsvColumns,
      PackageCsvStatus,
      csvFile: null,
      outputFields: [
        CreatePackageCsvColumns.NEW_PACKAGE_TAG,
        CreatePackageCsvColumns.LOCATION_NAME,
        CreatePackageCsvColumns.ITEM_NAME,
        CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY,
        CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE,
        CreatePackageCsvColumns.PACKAGED_DATE,
        CreatePackageCsvColumns.NOTE,
        CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER,
        CreatePackageCsvColumns.IS_DONATION,
        CreatePackageCsvColumns.IS_TRADE_SAMPLE,
        CreatePackageCsvColumns.EXPIRATION_DATE,
      ],
    };
  },
  methods: {
    ...mapActions({
      reset: `createPackageCsv/${CreatePackageCsvActions.RESET}`,
      generateCsvTemplate: `createPackageCsv/${CreatePackageCsvActions.GENERATE_CSV_TEMPLATE}`,
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

        store.dispatch(`createPackageCsv/${CreatePackageCsvActions.IMPORT_CSV}`, {
          file: newValue,
        });
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
