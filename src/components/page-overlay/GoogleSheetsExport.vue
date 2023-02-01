<template>
  <div>
    <div>GoogleSheetsExport</div>
    <button @click="createSpreadsheet()">CREATE</button>
    <a v-if="spreadsheetData" :href="spreadsheetData.spreadsheetUrl" target="_blank"
      >OPEN SPREADSHEET</a
    >
    <pre>{{ spreadsheetData }}</pre>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { ISpreadsheet } from "@/interfaces";
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
    };
  },
  methods: {
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
        "LicenseNumber",
        "PackageState",
        "Label",
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

      await messageBus.sendMessageToBackground(MessageType.BATCH_UPDATE_SPREADSHEET, {
        spreadsheetId: response.data.result.spreadsheetId,
        requests: [
          // Auto resize to fit added data
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: "COLUMNS",
                sheetId: sheetTitles.indexOf("Packages"),
                startIndex: 0,
                endIndex: 30,
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
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
