<template>
  <div class="flex flex-col items-stretch gap-4 text-center">
    <template v-if="!initial">
      <template v-if="isAuthenticated">
        <!-- <pre>{{ oauthUserInfo }}</pre> -->
        <div>
          You are signed in as <span class="font-bold ttt-purple">{{ oauthUserInfo.email }}</span>
        </div>

        <b-button
          variant="outline-primary"
          class="flex flex-row items-center gap-2 justify-center"
          @click="logout()"
        >
          <font-awesome-icon icon="sign-out-alt"></font-awesome-icon>
          <span>LOGOUT</span></b-button
        >
      </template>

      <template v-if="!isAuthenticated">
        <b-button
          variant="outline-dark"
          @click="login({ interactive: true })"
          class="flex flex-row items-center gap-2 justify-center"
          ><img src="img/google.svg" /><span>Sign in with Google</span></b-button
        >
      </template>
    </template>
    <template v-else>
      <div class="flex flex-row items-center justify-center p-4">
        <b-spinner></b-spinner>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

require("@/assets/images/google.svg");

export default Vue.extend({
  name: "OAuthLogin",
  store,
  router,
  props: {},
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
      initial: true,
      oauthUserInfo: null,
    };
  },
  methods: {
    async login({ interactive = false }: { interactive?: boolean } = {}) {
      const response = await messageBus.sendMessageToBackground(
        MessageType.GET_OAUTH_USER_INFO_OR_ERROR,
        { interactive }
      );
      this.$data.oauthUserInfo = response.data.result;
    },

    async logout() {
      await messageBus.sendMessageToBackground(MessageType.EXPIRE_AUTH_TOKEN);

      this.$data.oauthUserInfo = null;
    },
  },
  async created() {},
  async mounted() {
    try {
      // @ts-ignore
      await this.login();
    } catch (e) {
      console.error(e);
    } finally {
      this.$data.initial = false;
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // @ts-ignore
        this.login();
      }
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
