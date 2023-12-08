<template>
  <fragment>
    <template v-if="createPackageCsvState.status === PackageCsvStatus.INITIAL">
      <div class="flex flex-col items-center justify-center h-full">
        <div class="flex flex-col items-stretch max-w-md gap-8 text-center">
          <div class="flex flex-col gap-2">
            <label
              v-if="createPackageCsvState.status === PackageCsvStatus.INITIAL"
              class="btn btn-outline-primary mb-0"
            >
              <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>

              UPLOAD CSV
            </label>
          </div>

          <div class="flex flex-col gap-2">
            <b-button variant="outline-primary" @click="generateCsvTemplate()"
              >DOWNLOAD TEMPLATE</b-button
            >
          </div>

          <div class="flex flex-col gap-2">
            <b-button
              variant="outline-primary"
              @click="open('/package/create-package-csv/instructions')"
              >HOW TO USE</b-button
            >
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-col gap-8">
        <div class="flex row-col items-center gap-4">
          <b-button
            v-if="createPackageCsvState.status !== PackageCsvStatus.INITIAL"
            @click="reset()"
            variant="outline-primary"
            >RESET</b-button
          >

          <template v-if="createPackageCsvState.status === PackageCsvStatus.INFLIGHT">
            <div class="flex flex-row gap-2 items-center text-lg">
              <b-spinner small></b-spinner>
              <div>{{ createPackageCsvState.statusMessage }}</div>
            </div>
          </template>

          <template v-if="createPackageCsvState.status === PackageCsvStatus.ERROR">
            <div class="flex flex-row gap-2 items-center text-lg text-red-500">
              {{ createPackageCsvState.statusMessage }}
            </div>
          </template>
        </div>

        <div>
          <template v-if="createPackageCsvState.status === PackageCsvStatus.PARSED">
            <b-tabs>
              <b-tab title="Summary" active>
                <template v-if="createPackageCsvState.rowGroups">
                  <div
                    class="grid grid-cols-4 gap-4 place-items-center my-4"
                    style="grid-template-columns: 1fr 0fr 1fr minmax(200px, 400px)"
                  >
                    <template v-for="[idx, rowGroup] of createPackageCsvState.rowGroups.entries()">
                      <fragment v-bind:key="rowGroup.destinationLabel">
                        <!-- input packages -->
                        <div class="grid grid-cols-2 gap-4" style="grid-template-columns: 1fr auto">
                          <template
                            v-for="[j, ingredient] of rowGroup.parsedData.Ingredients.entries()"
                          >
                            <fragment v-bind:key="j + rowGroup.destinationLabel">
                              <canonical-package-card
                                :pkg="ingredient.pkg"
                              ></canonical-package-card>
                              <div class="w-16 flex flex-col items-center justify-center">
                                {{ ingredient.Quantity }}
                                {{ ingredient.UnitOfMeasure ? ingredient.UnitOfMeasure : null }}
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
                            :pkg="rowGroup.mockPackage"
                          ></canonical-package-card>
                        </div>

                        <!-- messages -->
                        <div class="flex flex-col gap-2 place-self-start">
                          <package-csv-message
                            class="text-red-500"
                            :msg="error"
                            v-for="[idx, error] of rowGroup.errors.entries()"
                            v-bind:key="'error' + idx"
                          ></package-csv-message>

                          <package-csv-message
                            class="text-orange-500"
                            :msg="warning"
                            v-for="[idx, warning] of rowGroup.warnings.entries()"
                            v-bind:key="'warning' + idx"
                          ></package-csv-message>

                          <package-csv-message
                            class="text-blue-500"
                            :msg="message"
                            v-for="[idx, message] of rowGroup.messages.entries()"
                            v-bind:key="'message' + idx"
                          ></package-csv-message>
                        </div>
                      </fragment>
                    </template>
                  </div>
                </template>
              </b-tab>

              <b-tab title="Data Table">
                <template v-if="createPackageCsvState.rowGroups">
                  <b-table-simple class="my-4">
                    <b-tr>
                      <b-th v-for="column of CREATE_PACKAGE_CSV_COLUMNS" v-bind:key="column.value">
                        {{ column.value }}
                      </b-th>
                    </b-tr>

                    <template v-for="rowGroup of createPackageCsvState.rowGroups">
                      <b-tr
                        v-for="dataRow of rowGroup.dataRows"
                        v-bind:key="rowGroup.destinationLabel + dataRow.Index"
                      >
                        <b-td
                          v-for="column of CREATE_PACKAGE_CSV_COLUMNS"
                          v-bind:key="dataRow.Index + column.value"
                        >
                          {{ dataRow[column.value] }}
                        </b-td>
                      </b-tr>
                    </template>
                  </b-table-simple>
                </template>
              </b-tab>

              <b-tab title="Raw Data">
                <template v-if="createPackageCsvState.csvData">
                  <pre class="my-4">{{
                    JSON.stringify(createPackageCsvState.csvData, null, 2)
                  }}</pre>
                </template>
              </b-tab>
            </b-tabs>
          </template>
        </div>
      </div>
    </template>
  </fragment>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  CREATE_PACKAGE_CSV_COLUMNS,
  CreatePackageCsvActions,
  CreatePackageCsvColumns,
  PackageCsvStatus,
} from "@/store/page-overlay/modules/create-package-csv/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
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

    open(path: string) {
      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${path}`,
      });

      this.$router.push(path);
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
