<template>
  <div
    v-if="selectedReports.find((report) => report.value === ReportType.MATURE_PLANTS_QUICKVIEW)"
    class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
  >
    <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Mature Plants Quickview</div>
    <hr />
    <div class="flex flex-col items-stretch gap-4">
      <div class="font-semibold text-gray-700">Filters:</div>

      <b-form-group label="Slice plants by:" label-size="sm">
        <b-form-select
          v-model="maturePlantsQuickviewFormFilters.primaryDimension"
          :options="MATURE_PLANT_QUICKVIEW_DIMENSIONS"
        ></b-form-select>
      </b-form-group>

      <b-form-group label="Slice plants by: (optional)" label-size="sm">
        <b-form-select
          v-model="maturePlantsQuickviewFormFilters.secondaryDimension"
          :options="[{ text: 'None', value: null }, ...MATURE_PLANT_QUICKVIEW_DIMENSIONS]"
        ></b-form-select>
      </b-form-group>

      <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.includeVegetative">
        <span class="leading-6">Include Vegetative</span>
      </b-form-checkbox>
      <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.includeFlowering">
        <span class="leading-6">Include Flowering</span>
      </b-form-checkbox>
      <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.includeInactive">
        <span class="leading-6">Include Inactive</span>
      </b-form-checkbox>

      <div class="flex flex-col items-start gap-1">
        <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt">
          <span class="leading-6">Planted on or after:</span>
        </b-form-checkbox>
        <b-form-datepicker
          v-if="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
          :disabled="!maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
          initial-date
          size="sm"
          v-model="maturePlantsQuickviewFormFilters.plantedDateGt"
        />
      </div>

      <div class="flex flex-col items-start gap-1">
        <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt">
          <span class="leading-6">Planted on or before:</span>
        </b-form-checkbox>
        <b-form-datepicker
          v-if="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
          :disabled="!maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
          initial-date
          size="sm"
          v-model="maturePlantsQuickviewFormFilters.plantedDateLt"
        />
      </div>

      <simple-drawer toggleText="ADVANCED">
        <report-license-picker
          :formFilters="maturePlantsQuickviewFormFilters"
        ></report-license-picker>
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
  IMaturePlantsQuickviewReportFormFilters,
  MATURE_PLANT_QUICKVIEW_DIMENSIONS,
} from "@/utils/reports/mature-plants-quickview-report";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "MaturePlantsQuickviewReport",
  store,
  router,
  props: {
    maturePlantsQuickviewFormFilters: Object as () => IMaturePlantsQuickviewReportFormFilters,
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
      MATURE_PLANT_QUICKVIEW_DIMENSIONS,
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
