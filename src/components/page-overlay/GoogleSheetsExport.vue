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
      const response: {
        data: {
          success: boolean;
          result: ISpreadsheet;
        };
      } = await messageBus.sendMessageToBackground(MessageType.CREATE_SPREADSHEET, {
        title: `${this.authState.license} Metrc Export - ${todayIsodate()}`,
        sheetTitles: ["Overview", "Active Packages"],
      });

      if (response.data.success) {
        this.$data.spreadsheetData = response.data.result;
      }

      for (let i = 0; i < 5; ++i) {
        await messageBus.sendMessageToBackground(MessageType.APPEND_SPREADSHEET_VALUES, {
          spreadsheetId: response.data.result.spreadsheetId,
          range: "Overview",
          values: [
            ["foo", "bar"],
            ["baz", "qux"],
            ["baz", "qux"],
            ["baz", "qux"],
            ["baz", "qux"],
          ],
        });
      }

      //   const data: IValueRange[] = [
      //     {
      //       range: "Overview",
      //       majorDimension: "ROWS",
      //       values: [
      //         ["foo", "bar"],
      //         ["baz", "qux"],
      //         ["baz", "qux"],
      //         ["baz", "qux"],
      //         ["baz", "qux"],
      //       ],
      //     },
      //     {
      //       range: "Active Packages",
      //       majorDimension: "ROWS",
      //       values: [
      //         ["1", "2"],
      //         ["3", "4"],
      //         ["3", "4"],
      //         ["3", "4"],
      //         ["3", "4"],
      //       ],
      //     },
      //   ];

      //   messageBus.sendMessageToBackground(MessageType.UPDATE_SPREADSHEET_VALUES, {
      //     spreadsheetId: response.data.result.spreadsheetId,
      //     data,
      //   });

      //   const data2: IValueRange[] = [
      //     {
      //       range: "Overview!6:10",
      //       majorDimension: "ROWS",
      //       values: [
      //         ["foo", "bar"],
      //         ["baz", "qux"],
      //         ["baz", "qux"],
      //         ["baz", "qux"],
      //         ["baz", "qux"],
      //       ],
      //     },
      //     {
      //       range: "Active Packages!6:10",
      //       majorDimension: "ROWS",
      //       values: [
      //         ["1", "2"],
      //         ["3", "4"],
      //         ["3", "4"],
      //         ["3", "4"],
      //         ["3", "4"],
      //       ],
      //     },
      //   ];

      //   messageBus.sendMessageToBackground(MessageType.UPDATE_SPREADSHEET_VALUES, {
      //     spreadsheetId: response.data.result.spreadsheetId,
      //     data: data2,
      //   });
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
