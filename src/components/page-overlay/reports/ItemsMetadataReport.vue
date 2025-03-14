<template>
    <div v-if="selectedReports.find(
        (report) => report.value === ReportType.ITEMS_METADATA
    )
    " class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
        <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Items Metadata</div>
        <hr />
        <div class="flex flex-col items-stretch gap-4">
            <div class="font-semibold text-gray-700">Filters:</div>

            <simple-drawer toggleText="ADVANCED">
                <report-license-picker :formFilters="itemsMetadataReportFormFilters"></report-license-picker>
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
import { IItemsMetadataReportFormFilters } from "@/utils/reports/items-metadata-report";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "ItemsMetadataReport",
    store,
    router,
    props: {
        itemsMetadataReportFormFilters: Object as () => IItemsMetadataReportFormFilters,

    },
    components: {
        SimpleDrawer,
        ReportLicensePicker
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
