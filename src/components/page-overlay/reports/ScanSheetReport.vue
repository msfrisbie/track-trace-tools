<template>
    <div v-if="selectedReports.find(
        (report) => report.value === ReportType.SCAN_SHEET
    )
    " class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
        <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
            Scan Sheet
        </div>
        <hr />
        <div class="flex flex-col items-stretch">
            <b-form-group label="Incoming Transfers:">
                <b-form-checkbox-group class="flex flex-col"
                    v-model="reportState.reportFormFilters[ReportType.SCAN_SHEET].selectedIncomingTransfers"
                    :options="incomingTransferOptions"></b-form-checkbox-group>
                <template v-if="reportState.reportFormFilters[ReportType.SCAN_SHEET].allIncomingTransfers.length === 0">
                    <p class="italic text-gray-500">0 incoming transfers found for this license</p>
                </template>
            </b-form-group>
            <b-form-group label="Outgoing Transfers:">
                <b-form-checkbox-group class="flex flex-col"
                    v-model="reportState.reportFormFilters[ReportType.SCAN_SHEET].selectedOutgoingTransfers"
                    :options="outgoingTransferOptions"></b-form-checkbox-group>
                <template v-if="reportState.reportFormFilters[ReportType.SCAN_SHEET].allOutgoingTransfers.length === 0">
                    <p class="italic text-gray-500">0 outgoing transfers found for this license</p>
                </template>
            </b-form-group>
            <b-form-group label="Rejected Transfers:">
                <b-form-checkbox-group class="flex flex-col"
                    v-model="reportState.reportFormFilters[ReportType.SCAN_SHEET].selectedRejectedTransfers"
                    :options="rejectedTransferOptions"></b-form-checkbox-group>
                <template v-if="reportState.reportFormFilters[ReportType.SCAN_SHEET].allRejectedTransfers.length === 0">
                    <p class="italic text-gray-500">0 rejected transfers found for this license</p>
                </template>
            </b-form-group>
        </div>
    </div>
</template>

<script lang="ts">
import { IIndexedRichIncomingTransferData, IIndexedRichOutgoingTransferData, IPluginState } from "@/interfaces";
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
        incomingTransferOptions(): { html: string, value: IIndexedRichIncomingTransferData }[] {
            return store.state.reports.reportFormFilters[ReportType.SCAN_SHEET]!.allIncomingTransfers.map(
                (x: IIndexedRichIncomingTransferData) => ({
                    html: `<b>${x.ManifestNumber} (${x.PackageCount} packages, ETA ${new Date(x.EstimatedArrivalDateTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })})</b><br />
                    <span>${x.ShipperFacilityName} (${x.ShipperFacilityLicenseNumber})</span>`,
                    value: x
                }));
        },
        outgoingTransferOptions(): { html: string, value: IIndexedRichOutgoingTransferData }[] {
            return store.state.reports.reportFormFilters[ReportType.SCAN_SHEET]!.allOutgoingTransfers.map(
                (x: IIndexedRichOutgoingTransferData) => ({
                    html: `<b>${x.ManifestNumber} (${x.PackageCount} packages, ETD ${new Date(x.EstimatedDepartureDateTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })})</b><br />
                    <span>${x.RecipientFacilityName} (${x.RecipientFacilityLicenseNumber})</span>`,
                    value: x
                }));
        },
        rejectedTransferOptions(): { html: string, value: IIndexedRichIncomingTransferData }[] {
            return store.state.reports.reportFormFilters[ReportType.SCAN_SHEET]!.allRejectedTransfers.map(
                (x: IIndexedRichIncomingTransferData) => ({
                    html: `<b>${x.ManifestNumber} (${x.PackageCount} packages, ETA ${new Date(x.EstimatedArrivalDateTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })})</b><br />
                    <span>${x.ShipperFacilityName} (${x.ShipperFacilityLicenseNumber})</span>`,
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
            reportType: ReportType.SCAN_SHEET,
        });
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
