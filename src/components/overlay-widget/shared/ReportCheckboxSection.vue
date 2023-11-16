<template>
  <fragment>
    <template v-if="reportOptions.filter((x) => x.visible).length > 0">
      <div class="text-white ttt-purple-bg rounded py-1 px-2 mb-2">{{ title }}</div>

      <b-form-checkbox
        v-for="enabledReportOption of reportOptions.filter((x) => x.visible && x.enabled)"
        v-bind:key="enabledReportOption.value"
        :value="enabledReportOption"
        :disabled="reportStatus !== ReportStatus.INITIAL"
        ><div class="flex flex-col items-start gap-1">
          <span class="">{{ enabledReportOption.text }}</span>
          <span class="text-xs text-gray-400">{{ enabledReportOption.description }}</span>
        </div>
      </b-form-checkbox>

      <b-form-checkbox
        class="opacity-50"
        v-for="disabledReportOption of reportOptions.filter((x) => x.visible && !x.enabled)"
        v-bind:key="disabledReportOption.value"
        :value="disabledReportOption.value"
        :disabled="true"
        ><div class="flex flex-col items-start gap-1">
          <span class="">{{ disabledReportOption.text }}</span>
        </div>
      </b-form-checkbox>

      <div class="my-2"></div>
    </template>
  </fragment>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ReportStatus } from "@/store/page-overlay/modules/reports/consts";
import { IReportOption } from "@/store/page-overlay/modules/reports/interfaces";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "ReportCheckboxSection",
  store,
  router,
  props: {
    title: String,
    reportOptions: Array as () => IReportOption[],
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      reportStatus: (state: IPluginState) => state.reports.status,
    }),
  },
  data() {
    return {
      ReportStatus,
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
