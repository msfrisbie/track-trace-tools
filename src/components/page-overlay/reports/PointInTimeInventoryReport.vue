<template>
  <div
    v-if="selectedReports.find((report) => report.value === ReportType.POINT_IN_TIME_INVENTORY)"
    class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
  >
    <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Point In Time Inventory</div>
    <hr />
    <div class="flex flex-col items-stretch gap-4">
      <div class="font-semibold text-gray-700">Filters:</div>

      <div class="flex flex-col items-start gap-1">
        <span class="leading-6">Point in time:</span>
        <b-form-datepicker
          initial-date
          size="sm"
          v-model="pointInTimeInventoryFormFilters.targetDate"
        />
      </div>
      <b-form-group label="Longest amount of time a package is held at this facility:">
        <b-form-select
          :disabled="!pointInTimeInventoryFormFilters.useRestrictedWindowOptimization"
          v-model="pointInTimeInventoryFormFilters.restrictedWindowDays"
          :options="pointInTimeInventoryFormFilters.restrictedWindowDaysOptions"
        ></b-form-select>
      </b-form-group>
      <hr />

      <simple-drawer toggleText="ADVANCED">
        <report-license-picker
          :formFilters="pointInTimeInventoryFormFilters"
        ></report-license-picker>

        <b-form-checkbox v-model="pointInTimeInventoryFormFilters.useRestrictedWindowOptimization">
          <span class="leading-6">Restrict package window (recommended)</span>
        </b-form-checkbox>

        <span
          v-if="!pointInTimeInventoryFormFilters.useRestrictedWindowOptimization"
          class="mb-4 text-xs text-red-500"
          >Disabling this will include packages held for any length of time, but report generation
          will be significantly slower.</span
        >

        <b-form-checkbox v-model="pointInTimeInventoryFormFilters.showDebugColumns">
          <span class="leading-6">Show debug columns</span>
        </b-form-checkbox>
      </simple-drawer>
    </div>
  </div>
</template>

<script lang="ts">
import ReportLicensePicker from "@/components/overlay-widget/shared/ReportLicensePicker.vue";
import SimpleDrawer from "@/components/shared/SimpleDrawer.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import { IFieldData } from "@/store/page-overlay/modules/reports/interfaces";
import { IPointInTimeInventoryReportFormFilters } from "@/utils/reports/point-in-time-inventory-report";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackagesQuickviewReport",
  store,
  router,
  props: {
    pointInTimeInventoryFormFilters: Object as () => IPointInTimeInventoryReportFormFilters,
  },
  components: {
    ReportLicensePicker,
    SimpleDrawer,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      selectedReports: (state: IPluginState) => state.reports.selectedReports,
      fields: (state: IPluginState) => state.reports.fields,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    }),
  },
  data() {
    return {
      ReportType,
    };
  },
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
