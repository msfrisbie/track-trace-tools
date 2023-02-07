<template>
  <div>
    <template v-if="oAuthData">
      <button @click="createSpreadsheet()">CREATE</button>
      <a v-if="spreadsheetData" :href="spreadsheetData.spreadsheetUrl" target="_blank"
        >OPEN SPREADSHEET</a
      >
      <pre>{{ spreadsheetData }}</pre>
    </template>
    <template v-else>
      <div>Need to sign in</div>
      <button @click="openOAuthPage()">OPEN</button>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IGoogleOAuthOAuthUserInfo, ISpreadsheet } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { todayIsodate } from "@/utils/date";
import Vue from "vue";
import { mapState } from "vuex";

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
      spreadsheetData: null,
      oAuthData: null,
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
          result: IGoogleOAuthOAuthUserInfo;
        };
      } = await messageBus.sendMessageToBackground(MessageType.GET_OAUTH_USER_INFO_OR_ERROR);

      if (response.data.success) {
        this.$data.oAuthData = response.data.result;
      } else {
        this.$data.oAuthData = null;
      }
    },
    async createSpreadsheet() {
      const sheetTitles = ["Overview", "Packages"];

      const response: {
        data: {
          success: boolean;
          result: ISpreadsheet;
        };
      } = await messageBus.sendMessageToBackground(MessageType.CREATE_SPREADSHEET, {
        title: `${this.authState.license} Metrc Export - ${todayIsodate()}`,
        sheetTitles,
      });

      const packageProperties = [
        "Label",
        "LicenseNumber",
        "PackageState",
        "Item.Name",
        "Quantity",
        "UnitOfMeasureAbbreviation",
        "PackagedDate",
        "LocationName",
        "PackagedByFacilityLicenseNumber",
        "LabTestingStateName",
        "ProductionBatchNumber",
      ];

      const activePackages = await primaryDataLoader.activePackages();

      await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
        spreadsheetId: response.data.result.spreadsheetId,
        requests: [
          // Add more rows
          {
            appendDimension: {
              dimension: "ROWS",
              length: 19,
              sheetId: sheetTitles.indexOf("Overview"),
            },
          },
          // Add more rows
          {
            appendDimension: {
              dimension: "ROWS",
              length: activePackages.length,
              sheetId: sheetTitles.indexOf("Packages"),
            },
          },
          // Style top row - black bg, white text
          {
            repeatCell: {
              range: {
                sheetId: sheetTitles.indexOf("Packages"),
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.0,
                    green: 0.0,
                    blue: 0.0,
                  },
                  horizontalAlignment: "CENTER",
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                    },
                    fontSize: 10,
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
            },
          },
          // Freeze top row
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetTitles.indexOf("Packages"),
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
        ],
      });

      await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
        spreadsheetId: response.data.result.spreadsheetId,
        range: "Packages!1:1",
        values: [packageProperties],
      });

      let nextPageStartIdx = 0;
      let nextPageRowIdx = 2;
      const pageSize = 2000;

      while (true) {
        const nextPage = activePackages.slice(nextPageStartIdx, nextPageStartIdx + pageSize);
        if (nextPage.length === 0) {
          break;
        }

        await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
          spreadsheetId: response.data.result.spreadsheetId,
          range: `Packages!${nextPageRowIdx}:${nextPageRowIdx + nextPage.length}`,
          values: nextPage.map((pkg) =>
            packageProperties.map((property) => {
              let value = pkg;
              for (const subProperty of property.split(".")) {
                // @ts-ignore
                value = value[subProperty];
              }
              return value;
            })
          ),
        });

        nextPageStartIdx += nextPage.length;
        nextPageRowIdx += nextPage.length;
      }

      await messageBus.sendMessageToBackground(MessageType.WRITE_SPREADSHEET_VALUES, {
        spreadsheetId: response.data.result.spreadsheetId,
        range: "Overview",
        values: [
          [`Generated with Track & Trace Tools at ${Date().toString()}`],
          [],
          [null, "License", this.authState.license],
          [],
          [null, "Active Packages", `=COUNTIF(Packages!B2:B, "ACTIVE")`],
        ],
      });

      await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
        spreadsheetId: response.data.result.spreadsheetId,
        requests: [
          // Auto resize to fit added data
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: "COLUMNS",
                sheetId: sheetTitles.indexOf("Overview"),
                startIndex: 1,
                endIndex: 12,
              },
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: "COLUMNS",
                sheetId: sheetTitles.indexOf("Packages"),
                startIndex: 0,
                endIndex: 12,
              },
            },
          },
        ],
      });

      if (response.data.success) {
        this.$data.spreadsheetData = response.data.result;
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
