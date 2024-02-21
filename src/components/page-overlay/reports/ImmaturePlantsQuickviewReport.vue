<template>
  <div
    v-if="selectedReports.find((report) => report.value === ReportType.IMMATURE_PLANTS_QUICKVIEW)"
    class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
  >
    <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Immature Plants Quickview</div>
    <hr />
    <div class="flex flex-col items-stretch gap-4">
      <div class="font-semibold text-gray-700">Filters:</div>

      <b-form-group label="Slice plants by:" label-size="sm">
        <b-form-select
          v-model="immaturePlantsQuickviewFormFilters.primaryDimension"
          :options="IMMATURE_PLANT_QUICKVIEW_DIMENSIONS"
        ></b-form-select>
      </b-form-group>

      <b-form-group label="Slice plants by: (optional)" label-size="sm">
        <b-form-select
          v-model="immaturePlantsQuickviewFormFilters.secondaryDimension"
          :options="[{ text: 'None', value: null }, ...IMMATURE_PLANT_QUICKVIEW_DIMENSIONS]"
        ></b-form-select>
      </b-form-group>

      <b-form-checkbox v-model="immaturePlantsQuickviewFormFilters.includeActive">
        <span class="leading-6">Include Active</span>
      </b-form-checkbox>

      <b-form-checkbox v-model="immaturePlantsQuickviewFormFilters.includeInactive">
        <span class="leading-6">Include Inactive</span>
      </b-form-checkbox>

      <div class="flex flex-col items-start gap-1">
        <b-form-checkbox v-model="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt">
          <span class="leading-6">Planted on or after:</span>
        </b-form-checkbox>
        <b-form-datepicker
          v-if="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
          :disabled="!immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
          initial-date
          size="sm"
          v-model="immaturePlantsQuickviewFormFilters.plantedDateGt"
        />
      </div>

      <div class="flex flex-col items-start gap-1">
        <b-form-checkbox v-model="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt">
          <span class="leading-6">Planted on or before:</span>
        </b-form-checkbox>
        <b-form-datepicker
          v-if="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
          :disabled="!immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
          initial-date
          size="sm"
          v-model="immaturePlantsQuickviewFormFilters.plantedDateLt"
        />
      </div>

      <simple-drawer toggleText="ADVANCED">
        <report-license-picker
          :formFilters="immaturePlantsQuickviewFormFilters"
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
  IImmaturePlantsQuickviewReportFormFilters,
  IMMATURE_PLANT_QUICKVIEW_DIMENSIONS,
} from "@/utils/reports/immature-plants-quickview-report";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "ImmaturePlantsQuickviewReport",
  store,
  router,
  props: {
    immaturePlantsQuickviewFormFilters: Object as () => IImmaturePlantsQuickviewReportFormFilters,
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
      IMMATURE_PLANT_QUICKVIEW_DIMENSIONS,
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
