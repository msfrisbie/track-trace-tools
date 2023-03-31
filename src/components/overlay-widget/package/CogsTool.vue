<template>
  <div class="flex flex-col items-stretch w-full">
    <template v-if="validClient()"> Valid </template>
    <template v-else> Invalid </template>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import { ReportsActions } from "@/store/page-overlay/modules/reports/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "CogsTool",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: any) => state.pluginAuth.authState,
      oAuthState: (state: any) => state.pluginAuth.oAuthState,
      generatedSpreadsheet: (state: any) => state.reports.generatedSpreadsheet,
    }),
    ...mapGetters({
      // ancestorList: `packageHistory/${PackageHistoryGetters.ANCESTOR_LIST}`,
    }),
  },
  data() {
    return {};
  },
  watch: {},
  methods: {
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateReportSpreadsheet: `reports/${ReportsActions.GENERATE_SPREADSHEET}`,
      reset: `reports/${ReportsActions.RESET}`,
    }),
    validClient(): boolean {
      return clientBuildManager.assertValues(["ENABLE_COGS"]);
    },
  },
  async created() {},
  async mounted() {},
  async destroyed() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
