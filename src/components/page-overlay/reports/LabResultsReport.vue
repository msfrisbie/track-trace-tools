<template>
    <div v-if="selectedReports.find(
        (report) => report.value === ReportType.LAB_RESULTS
    )
    " class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
        <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Lab Results</div>
        <hr />
        <div class="flex flex-col items-stretch gap-4">
            <div class="font-semibold text-gray-700">Filters:</div>

            <div class="flex flex-col items-start gap-1">
                <b-form-group label="Test Type Names:"
                    description="Exact test names as they appears in Metrc, separated by commas">
                    <b-form-input size="sm" :state="labResultsReportFormFilters.testTypeQuery.length > 3"
                        v-model="labResultsReportFormFilters.testTypeQuery">
                    </b-form-input>
                </b-form-group>
                <div>Example:</div>
                <pre>Delta-9 THC (%) Mandatory Cannabinoid % and Totals,Delta-9 CBD (%) Mandatory Cannabinoid % and Totals</pre>
            </div>

            <b-form-checkbox v-model="labResultsReportFormFilters.includeActive">
                <span class="leading-6">Include active packages</span>
            </b-form-checkbox>

            <b-form-checkbox v-model="labResultsReportFormFilters.includeInactive">
                <span class="leading-6">Include inactive packages</span>
            </b-form-checkbox>

            <b-form-checkbox v-model="labResultsReportFormFilters.includeIntransit">
                <span class="leading-6">Include in-transit packages</span>
            </b-form-checkbox>

            <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="labResultsReportFormFilters.shouldFilterPackagedDateGt">
                    <span class="leading-6">Packaged on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker v-if="labResultsReportFormFilters.shouldFilterPackagedDateGt"
                    :disabled="!labResultsReportFormFilters.shouldFilterPackagedDateGt" initial-date size="sm"
                    v-model="labResultsReportFormFilters.packagedDateGt" />
            </div>

            <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="labResultsReportFormFilters.shouldFilterPackagedDateLt">
                    <span class="leading-6">Packaged on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker v-if="labResultsReportFormFilters.shouldFilterPackagedDateLt"
                    :disabled="!labResultsReportFormFilters.shouldFilterPackagedDateLt" initial-date size="sm"
                    v-model="labResultsReportFormFilters.packagedDateLt" />
            </div>

            <simple-drawer toggleText="ADVANCED">
                <report-license-picker :formFilters="labResultsReportFormFilters"></report-license-picker>
            </simple-drawer>
        </div>
    </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import { ILabResultsReportFormFilters } from "@/utils/reports/lab-results-report";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "LabResultsReport",
    store,
    router,
    props: {
        labResultsReportFormFilters: Object as () => ILabResultsReportFormFilters,

    },
    components: {
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
    async created() { },
    async mounted() {
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
