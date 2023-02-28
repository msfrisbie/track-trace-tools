<template>
  <div>
    <template v-if="oAuthState === OAuthState.INITIAL">
      <b-spinner small></b-spinner>
    </template>
    <template v-if="oAuthState === OAuthState.AUTHENTICATED">
      <button @click="createSpreadsheet()">CREATE</button>
      <a v-if="spreadsheetData" :href="spreadsheetData.spreadsheetUrl" target="_blank"
        >OPEN SPREADSHEET</a
      >
      <pre>{{ spreadsheetData }}</pre>
    </template>
    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div>Need to sign in</div>
      <button @click="openOAuthPage()">OPEN</button>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import {
  IIndexedPackageData,
  IIndexedRichTransferData,
  IRichDestinationData,
  ISpreadsheet,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { createExportSpreadsheetOrError } from "@/utils/sheets-export";
import Vue from "vue";
import { mapState } from "vuex";

enum ExportState {
  INITIAL,
  INFLIGHT,
  SUCCESS,
  ERROR,
}

enum OAuthState {
  INITIAL,
  AUTHENTICATED,
  NOT_AUTHENTICATED,
}

export default Vue.extend({
  name: "GoogleSheetsExport",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
    }),
  },
  data() {
    return {
      ExportState,
      OAuthState,
      exportState: ExportState.INITIAL,
      exportStateMessage: "",
      spreadsheetData: null,
      oAuthState: OAuthState.INITIAL,
      exportActivePackages: true,
      exportDepartedTransferPackages: true,
    };
  },
  methods: {
    async openOAuthPage() {
      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE, {
        path: "/google-sheets",
      });
    },
    async getOAuthData() {
      const response: {
        data: {
          success: boolean;
          isAuthenticated?: boolean;
        };
      } = await messageBus.sendMessageToBackground(MessageType.CHECK_OAUTH);

      if (response.data.success && response.data.isAuthenticated) {
        this.$data.oAuthState = OAuthState.AUTHENTICATED;
      } else {
        this.$data.oAuthState = OAuthState.NOT_AUTHENTICATED;
      }
    },
    async createSpreadsheet() {
      this.$data.exportState = ExportState.INFLIGHT;

      try {
        this.$data.exportStateMessage = "Loading packages...";
        let exportData: {
          activePackages?: IIndexedPackageData[];
          richOutgoingInactiveTransfers?: IIndexedRichTransferData[];
        } = {};

        if (this.$data.exportActivePackages) {
          exportData.activePackages = await primaryDataLoader.onDemandPackageFilter({});
        }

        if (this.$data.exportDepartedTransferPackages) {
          exportData.richOutgoingInactiveTransfers =
            await primaryDataLoader.outgoingInactiveTransfers();

          for (const transfer of exportData.richOutgoingInactiveTransfers) {
            const destinations: IRichDestinationData[] = (
              await primaryDataLoader.transferDestinations(transfer.Id)
            ).map((x) => ({ ...x, packages: [] }));

            for (const destination of destinations) {
              destination.packages = await primaryDataLoader.destinationPackages(destination.Id);
            }
            transfer.outgoingDestinations = destinations;
          }
        }

        this.$data.exportStateMessage = "Generating spreadsheet...";
        const spreadsheet: ISpreadsheet = await createExportSpreadsheetOrError(exportData);

        this.$data.spreadsheetData = spreadsheet;
        this.$data.exportState = ExportState.SUCCESS;
        this.$data.exportStateMessage = "=";
      } catch (e) {
        this.$data.exportState = ExportState.ERROR;
        // @ts-ignore
        this.$data.exportStateMessage = e.toString();
      }
    },
  },
  async created() {},
  async mounted() {
    this.getOAuthData();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.getOAuthData();
      }
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
