<template>
  <b-tab title="Google Sheets"
    ><b-card-text class="flex flex-col gap-4">
      <template v-if="enabled">
        <div v-if="isAuthenticated">
          <pre>{{ oauthUserInfo }}</pre>

          <button class="btn btn-danger" @click="logout()">LOGOUT</button>
          <button class="btn btn-primary" @click="write()">WRITE</button>
          <button class="btn btn-primary" @click="getSheetData()">READ</button>
        </div>

        <div v-if="!isAuthenticated">
          <button class="btn btn-primary" @click="login()">LOGIN</button>
        </div>
      </template>
      <template v-if="!enabled">
        Google Sheets integration is under construction! Check back soon.
      </template>
    </b-card-text></b-tab
  >
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { expireAuthToken, getAuthTokenOrError, getOAuthUserInfoOrError } from "@/utils/oauth";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "GoogleSheets",
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
    };
  },
  methods: {
    async login() {
      this.$data.oauthUserInfo = await getOAuthUserInfoOrError();
    },

    logout() {
      expireAuthToken();

      this.$data.oauthUserInfo = null;
    },

    async getSheetData() {
      const spreadsheetId = "1U6iMT4sVqNDw6kduMqtkayjVFC3-ZRLIRpSjeqJ57cI";

      const token = await getAuthTokenOrError();

      const result = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?&fields=sheets.properties`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ).then((response) => response.json());

      console.log(result);
    },

    async write() {
      const spreadsheetId = "1U6iMT4sVqNDw6kduMqtkayjVFC3-ZRLIRpSjeqJ57cI";

      const token = await getAuthTokenOrError();

      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:D5?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            range: "Sheet1!A1:D5",
            majorDimension: "ROWS",
            values: [
              ["Item", "Cost", "Stocked", "Ship Date"],
              ["Wheel", "$20.50", "4", "3/1/2016"],
              ["Door", "$15", "2", "3/15/2016"],
              ["Engine", "$100", "1", "3/20/2016"],
              ["Totals", "=SUM(B2:B4)", "=SUM(C2:C4)", "=MAX(D2:D4)"],
            ],
          }),
        }
      );
    },
  },
  async created() {},
  async mounted() {
    await getAuthTokenOrError();
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
