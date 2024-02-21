<template>
  <div v-if="selectedReports.find(
    (report) => report.value === ReportType.INCOMING_MANIFEST_INVENTORY
  )
    " class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
    <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
      Incoming Manifest Inventory
    </div>
    <hr />
    <div class="flex flex-col items-stretch">
      <b-form-group label="Incoming Transfers:">
        <b-form-checkbox-group class="flex flex-col"
          v-model="reportState.reportFormFilters[ReportType.INCOMING_MANIFEST_INVENTORY].selectedTransfers"
          :options="transferOptions"></b-form-checkbox-group>
      </b-form-group>
    </div>

    <field-select :reportType="ReportType.INCOMING_MANIFEST_INVENTORY"></field-select>
  </div>
</template>

<script lang="ts">
import { IIndexedTransferData, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { ReportType, ReportsActions } from "@/store/page-overlay/modules/reports/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import FieldSelect from "./FieldSelect.vue";

export default Vue.extend({
  name: "IncomingManifestInventoryReport",
  store,
  router,
  props: {
  },
  components: {
    FieldSelect,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      selectedReports: (state: IPluginState) => state.reports.selectedReports,
      selectedFields: (state: IPluginState) => state.reports.selectedFields,
      reportState: (state: IPluginState) => state.reports,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    }),
    transferOptions(): { text: string, value: IIndexedTransferData }[] {
      return store.state.reports.reportFormFilters[ReportType.INCOMING_MANIFEST_INVENTORY]!.allTransfers.map(
        (x: IIndexedTransferData) => ({
          text: `${x.ManifestNumber} -- ${x.ShipperFacilityName} (${x.PackageCount} packages)`,
          value: x
        }));
    }
  },
  data() {
    return {
      ReportType,
    };
  },
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
      updateDynamicReportData: `reports/${ReportsActions.UPDATE_DYNAMIC_REPORT_DATA}`,
    }),
  },
  async created() { },
  async mounted() {
    this.updateDynamicReportData({
      reportType: ReportType.INCOMING_MANIFEST_INVENTORY,
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
