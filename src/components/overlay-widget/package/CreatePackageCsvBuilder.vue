<template>
  <fragment>
    <template v-if="createPackageCsvState.status === PackageCsvStatus.INITIAL">
      <div class="flex flex-col items-center justify-center h-full">
        <div class="flex flex-col items-stretch max-w-md gap-8 text-center">
          <template v-if="!submitEnabled">
            <div class="flex flex-row gap-1 items-center">
              <div class="text-lg">This is a tool preview.</div>
              <b-button variant="link" @click="open('/plus')">Unlock with T3+</b-button>
            </div>
          </template>

          <div class="flex flex-col gap-2">
            <label
              v-if="createPackageCsvState.status === PackageCsvStatus.INITIAL"
              class="btn btn-primary mb-0"
            >
              <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>

              UPLOAD CSV
            </label>
          </div>

          <div class="flex flex-col gap-2">
            <b-button variant="outline-primary" @click="generateCsvTemplate()"
              >DOWNLOAD CSV TEMPLATE</b-button
            >
          </div>

          <div class="flex flex-col gap-2">
            <b-button
              variant="outline-primary"
              @click="open('/package/create-package-csv/instructions')"
              >HOW TO USE</b-button
            >
          </div>

          <div class="flex flex-col gap-2 max-w-md text-blue-500 text-lg">
            NOTE: This tool is in beta. Once you upload a CSV, ensure the values displayed in the
            "Smart CSV Data" tab are correct before submitting.
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-col gap-8">
        <div class="flex flex-row items-center gap-4 justify-between">
          <div class="flex flex-row items-center gap-4">
            <template v-if="createPackageCsvState.status === PackageCsvStatus.INFLIGHT">
              <div class="flex flex-row gap-2 items-center text-base text-gray-500">
                <b-spinner small></b-spinner>
                <div>{{ createPackageCsvState.statusMessage }}</div>
              </div>
            </template>

            <template v-if="createPackageCsvState.status === PackageCsvStatus.ERROR">
              <div class="flex flex-row gap-2 items-center text-lg text-red-500">
                {{ createPackageCsvState.statusMessage }}
              </div>
            </template>

            <template v-if="createPackageCsvState.status === PackageCsvStatus.PARSED">
              <div class="flex flex-col gap-1">
                <div class="flex flex-row gap-2 items-center text-lg ttt-purple">
                  Loaded
                  <span class="font-bold">{{ createPackageCsvState.csvData.length - 1 }}</span>
                  CSV data row{{ createPackageCsvState.csvData.length - 1 === 1 ? "" : "s" }}.
                </div>

                <!-- <div class="flex flex-row gap-2 items-center text-lg ttt-purple">
                  Submitting will create
                  <span class="font-bold">{{ createPackageCsvState.rowGroups.length }}</span>
                  new package{{ createPackageCsvState.rowGroups.length === 1 ? "" : "s" }}.
                </div> -->

                <div
                  class="flex flex-row gap-2 items-center text-lg text-red-500"
                  v-if="totalErrorCount > 0"
                >
                  {{ totalErrorCount }} error{{ totalErrorCount === 1 ? "" : "s" }} must be fixed
                  before submitting.
                </div>
              </div>
            </template>
          </div>

          <template v-if="!submitEnabled">
            <div class="flex flex-row gap-1 items-center">
              <div class="text-lg">This is a tool preview.</div>
              <b-button variant="link" @click="open('/plus')">Unlock with T3+</b-button>
            </div>
          </template>

          <div class="flex flex-row items-center gap-4">
            <b-button
              v-if="submitEnabled && createPackageCsvState.status === PackageCsvStatus.PARSED"
              :disabled="!eligibleForSubmit"
              @click="submit()"
              variant="success"
              >CREATE {{ createPackageCsvState.rowGroups.length }} PACKAGE{{
                createPackageCsvState.rowGroups.length === 1 ? "" : "S"
              }}</b-button
            >

            <b-button
              v-if="createPackageCsvState.status !== PackageCsvStatus.INITIAL"
              @click="reset()"
              variant="outline-primary"
              >RESET</b-button
            >
          </div>
        </div>

        <div>
          <template v-if="createPackageCsvState.status === PackageCsvStatus.PARSED">
            <b-tabs pills card>
              <b-tab title="Summary" active>
                <template v-if="createPackageCsvState.rowGroups">
                  <!-- the autoformat line breaks mess up the template compiler, using template str-->
                  <div
                    class="grid grid-cols-4 gap-8 place-items-center my-4"
                    :style="`grid-template-columns: minmax(350px, auto) 50px minmax(300px, auto) minmax(200px, auto);`"
                  >
                    <template v-for="[idx, rowGroup] of createPackageCsvState.rowGroups.entries()">
                      <fragment v-bind:key="rowGroup.destinationLabel">
                        <!-- input packages -->
                        <div
                          class="grid grid-cols-2 gap-4 w-full"
                          style="grid-template-columns: 1fr auto"
                        >
                          <template
                            v-for="[j, ingredient] of rowGroup.parsedData.Ingredients.entries()"
                          >
                            <fragment v-bind:key="j + rowGroup.destinationLabel">
                              <div>
                                <canonical-package-card
                                  v-if="ingredient.pkg"
                                  :pkg="ingredient.pkg"
                                ></canonical-package-card>
                              </div>

                              <div
                                class="flex flex-col items-center justify-center p-4 border border-1 rounded-lg text-base font-bold whitespace-nowrap"
                              >
                                {{ ingredient.Quantity }}
                                {{
                                  ingredient.UnitOfMeasure
                                    ? ingredient.UnitOfMeasure.Abbreviation
                                    : null
                                }}
                              </div>
                            </fragment>
                          </template>
                        </div>

                        <!-- arrow -->
                        <div>
                          <font-awesome-icon icon="arrow-right" size="xl"></font-awesome-icon>
                        </div>

                        <!-- output package -->
                        <div>
                          <canonical-package-card
                            class="w-full"
                            :pkg="rowGroup.mockPackage"
                            v-if="rowGroup.mockPackage"
                          ></canonical-package-card>
                        </div>

                        <!-- messages -->
                        <div class="flex flex-col gap-2 place-self-start">
                          <div
                            class="flex flex-row items-center gap-2 text-red-500"
                            v-for="[idx, error] of rowGroup.errors.entries()"
                            v-bind:key="'error' + idx"
                          >
                            <font-awesome-icon
                              size="lg"
                              icon="exclamation-triangle"
                            ></font-awesome-icon>
                            <package-csv-message :msg="error"></package-csv-message>
                          </div>

                          <div
                            class="flex flex-row items-center gap-2 text-orange-500"
                            v-for="[idx, warning] of rowGroup.warnings.entries()"
                            v-bind:key="'warning' + idx"
                          >
                            <font-awesome-icon
                              size="lg"
                              icon="exclamation-triangle"
                            ></font-awesome-icon>
                            <package-csv-message :msg="warning"></package-csv-message>
                          </div>

                          <div
                            class="flex flex-row items-center gap-2 text-blue-500"
                            v-for="[idx, message] of rowGroup.messages.entries()"
                            v-bind:key="'message' + idx"
                          >
                            <font-awesome-icon size="lg" icon="info-circle"></font-awesome-icon>
                            <package-csv-message class="" :msg="message"></package-csv-message>
                          </div>
                        </div>

                        <div class="col-span-4 border border-1 w-full h-px"></div>
                      </fragment>
                    </template>
                  </div>
                </template>
              </b-tab>

              <b-tab title="Smart CSV Data">
                <template v-if="createPackageCsvState.rowGroups">
                  <b-table-simple class="my-4">
                    <b-tr>
                      <b-th
                        v-for="column of CREATE_PACKAGE_CSV_COLUMNS"
                        v-bind:key="column.value"
                        class="whitespace-nowrap border border-1 text-center"
                      >
                        {{ column.value }}
                      </b-th>
                    </b-tr>

                    <template v-for="[i, rowGroup] of createPackageCsvState.rowGroups.entries()">
                      <b-tr
                        v-for="[j, dataRow] of rowGroup.dataRows.entries()"
                        v-bind:key="rowGroup.destinationLabel + dataRow.Index"
                        class="even:bg-purple-100"
                      >
                        <b-td
                          v-for="column of CREATE_PACKAGE_CSV_COLUMNS"
                          v-bind:key="dataRow.Index + column.value"
                          class="whitespace-nowrap border border-1"
                        >
                          {{ dataRow[column.value] }}
                        </b-td>
                      </b-tr>
                    </template>
                  </b-table-simple>
                </template>
              </b-tab>

              <b-tab title="Raw CSV Data">
                <template v-if="createPackageCsvState.csvData">
                  <b-table-simple class="my-4">
                    <b-tr>
                      <b-th class="whitespace-nowrap border border-1 text-center">
                        <!-- empty -->
                      </b-th>
                      <b-th
                        v-for="[i, column] of CREATE_PACKAGE_CSV_COLUMNS.entries()"
                        v-bind:key="column.value"
                        class="whitespace-nowrap border border-1 text-center"
                      >
                        {{ cellColumnFromIndex(i) }}
                      </b-th>
                    </b-tr>

                    <b-tr
                      v-for="[i, row] of createPackageCsvState.csvData.entries()"
                      v-bind:key="`${i}row`"
                      class="even:bg-purple-100"
                    >
                      <b-th class="whitespace-nowrap border border-1 text-center">{{ i + 1 }}</b-th>
                      <b-td
                        class="whitespace-nowrap border border-1"
                        v-for="[j, cell] of row.entries()"
                        v-bind:key="`${i},${j}`"
                      >
                        {{ cell }}
                      </b-td>
                    </b-tr>
                  </b-table-simple>
                </template>
              </b-tab>

              <!-- <b-tab title="Raw CSV Data">
                <template v-if="createPackageCsvState.csvData">
                  <pre class="my-4">{{
                    JSON.stringify(createPackageCsvState.csvData, null, 2)
                  }}</pre>
                </template>
              </b-tab> -->
            </b-tabs>
          </template>
        </div>
      </div>
    </template>
  </fragment>
