<template>
  <div>
    <template v-if="oAuthState === OAuthState.INITIAL">
      <b-spinner small></b-spinner>
    </template>

    <template v-if="oAuthState === OAuthState.AUTHENTICATED">
      <div class="grid grid-cols-3 gap-8 w-full">
        <!-- First Column -->
        <div
          class="flex flex-col gap-2 items-stretch"
          v-bind:class="{ 'opacity-50': reportStatus !== ReportStatus.INITIAL }"
        >
          <b-button
            size="sm"
            :disabled="
              eligibleReportOptions.length === selectedReports.length ||
              reportStatus !== ReportStatus.INITIAL
            "
            variant="outline-primary"
            @click="snapshotEverything()"
            >SNAPSHOT EVERYTHING</b-button
          >
          <b-form-group>
            <b-form-checkbox-group v-model="selectedReports" class="flex flex-col gap-4">
              <b-form-checkbox
                v-for="reportOption of reportOptions.filter((x) => !x.premium)"
                v-bind:key="reportOption.value"
                :value="reportOption.value"
                :disabled="reportOption.premium || reportStatus !== ReportStatus.INITIAL"
                ><div class="flex flex-col items-start gap-1">
                  <span class="">{{ reportOption.text }}</span>
                  <span class="text-xs text-gray-400">{{ reportOption.description }}</span>
                </div>
              </b-form-checkbox>
              <div class="text-xs text-center text-gray-600">
                Reach out to
                <a class="text-purple-500 underline" href="mailto:tracktracetools@gmail.com"
                  >tracktracetools@gmail.com</a
                >
                to enable premium exports or request custom snapshot formats.
              </div>
              <b-form-checkbox
                class="opacity-50"
                v-for="reportOption of reportOptions.filter((x) => x.premium)"
                v-bind:key="reportOption.value"
                :value="reportOption.value"
                :disabled="reportOption.premium || reportStatus !== ReportStatus.INITIAL"
                ><div class="flex flex-col items-start gap-1">
                  <span class="">{{ reportOption.text }}</span>
                  <span class="text-xs text-gray-400">{{ reportOption.description }}</span>
                </div>
              </b-form-checkbox>
            </b-form-checkbox-group>
          </b-form-group>
        </div>

        <!-- Middle Column -->
        <div
          v-bind:class="{ invisible: reportStatus !== ReportStatus.INITIAL }"
          class="flex flex-col items-stretch gap-4"
        >
          <template v-if="selectedReports.length === 0">
            <div class="text-red-500 text-center">Select something to include in your snapshot</div>
          </template>
          <template v-else>
            <div class="text-purple-800 text-center">
              Configure your snapshot below. <br />Defaults to all data and fields.
            </div>
          </template>

          <template v-if="selectedReports.includes(ReportType.ACTIVE_PACKAGES)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Active Packages</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.ACTIVE_PACKAGES)"
                  >{{
                    showFilters[ReportType.ACTIVE_PACKAGES] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.ACTIVE_PACKAGES]">
                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="activePackagesFormFilters.includePackagedDateGt">
                      <span class="leading-6">Packaged on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="activePackagesFormFilters.includePackagedDateGt"
                      :disabled="!activePackagesFormFilters.includePackagedDateGt"
                      initial-date
                      size="sm"
                      v-model="activePackagesFormFilters.packagedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="activePackagesFormFilters.includePackagedDateLt">
                      <span class="leading-6">Packaged on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="activePackagesFormFilters.includePackagedDateLt"
                      :disabled="!activePackagesFormFilters.includePackagedDateLt"
                      initial-date
                      size="sm"
                      v-model="activePackagesFormFilters.packagedDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.ACTIVE_PACKAGES)"
                  >{{
                    showFields[ReportType.ACTIVE_PACKAGES] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.ACTIVE_PACKAGES]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="checkAll(ReportType.ACTIVE_PACKAGES)"
                      >CHECK ALL</b-button
                    >
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="uncheckAll(ReportType.ACTIVE_PACKAGES)"
                      >UNCHECK ALL</b-button
                    >
                  </div>

                  <b-form-checkbox-group
                    v-model="fields[ReportType.ACTIVE_PACKAGES]"
                    class="flex flex-col items-start gap-1"
                  >
                    <b-form-checkbox
                      v-for="fieldData of SHEET_FIELDS[ReportType.ACTIVE_PACKAGES]"
                      v-bind:key="fieldData.value"
                      :value="fieldData"
                      :disabled="fieldData.required"
                    >
                      <span class="leading-6">{{ fieldData.readableName }}</span>
                    </b-form-checkbox>
                  </b-form-checkbox-group>
                </template>
              </div>
            </div>
          </template>

          <template v-if="selectedReports.includes(ReportType.MATURE_PLANTS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Mature Plants</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.MATURE_PLANTS)"
                  >{{
                    showFilters[ReportType.MATURE_PLANTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.MATURE_PLANTS]">
                  <b-form-checkbox v-model="maturePlantsFormFilters.includeVegetative">
                    <span class="leading-6">Include Vegetative</span>
                  </b-form-checkbox>
                  <b-form-checkbox v-model="maturePlantsFormFilters.includeFlowering">
                    <span class="leading-6">Include Flowering</span>
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="maturePlantsFormFilters.includePlantedDateGt">
                      <span class="leading-6">Planted on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="maturePlantsFormFilters.includePlantedDateGt"
                      :disabled="!maturePlantsFormFilters.includePlantedDateGt"
                      initial-date
                      size="sm"
                      v-model="maturePlantsFormFilters.plantedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="maturePlantsFormFilters.includePlantedDateLt">
                      <span class="leading-6">Planted on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="maturePlantsFormFilters.includePlantedDateLt"
                      :disabled="!maturePlantsFormFilters.includePlantedDateLt"
                      initial-date
                      size="sm"
                      v-model="maturePlantsFormFilters.plantedDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.MATURE_PLANTS)"
                  >{{
                    showFields[ReportType.MATURE_PLANTS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.MATURE_PLANTS]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="checkAll(ReportType.MATURE_PLANTS)"
                      >CHECK ALL</b-button
                    >
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="uncheckAll(ReportType.MATURE_PLANTS)"
                      >UNCHECK ALL</b-button
                    >
                  </div>

                  <b-form-checkbox-group
                    v-model="fields[ReportType.MATURE_PLANTS]"
                    class="flex flex-col items-start gap-1"
                  >
                    <b-form-checkbox
                      v-for="fieldData of SHEET_FIELDS[ReportType.MATURE_PLANTS]"
                      v-bind:key="fieldData.value"
                      :value="fieldData"
                      :disabled="fieldData.required"
                    >
                      <span class="leading-6">{{ fieldData.readableName }}</span>
                    </b-form-checkbox>
                  </b-form-checkbox-group>
                </template>
              </div>
            </div>
          </template>

          <template v-if="selectedReports.includes(ReportType.OUTGOING_TRANSFERS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Outgoing Transfers</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.OUTGOING_TRANSFERS)"
                  >{{
                    showFilters[ReportType.OUTGOING_TRANSFERS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.OUTGOING_TRANSFERS]">
                  <b-form-checkbox v-model="outgoingTransfersFormFilters.onlyWholesale">
                    <span class="leading-6">Only Wholesale</span>
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="outgoingTransfersFormFilters.includeEstimatedDepartureDateGt"
                    >
                      <span class="leading-6">ETD on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="outgoingTransfersFormFilters.includeEstimatedDepartureDateGt"
                      :disabled="!outgoingTransfersFormFilters.includeEstimatedDepartureDateGt"
                      initial-date
                      size="sm"
                      v-model="outgoingTransfersFormFilters.estimatedDepartureDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="outgoingTransfersFormFilters.includeEstimatedDepartureDateLt"
                    >
                      <span class="leading-6">ETD on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="outgoingTransfersFormFilters.includeEstimatedDepartureDateLt"
                      :disabled="!outgoingTransfersFormFilters.includeEstimatedDepartureDateLt"
                      initial-date
                      size="sm"
                      v-model="outgoingTransfersFormFilters.estimatedDepartureDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.OUTGOING_TRANSFERS)"
                  >{{
                    showFields[ReportType.OUTGOING_TRANSFERS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.OUTGOING_TRANSFERS]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="checkAll(ReportType.OUTGOING_TRANSFERS)"
                      >CHECK ALL</b-button
                    >
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="uncheckAll(ReportType.OUTGOING_TRANSFERS)"
                      >UNCHECK ALL</b-button
                    >
                  </div>

                  <b-form-checkbox-group
                    v-model="fields[ReportType.OUTGOING_TRANSFERS]"
                    class="flex flex-col items-start gap-1"
                  >
                    <b-form-checkbox
                      v-for="fieldData of SHEET_FIELDS[ReportType.OUTGOING_TRANSFERS]"
                      v-bind:key="fieldData.value"
                      :value="fieldData"
                      :disabled="fieldData.required"
                    >
                      <span class="leading-6">{{ fieldData.readableName }}</span>
                    </b-form-checkbox>
                  </b-form-checkbox-group>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- End Column -->
        <div class="flex flex-col gap-4 items-stretch text-center">
          <template v-if="reportStatus === ReportStatus.INITIAL">
            <b-button
              variant="primary"
              @click="createSpreadsheet()"
              :disabled="selectedReports.length === 0"
              >CREATE SNAPSHOT</b-button
            >
          </template>

          <template v-if="reportStatus === ReportStatus.INFLIGHT">
            <div class="flex flex-row items-center gap-4">
              <b-spinner small></b-spinner>
              <span>{{ reportStatusMessage }}</span>
            </div>

            <div class="flex flex-col items-stretch gap-2">
              <div
                v-for="statusMessageHistoryEntry of reportStatusMessageHistory"
                v-bind:key="statusMessageHistoryEntry"
                class="flex flex-row justify-start items-center gap-2"
              >
                <font-awesome-icon class="text-green-400" icon="check"></font-awesome-icon>
                <span class="text-gray-300">{{ statusMessageHistoryEntry }}</span>
              </div>
            </div>
          </template>

          <template v-if="reportStatus === ReportStatus.ERROR">
            <div class="text-red-500">Something went wrong.</div>
            <div>{{ reportStatusMessage }}</div>
            <b-button variant="outline-primary" @click="reset()">RESET</b-button>
          </template>

          <template v-if="reportStatus === ReportStatus.SUCCESS">
            <b-button variant="primary" :href="generatedSpreadsheet.spreadsheetUrl" target="_blank"
              >VIEW SNAPSHOT</b-button
            >
            <b-button variant="outline-primary" @click="reset()">START OVER</b-button>
          </template>

          <div
            class="flex flex-col items-stretch gap-2 text-start py-12"
            v-if="generatedSpreadsheetHistory.length > 0"
          >
            <div style="text-align: start">Recent snapshots:</div>
            <div
              class="flex flex-col items-start"
              v-bind:key="spreadsheetEntry.uuid"
              v-for="spreadsheetEntry of showAllRecent
                ? generatedSpreadsheetHistory
                : generatedSpreadsheetHistory.slice(0, 5)"
            >
              <a
                class="underline text-purple-500 text-sm"
                :href="spreadsheetEntry.spreadsheet.spreadsheetUrl"
                target="_blank"
              >
                {{ spreadsheetEntry.spreadsheet.properties.title }}
              </a>
              <span class="text-xs text-gray-300"
                >{{ new Date(spreadsheetEntry.timestamp).toLocaleDateString() }}
                {{ new Date(spreadsheetEntry.timestamp).toLocaleTimeString() }}</span
              >
            </div>
            <b-button
              @click="showAllRecent = true"
              v-if="generatedSpreadsheetHistory.length > 5 && !showAllRecent"
              variant="outline-dark"
              size="sm"
              >SHOW ALL</b-button
            >
          </div>
        </div>
      </div>
    </template>

    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div class="flex flex-col gap-8 text-center items-center">
        <div class="text-lg font-semibold">
          Sign in to your Google account to generate snapshots.
        </div>
        <div class="text-base">
          Track &amp; Trace Tools can generate Metrc snapshots in Google Sheets.
        </div>

        <a
          class="underline text-purple-600"
          href="https://docs.google.com/spreadsheets/d/1fxBfjBUhFt6Gj7PpbQO8DlT1e76DIDtTwiq_2A5tHCU/edit?usp=sharing"
          target="_blank"
          >Example snapshot</a
        >
        <a class="underline text-purple-600" href="https://youtu.be/JBR21XSKK3I" target="_blank"
          >How do I make a snapshot?</a
        >

        <b-button variant="primary" @click="openOAuthPage()">SIGN IN</b-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IPackageFilter, IPlantFilter, ITransferFilter } from "@/interfaces";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { OAuthState, PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import {
  ReportsActions,
  ReportStatus,
  ReportType,
  SHEET_FIELDS,
} from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "@/utils/date";
import _ from "lodash";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

const reportOptions = [
  {
    text: "Active Packages",
    value: ReportType.ACTIVE_PACKAGES,
    premium: false,
    description: "Active packages within this license.",
  },
  {
    text: "Mature Plants",
    value: ReportType.MATURE_PLANTS,
    premium: false,
    description: "Mature plants within this license",
  },
  {
    text: "Outgoing Transfers",
    value: ReportType.OUTGOING_TRANSFERS,
    premium: false,
    description: "Outgoing transfers from this license",
  },
  {
    text: "Straggler Inventory",
    value: null,
    premium: true,
    description: "Find straggler inventory so it can be cleared out",
  },
  {
    text: "Immature Plants",
    value: null,
    premium: true,
    description: "All plant batches within this license",
  },
  {
    text: "Harvested Plants",
    value: null,
    premium: true,
    description: "All plants and associated harvest data within this license",
  },
  {
    text: "Outgoing Transfer Packages",
    value: ReportType.TRANSFER_PACKAGES,
    premium: true,
    description: "Packages that left this license via outgoing transfer",
  },
];

export default Vue.extend({
  name: "GoogleSheetsExport",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      oAuthState: (state: any) => state.pluginAuth.oAuthState,
      generatedSpreadsheet: (state: any) => state.reports.generatedSpreadsheet,
      generatedSpreadsheetHistory: (state: any) => state.reports.generatedSpreadsheetHistory,
      reportStatus: (state: any) => state.reports.status,
      reportStatusMessage: (state: any) => state.reports.statusMessage,
      reportStatusMessageHistory: (state: any) => state.reports.statusMessageHistory,
    }),
    eligibleReportOptions() {
      return reportOptions.filter((x) => !x.premium);
    },
  },
  data() {
    return {
      OAuthState,
      ReportStatus,
      ReportType,
      SHEET_FIELDS,
      selectedReports: [],
      reportOptions,
      activePackagesFormFilters: {
        packagedDateGt: todayIsodate(),
        packagedDateLt: todayIsodate(),
        includePackagedDateGt: false,
        includePackagedDateLt: false,
      },
      maturePlantsFormFilters: {
        plantedDateGt: todayIsodate(),
        plantedDateLt: todayIsodate(),
        includeVegetative: true,
        includeFlowering: true,
        includePlantedDateGt: false,
        includePlantedDateLt: false,
      },
      outgoingTransfersFormFilters: {
        estimatedDepartureDateLt: todayIsodate(),
        estimatedDepartureDateGt: todayIsodate(),
        includeEstimatedDepartureDateLt: false,
        includeEstimatedDepartureDateGt: false,
        onlyWholesale: false,
      },
      showFilters: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x) => {
          fields[x] = false;
        });
        return fields;
      })(),
      showFields: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x) => {
          fields[x] = false;
        });
        return fields;
      })(),
      fields: _.cloneDeep(SHEET_FIELDS),
      showAllRecent: false,
    };
  },
  methods: {
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateReportSpreadsheet: `reports/${ReportsActions.GENERATE_REPORT_SPREADSHEET}`,
      reset: `reports/${ReportsActions.RESET}`,
    }),
    toggleFilters(reportType: ReportType) {
      this.$data.showFilters[reportType] = !this.$data.showFilters[reportType];
    },
    toggleFields(reportType: ReportType) {
      this.$data.showFields[reportType] = !this.$data.showFields[reportType];
    },
    checkAll(reportType: ReportType) {
      this.$data.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]);
    },
    uncheckAll(reportType: ReportType) {
      this.$data.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]).filter(
        (x) => x.required
      );
    },
    snapshotEverything() {
      this.$data.selectedReports = this.eligibleReportOptions.map((x) => x.value);
    },
    async openOAuthPage() {
      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE, {
        path: "/google-sheets",
      });
    },
    async createSpreadsheet() {
      const reportConfig: IReportConfig = {};

      if (this.$data.selectedReports.includes(ReportType.ACTIVE_PACKAGES)) {
        const activePackageFormFilters = this.$data.activePackagesFormFilters;
        const packageFilter: IPackageFilter = {};

        if (activePackageFormFilters.includePackagedDateGt) {
          packageFilter.packagedDateGt = activePackageFormFilters.packagedDateGt;
        }

        if (activePackageFormFilters.includePackagedDateLt) {
          packageFilter.packagedDateLt = activePackageFormFilters.packagedDateLt;
        }

        reportConfig[ReportType.ACTIVE_PACKAGES] = {
          packageFilter,
          fields: this.$data.fields[ReportType.ACTIVE_PACKAGES],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.MATURE_PLANTS)) {
        const plantFilter: IPlantFilter = {};
        const maturePlantsFormFilters = this.$data.maturePlantsFormFilters;

        if (maturePlantsFormFilters.includeVegetative) {
          plantFilter.includeVegetative = true;
        }

        if (maturePlantsFormFilters.includeFlowering) {
          plantFilter.includeFlowering = true;
        }

        if (maturePlantsFormFilters.includePlantedDateGt) {
          plantFilter.plantedDateGt = maturePlantsFormFilters.plantedDateGt;
        }

        if (maturePlantsFormFilters.includePackagedDateLt) {
          plantFilter.plantedDateLt = maturePlantsFormFilters.plantedDateLt;
        }

        reportConfig[ReportType.MATURE_PLANTS] = {
          plantFilter,
          fields: this.$data.fields[ReportType.MATURE_PLANTS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.OUTGOING_TRANSFERS)) {
        const transferFilter: ITransferFilter = {};
        const outgoingTransfersFormFilters = this.$data.outgoingTransfersFormFilters;

        if (outgoingTransfersFormFilters.onlyWholesale) {
          transferFilter.onlyWholesale = true;
        }

        if (outgoingTransfersFormFilters.includeEstimatedDepartureDateGt) {
          transferFilter.estimatedDepartureDateGt =
            outgoingTransfersFormFilters.estimatedDepartureDateGt;
        }

        if (outgoingTransfersFormFilters.includeEstimatedDepartureDateLt) {
          transferFilter.estimatedDepartureDateLt =
            outgoingTransfersFormFilters.estimatedDepartureDateLt;
        }

        reportConfig[ReportType.OUTGOING_TRANSFERS] = {
          transferFilter,
          fields: this.$data.fields[ReportType.OUTGOING_TRANSFERS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.TRANSFER_PACKAGES)) {
        reportConfig[ReportType.TRANSFER_PACKAGES] = {
          transferFilter: {},
          fields: this.$data.fields[ReportType.TRANSFER_PACKAGES],
        };
      }

      this.generateReportSpreadsheet({ reportConfig });
    },
  },
  async created() {},
  async mounted() {
    this.refreshOAuthState({});

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.refreshOAuthState({});
      }
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
