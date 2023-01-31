<template>
  <div>
    <div>GoogleSheetsExport</div>
    <button @click="createSpreadsheet()">CREATE</button>
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
        title: `Metrc Export ${this.authState.license} - ${todayIsodate()}`,
        sheetTitles: ["Overview", "Active Packages"],
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
