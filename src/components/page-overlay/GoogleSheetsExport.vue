<template>
  <div>
    <template v-if="oAuthState === OAuthState.INITIAL">
      <b-spinner small></b-spinner>
    </template>

    <template v-if="oAuthState === OAuthState.AUTHENTICATED">
      <div class="grid grid-cols-3 gap-8 w-full">
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
                <a style="color: #7714ea" class="underline" href="mailto:tracktracetools@gmail.com"
                  >tracktracetools@gmail.com</a
                >
                to enable premium reports or add custom reports.
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
        <div>
          <template v-if="selectedReports.includes(ReportType.ACTIVE_PACKAGES)">
            <b-form-group
              label="Active Package Report Filters"
              label-class="font-semibold text-gray-700"
            >
              <div class="flex flex-col items-stretch gap-4">
                <div class="flex flex-col items-start gap-1">
                  <b-form-checkbox
                    v-model="includePackagedDateGt"
                    :disabled="reportStatus !== ReportStatus.INITIAL"
                  >
                    <span>Packaged on or after:</span>
                  </b-form-checkbox>
                  <b-form-datepicker
                    v-if="includePackagedDateGt"
                    :disabled="!includePackagedDateGt || reportStatus !== ReportStatus.INITIAL"
                    initial-date
                    size="sm"
                    v-model="packagedDateGt"
                  />
                </div>

                <div class="flex flex-col items-start gap-1">
                  <b-form-checkbox
                    v-model="includePackagedDateLt"
                    :disabled="reportStatus !== ReportStatus.INITIAL"
                  >
                    <span>Packaged on or before:</span>
                  </b-form-checkbox>
                  <b-form-datepicker
                    v-if="includePackagedDateLt"
                    :disabled="!includePackagedDateLt || reportStatus !== ReportStatus.INITIAL"
                    initial-date
                    size="sm"
                    v-model="packagedDateLt"
                  />
                </div>
              </div>
            </b-form-group>
          </template>

          <template v-if="selectedReports.includes(ReportType.MATURE_PLANTS)">
            <b-form-group
              label="Mature Plant Report Filters"
              label-class="font-semibold text-gray-700"
            >
              <div class="flex flex-col items-stretch gap-4">
                <b-form-checkbox :disabled="reportStatus !== ReportStatus.INITIAL">
                  <span>Include Vegetative</span>
                </b-form-checkbox>
                <b-form-checkbox :disabled="reportStatus !== ReportStatus.INITIAL">
                  <span>Include Flowering</span>
                </b-form-checkbox>
              </div>
            </b-form-group>
          </template>
        </div>
        <div class="flex flex-col gap-4 items-stretch text-center">
          <template v-if="reportStatus === ReportStatus.INITIAL">
            <div v-if="selectedReports.length === 0">Select one or more reports to generate</div>

            <b-button
              variant="primary"
              @click="createSpreadsheet()"
              :disabled="selectedReports.length === 0"
              >GENERATE REPORT</b-button
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
              >VIEW YOUR REPORT</b-button
            >
            <b-button variant="outline-primary" @click="reset()">GENERATE ANOTHER</b-button>
          </template>
        </div>
      </div>
    </template>

    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div>You must sign in to your Google account to generate reports.</div>
      <b-button variant="primary" @click="openOAuthPage()">SIGN IN</b-button>
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
} from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "@/utils/date";
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
          premium: false,
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
    };
  },
  methods: {
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateReportSpreadsheet: `reports/${ReportsActions.GENERATE_REPORT_SPREADSHEET}`,
      reset: `reports/${ReportsActions.RESET}`,
    }),
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

        reportConfig[ReportType.ACTIVE_PACKAGES] = { packageFilter };
      }

      if (this.$data.selectedReports.includes(ReportType.TRANSFER_PACKAGES)) {
        reportConfig[ReportType.TRANSFER_PACKAGES] = { transferFilter: {} };
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
