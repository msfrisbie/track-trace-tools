<template>
  <b-tab title="Google Account"
    ><b-card-text class="flex flex-col gap-4">
      <div v-if="isAuthenticated">
        <pre>{{ identityData }}</pre>

        <button class="btn btn-info" @click="getProfileInfo()">PROFILE INFO</button>

        <button class="btn btn-danger" @click="logout()">LOGOUT</button>

        <button class="btn btn-primary" @click="write()">WRITE</button>
      </div>

      <div v-if="!isAuthenticated">
        <button class="btn btn-primary" @click="login()">LOGIN</button>
      </div>
    </b-card-text></b-tab
  >
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "Auth",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
    isAuthenticated() {
      return !!this.$data.identityData;
    },
  },
  data() {
    return {
      identityData: null,
    };
  },
  methods: {
    login() {
      chrome.identity.getAuthToken(
        {
          interactive: true,
        },
        (token) => {
          if (token) {
            // @ts-ignore
            chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, console.log);
            this.loginImpl(token);
          }
        }
      );
    },

    getProfileInfo() {
      // @ts-ignore
      chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, console.log);
    },

    logout() {
      chrome.identity.getAuthToken(
        {
          interactive: false,
        },
        (token) => {
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);

          chrome.identity.removeCachedAuthToken({ token: token }, () => {});

          this.logoutImpl();
        }
      );
    },

    loginImpl(token: string) {
      fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token="${token}`, {
        method: "GET",
        // @ts-ignore
        async: true,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        contentType: "json",
      })
        .then((response) => response.json())
        .then((data) => {
          this.$data.identityData = data;
        });
    },

    logoutImpl() {
      this.$data.identityData = null;
    },

    async write() {
      const spreadsheetId = "1U6iMT4sVqNDw6kduMqtkayjVFC3-ZRLIRpSjeqJ57cI";

      const authToken: string = await new Promise((resolve) => {
        chrome.identity.getAuthToken({}, (token) => {
          console.log({ token });
          resolve(token);
        });
      });

      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:D5?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
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
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (!token) {
        this.logout();
      } else {
        console.log(token);
        this.loginImpl(token);
      }
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
