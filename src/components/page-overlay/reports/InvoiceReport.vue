<template>
    <div v-if="selectedReports.find(
        (report) => report.value === ReportType.INVOICE
    )
    " class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
        <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
            Transfer Invoice
        </div>
        <hr />
        <div class="flex flex-col items-stretch">
            <b-form-group label="Select a transfer to generate an invoice:">
                <b-form-select class="flex flex-col"
                    v-model="reportState.reportFormFilters[ReportType.INVOICE].selectedOutgoingTransfer"
                    :options="outgoingTransferOptions"></b-form-select>
                <template v-if="reportState.reportFormFilters[ReportType.INVOICE].allOutgoingTransfers.length === 0">
                    <p class="italic text-gray-500">0 outgoing transfers found for this license</p>
                </template>
            </b-form-group>
            <div>NOTE: when printing this in Excel, you may need to select "Scale to fit" in printing options</div>
        </div>
    </div>
</template>

<script lang="ts">
import { IIndexedRichOutgoingTransferData, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { ReportType, ReportsActions } from "@/store/page-overlay/modules/reports/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "ScanSheetReport",
    store,
    router,
    props: {
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
        outgoingTransferOptions(): { html: string, value: IIndexedRichOutgoingTransferData }[] {
            return store.state.reports.reportFormFilters[ReportType.INVOICE]!.allOutgoingTransfers.map(
                (x: IIndexedRichOutgoingTransferData) => ({
                    html: `<b>${x.ManifestNumber} (${x.PackageCount} packages, ETD ${new Date(x.EstimatedDepartureDateTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })})</b><br />
                    <span>${x.DeliveryFacilities}</span>`,
                    value: x
                }));
        },
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
            reportType: ReportType.INVOICE,
        });
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
