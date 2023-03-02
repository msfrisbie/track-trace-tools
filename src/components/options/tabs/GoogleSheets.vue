<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-stretch max-w-lg gap-4">
      <div class="text-xl text-center">
        Track &amp; Trace Tools can generate reports directly in Google Sheets. Sign in to your
        Google account to enable this feature.
      </div>

      <hr />

      <div class="flex flex-col items-center">
        <o-auth-login></o-auth-login>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import OAuthLogin from "@/components/shared/OAuthLogin.vue";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

/* 
TODO Auth events:

LOGIN
LOGOUT
GENERATE REPORT (incl. types)
GENERATE REPORT SUCCESS
GENERATE REPORT ERROR
CHANGE REPORT CONFIG

*/

export default Vue.extend({
  name: "GoogleSheets",
  store,
  router,
  props: {
    enabled: Boolean,
  },
  components: {
    OAuthLogin,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
