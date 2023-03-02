<template>
  <div>
    <template v-if="oAuthState === OAuthState.INITIAL">
      <b-spinner small></b-spinner>
    </template>
    <template v-if="oAuthState === OAuthState.AUTHENTICATED">
      <button @click="createSpreadsheet()">CREATE</button>
      <a v-if="generatedSpreadsheet" :href="generatedSpreadsheet.spreadsheetUrl" target="_blank"
        >OPEN SPREADSHEET</a
      >
      <pre>{{ generatedSpreadsheet }}</pre>
    </template>
    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div>Need to sign in</div>
      <button @click="openOAuthPage()">OPEN</button>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { OAuthState, PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { ReportsActions } from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
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
    }),
  },
  data() {
    return {
      OAuthState,
      spreadsheetData: null,
      exportActivePackages: true,
      exportDepartedTransferPackages: true,
    };
  },
  methods: {
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateReportSpreadsheet: `reports/${ReportsActions.GENERATE_REPORT_SPREADSHEET}`,
    }),
    async openOAuthPage() {
      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE, {
        path: "/google-sheets",
      });
    },
    async createSpreadsheet() {
      const reportConfig: IReportConfig = {};

      this.generateReportSpreadsheet({ reportConfig });
    },
  },
  async created() {},
  async mounted() {
    this.refreshOAuthState();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.refreshOAuthState();
      }
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
