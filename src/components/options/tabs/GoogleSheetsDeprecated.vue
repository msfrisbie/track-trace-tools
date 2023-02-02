<template>
  <div class="flex flex-col gap-4">
    <template v-if="enabled">
      <div v-if="isAuthenticated">
        <pre>{{ oauthUserInfo }}</pre>

        <b-form-input v-model="spreadsheetUrl"></b-form-input>

        <button class="btn btn-danger" @click="logout()">LOGOUT</button>
        <button class="btn btn-primary" @click="write()">WRITE</button>
        <button class="btn btn-primary" @click="getSheetData()">READ</button>
        <button class="btn btn-primary" @click="create()">CREATE</button>
      </div>

      <div v-if="!isAuthenticated">
        <button class="btn btn-primary" @click="login()">LOGIN</button>
      </div>
    </template>
    <template v-if="!enabled">
      Google Sheets integration is under construction! Check back soon.
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { appendValues, createSpreadsheet, getSheetProperties } from "@/utils/sheets";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "GoogleSheetsDeprecated",
  store,
  router,
  props: {
    enabled: Boolean,
  },
  components: {},
  computed: {
    ...mapState(["debugMode"]),
    isAuthenticated() {
      // @ts-ignore
      return !!this.$data.oauthUserInfo;
    },
  },
  data() {
    return {
      oauthUserInfo: null,
      spreadsheetUrl: null,
    };
  },
  methods: {
    async login() {
      this.$data.oauthUserInfo = await messageBus.sendMessageToBackground(
        MessageType.GET_OAUTH_USER_INFO_OR_ERROR
      );
    },

    async logout() {
      await messageBus.sendMessageToBackground(MessageType.EXPIRE_AUTH_TOKEN);

      this.$data.oauthUserInfo = null;
    },

    async getSheetData() {
      const spreadsheetId = "1U6iMT4sVqNDw6kduMqtkayjVFC3-ZRLIRpSjeqJ57cI";

      console.log(await getSheetProperties({ spreadsheetId }));
    },

    async write() {
      const spreadsheetId = "1U6iMT4sVqNDw6kduMqtkayjVFC3-ZRLIRpSjeqJ57cI";
      const range = "Sheet1!A1:D10";
      const values = [
        ["Item", "Cost", "Stocked", "Ship Date"],
        ["Wheel", "$20.50", "4", "3/1/2016"],
        ["Door", "$15", "2", "3/15/2016"],
        ["Engine", "$100", "1", "3/20/2016"],
      ];

      appendValues({
        spreadsheetId,
        range,
        values,
      });
    },

    async create() {
      console.log(await createSpreadsheet());
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
