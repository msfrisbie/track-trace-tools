<template>
  <div>
    <template v-if="oAuthState === OAuthState.INITIAL">
      <b-spinner small></b-spinner>
    </template>

    <template v-if="oAuthState === OAuthState.AUTHENTICATED">
      <div class="grid grid-cols-3 gap-8 w-full">
        <!-- First Column -->
        <div>
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
                to enable premium exports or request custom export types.
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
        <div v-bind:class="{ invisible: reportStatus !== ReportStatus.INITIAL }">
          <template v-if="selectedReports.length === 0">
            <div class="text-red-500 text-center">Select one or more export types</div>
          </template>
          <template v-if="selectedReports.includes(ReportType.ACTIVE_PACKAGES)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Active Packages</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <div class="flex flex-col items-start gap-1">
                  <b-form-checkbox v-model="includePackagedDateGt">
                    <span class="leading-6">Packaged on or after:</span>
                  </b-form-checkbox>
                  <b-form-datepicker
                    v-if="includePackagedDateGt"
                    :disabled="!includePackagedDateGt"
                    initial-date
                    size="sm"
                    v-model="packagedDateGt"
                  />
                </div>

                <div class="flex flex-col items-start gap-1">
                  <b-form-checkbox v-model="includePackagedDateLt">
                    <span class="leading-6">Packaged on or before:</span>
                  </b-form-checkbox>
                  <b-form-datepicker
                    v-if="includePackagedDateLt"
                    :disabled="!includePackagedDateLt"
                    initial-date
                    size="sm"
                    v-model="packagedDateLt"
                  />
                </div>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.ACTIVE_PACKAGES)"
                  >{{
                    showFields[ReportType.ACTIVE_PACKAGES]
                      ? "HIDE FIELDS"
                      : "SELECT FIELDS TO INCLUDE"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.ACTIVE_PACKAGES]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button
                      variant="outline-primary"
                      size="sm"
                      @click="checkAll(ReportType.ACTIVE_PACKAGES)"
                      >CHECK ALL</b-button
                    >
                    <b-button
                      variant="outline-primary"
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
            <b-form-group
              label="Mature Plant Report Filters"
              label-class="font-semibold text-gray-700"
            >
              <div class="flex flex-col items-stretch gap-4">
                <b-form-checkbox>
                  <span>Include Vegetative</span>
                </b-form-checkbox>
                <b-form-checkbox>
                  <span>Include Flowering</span>
                </b-form-checkbox>
              </div>
            </b-form-group>
          </template>
        </div>

        <!-- End Column -->
        <div class="flex flex-col gap-4 items-stretch text-center">
          <template v-if="reportStatus === ReportStatus.INITIAL">
            <b-button
              variant="primary"
              @click="createSpreadsheet()"
              :disabled="selectedReports.length === 0"
              >EXPORT TO SPREADSHEET</b-button
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
              >VIEW SPREADSHEET</b-button
            >
            <b-button variant="outline-primary" @click="reset()">START OVER</b-button>
          </template>

          <div
            class="flex flex-col items-stretch gap-2 text-start py-12"
            v-if="generatedSpreadsheetHistory.length > 0"
          >
            <div style="text-align: start">Previously generated sheets:</div>
            <div
              class="flex flex-col items-start"
              v-bind:key="spreadsheetEntry.uuid"
              v-for="spreadsheetEntry of generatedSpreadsheetHistory"
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
          </div>
        </div>
      </div>
    </template>

    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div class="flex flex-col gap-8">
        <div class="text-lg font-semibold">
          You must sign in to your Google account to use this tool.
        </div>
        <div class="text-base">
          Track &amp; Trace Tools exports your Metrc data directly into Google Sheets.
        </div>
        <b-button variant="primary" @click="openOAuthPage()">SIGN IN</b-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IPackageFilter } from "@/interfaces";
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
  },
  data() {
    return {
      OAuthState,
      ReportStatus,
      ReportType,
      SHEET_FIELDS,
      selectedReports: [],
      reportOptions: [
        {
          text: "Active Packages",
          value: ReportType.ACTIVE_PACKAGES,
          premium: false,
          description: "Active packages within this license.",
        },
        {
          text: "Mature Plants",
          value: ReportType.MATURE_PLANTS,
          premium: true,
          description: "All plants within this license",
        },
        {
          text: "Straggler Inventory",
          value: ReportType.STRAGGLER_INVENTORY,
          premium: true,
          description: "Find straggler inventory so it can be cleared out",
        },
        {
          text: "Immature Plants",
          value: ReportType.IMMATURE_PLANTS,
          premium: true,
          description: "All plant batches within this license",
        },
        {
          text: "Harvested Plants",
          value: ReportType.HARVESTED_PLANTS,
          premium: true,
          description: "All plants and associated harvest data within this license",
        },
        {
          text: "Outgoing Transfers",
          value: ReportType.OUTGOING_TRANSFERS,
          premium: true,
          description: "Outgoing transfers from this license",
        },
        {
          text: "Outgoing Transfer Packages",
          value: ReportType.TRANSFER_PACKAGES,
          premium: true,
          description: "Packages that left this license via outgoing transfer",
        },
      ],
      packagedDateGt: todayIsodate(),
      packagedDateLt: todayIsodate(),
      includePackagedDateGt: false,
      includePackagedDateLt: false,
      showFields: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x) => {
          fields[x] = false;
        });
        return fields;
      })(),
      fields: _.cloneDeep(SHEET_FIELDS),
    };
  },
  methods: {
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateReportSpreadsheet: `reports/${ReportsActions.GENERATE_REPORT_SPREADSHEET}`,
      reset: `reports/${ReportsActions.RESET}`,
    }),
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
    async openOAuthPage() {
      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE, {
        path: "/google-sheets",
      });
    },
    async createSpreadsheet() {
      const reportConfig: IReportConfig = {};

      if (this.$data.selectedReports.includes(ReportType.ACTIVE_PACKAGES)) {
        const packageFilter: IPackageFilter = {};

        if (this.$data.includePackagedDateGt) {
          packageFilter.packagedDateGt = this.$data.packagedDateGt;
        }

        if (this.$data.includePackagedDateLt) {
          packageFilter.packagedDateLt = this.$data.packagedDateLt;
        }

        reportConfig[ReportType.ACTIVE_PACKAGES] = {
          packageFilter,
          fields: this.$data.fields[ReportType.ACTIVE_PACKAGES],
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