</template>

<script lang="ts">
import { BuilderType, MessageType } from "@/consts";
import { IMetrcCreatePackagesFromPackagesPayload, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  CREATE_PACKAGE_CSV_COLUMNS,
  CreatePackageCsvActions,
  CreatePackageCsvColumns,
  CreatePackageCsvGetters,
  PackageCsvStatus,
} from "@/store/page-overlay/modules/create-package-csv/consts";
import { cellColumnFromIndex } from "@/utils/csv";
import { submitDateFromIsodate } from "@/utils/date";
import _ from "lodash-es";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import CanonicalPackageCard from "../shared/CanonicalPackageCard.vue";
import PackageCsvMessage from "../shared/PackageCsvMessage.vue";

export default Vue.extend({
  name: "CreatePackageCsvBuilder",
  store,
  router,
  props: {},
  components: { PackageCsvMessage, CanonicalPackageCard },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      createPackageCsvState: (state: IPluginState) => state.createPackageCsv,
    }),
    ...mapGetters({
      eligibleForSubmit: `createPackageCsv/${CreatePackageCsvGetters.ELIGIBLE_FOR_SUBMIT}`,
      totalErrorCount: `createPackageCsv/${CreatePackageCsvGetters.TOTAL_ERROR_COUNT}`,
    }),
    submitEnabled(): boolean {
      return store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus;
    },
  },
  data() {
    return {
      CreatePackageCsvColumns,
      PackageCsvStatus,
      csvFile: null,
      CREATE_PACKAGE_CSV_COLUMNS,
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
    cellColumnFromIndex,
    open(path: string) {
      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${path}`,
      });

      this.$router.push(path);
    },
    submit() {
      const rows: IMetrcCreatePackagesFromPackagesPayload[] =
        store.state.createPackageCsv.rowGroups.map((rowGroup) => {
          const parsedData = rowGroup.parsedData!;

          const row: IMetrcCreatePackagesFromPackagesPayload = {
            ActualDate: submitDateFromIsodate(parsedData.ActualDate!),
            Ingredients: parsedData.Ingredients!.map((ingredient) => ({
              FinishDate: "", // Default to do not finish
              PackageId: ingredient.pkg!.Id.toString(),
              Quantity: ingredient.Quantity!.toString(),
              UnitOfMeasureId: ingredient.UnitOfMeasure!.Id.toString(),
            })),
            ItemId: parsedData.Item!.Id.toString(),
            Note: parsedData.Note!,
            Quantity: parsedData.Quantity!.toString(),
            TagId: parsedData.Tag!.Id.toString(),
            UnitOfMeasureId: parsedData.Item!.UnitOfMeasureId.toString(),
            RemediationDate: "",
            RemediationMethodId: "0", // await defaultRemediatePackageMethod(),
            RemediationSteps: "",
            UseByDate: "",
            SellByDate: "",
            ExpirationDate: parsedData.ExpirationDate
              ? submitDateFromIsodate(parsedData.ExpirationDate!)
              : "",
            ProductionBatchNumber: parsedData.ProductionBatchNumber!,
            ...(parsedData.IsDonation ? { IsDonation: "true" } : {}),
            ...(parsedData.IsTradeSample ? { IsTradeSample: "true" } : {}),
            LocationId: parsedData.Location!.Id.toString(),
            // UseSameItem: "false", // default to false and just provide the item id anyway
          };

          return row;
        });

      builderManager.submitProject(
        // This is probably redundant
        _.cloneDeep(rows),
        BuilderType.CSV_CREATE_PACKAGE,
        {
          packageTotal: store.state.createPackageCsv.rowGroups.length,
        },
        [],
        1 // This is to address Metrc package allocation bug https://track-trace-tools.talkyard.net/-65/unpack-immature-packages
      );
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

        store.dispatch(`createPackageCsv/${CreatePackageCsvActions.IMPORT_CSV}`, {
          file: newValue,
        });
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
