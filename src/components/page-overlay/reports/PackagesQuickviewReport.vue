<template>
  <div
    v-if="selectedReports.find((report) => report.value === ReportType.PACKAGES_QUICKVIEW)"
    class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
  >
    <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Packages Quickview</div>
    <hr />
    <div class="flex flex-col items-stretch gap-4">
      <div class="font-semibold text-gray-700">Filters:</div>

      <b-form-group label="Slice packages by:" label-size="sm">
        <b-form-select
          v-model="packagesQuickviewFormFilters.primaryDimension"
          :options="PACKAGES_QUICKVIEW_DIMENSIONS"
        ></b-form-select>
      </b-form-group>

      <b-form-group label="Slice packages by: (optional)" label-size="sm">
        <b-form-select
          v-model="packagesQuickviewFormFilters.secondaryDimension"
          :options="[{ text: 'None', value: null }, ...PACKAGES_QUICKVIEW_DIMENSIONS]"
        ></b-form-select>
      </b-form-group>

      <b-form-checkbox v-model="packagesQuickviewFormFilters.includeActive">
        <span class="leading-6">Include Active</span>
      </b-form-checkbox>

      <b-form-checkbox v-model="packagesQuickviewFormFilters.includeIntransit">
        <span class="leading-6">Include In Transit</span>
      </b-form-checkbox>

      <b-form-checkbox v-model="packagesQuickviewFormFilters.includeInactive">
        <span class="leading-6">Include Inactive</span>
      </b-form-checkbox>

      <div class="flex flex-col items-start gap-1">
        <b-form-checkbox v-model="packagesQuickviewFormFilters.shouldFilterPackagedDateGt">
          <span class="leading-6">Packaged on or after:</span>
        </b-form-checkbox>
        <b-form-datepicker
          v-if="packagesQuickviewFormFilters.shouldFilterPackagedDateGt"
          :disabled="!packagesQuickviewFormFilters.shouldFilterPackagedDateGt"
          initial-date
          size="sm"
          v-model="packagesQuickviewFormFilters.packagedDateGt"
        />
      </div>

      <div class="flex flex-col items-start gap-1">
        <b-form-checkbox v-model="packagesQuickviewFormFilters.shouldFilterPackagedDateLt">
          <span class="leading-6">Packaged on or before:</span>
        </b-form-checkbox>
        <b-form-datepicker
          v-if="packagesQuickviewFormFilters.shouldFilterPackagedDateLt"
          :disabled="!packagesQuickviewFormFilters.shouldFilterPackagedDateLt"
          initial-date
          size="sm"
          v-model="packagesQuickviewFormFilters.packagedDateLt"
        />
      </div>

      <simple-drawer toggleText="ADVANCED">
        <report-license-picker :formFilters="packagesQuickviewFormFilters"></report-license-picker>
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
import {
  IPackagesQuickviewReportFormFilters,
  PACKAGES_QUICKVIEW_DIMENSIONS,
} from "@/utils/reports/packages-quickview-report";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackagesQuickviewReport",
  store,
  router,
  props: {
    packagesQuickviewFormFilters: Object as () => IPackagesQuickviewReportFormFilters,
  },
  components: {
    ReportLicensePicker,
    SimpleDrawer,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      selectedReports: (state: IPluginState) => state.reports.selectedReports,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    }),
  },
  data() {
    return {
      ReportType,
      PACKAGES_QUICKVIEW_DIMENSIONS,
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
