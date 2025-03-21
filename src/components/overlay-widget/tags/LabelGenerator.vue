<template>
    <fragment>
        <template v-if="isLoading">
            <div class="flex flex-col items-center justify-center h-full">
                <b-spinner large></b-spinner>
            </div>
        </template>
        <template v-if="isError">
            <div class="flex flex-col items-center justify-center h-full">
                <span class="text-red-500">Something went wrong.</span>
                <b-button @click="refreshT3Auth({})">RETRY</b-button>
            </div>
        </template>
        <template v-if="isReady">
            <div class="grid grid-cols-2 w-full h-full p-8 gap-3 justify-start" style="grid-template-columns: 1fr 1fr;">
                <div>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <b-card class="col-span-1 xl:col-span-2" v-if="!hasPlus"
                            body-class="text-lg flex flex-col text-center items-center gap-2 bg-purple-50 border-2 ttt-purple-border">
                            <span>You're using the free version of T3 label
                                printing.</span>
                            <span class="font-bold"><a class="underline text-purple-500"
                                    href="https://trackandtrace.tools/plus" target="_blank">Subscribe to T3+</a> to
                                remove the T3 promo text
                                from your labels.</span>
                        </b-card>

                        <b-card class="col-span-1 xl:col-span-2"
                            body-class="text-lg text-center flex flex-col items-center gap-4">
                            <div>T3 label printing is in beta.</div>
                            <div><a href="https://forms.gle/9J5UMXN4FkAZQ5wH9" target="_blank"
                                    class="underline text-purple-500 font-semibold">SUGGEST MORE
                                    FORMATS</a> or <a
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSd2hQFwtXyv1Bco9nHN9d4tEqkgbhe3w-WdbZAemBCTD_19VQ/viewform?usp=sf_link"
                                    class="underline text-purple-500 font-semibold" target="_blank">REPORT A
                                    PROBLEM</a>.</div>

                            <b-button variant="outline-info"
                                href="https://github.com/classvsoftware/t3-wiki/wiki/T3-Chrome-Extension-:-Label-PDF-Generator"
                                target="_blank">HOW DO I USE THIS?</b-button>
                        </b-card>

                        <b-card>
                            <b-form-group label="LABEL TEMPLATE" label-size="lg"
                                label-class="text-purple-800 font-semibold">

                                <p class="text-purple-500">Select what you're printing on and how your labels should
                                    appear
                                </p>

                            </b-form-group>

                            <b-form-group description="Select what type of labels you are printing on" label-size="lg"
                                label-class="text-purple-600">
                                <b-form-select :options="labelTemplateLayoutOptions"
                                    :value="labelPrintState.selectedTemplateLayoutId"
                                    @change="onChange('selectedTemplateLayoutId', $event)">

                                    <template #first>
                                        <b-form-select-option :value="null" disabled>Select a label
                                            template</b-form-select-option>
                                    </template>
                                </b-form-select>
                            </b-form-group>

                            <b-form-group description="Select what you want to print on your labels" label-size="lg"
                                label-class="text-purple-600">
                                <b-form-select :options="labelContentLayoutOptions"
                                    :value="labelPrintState.selectedContentLayoutId"
                                    @change="onChange('selectedContentLayoutId', $event)">

                                    <template #first>
                                        <b-form-select-option :value="null" disabled>Select a label content
                                            layout</b-form-select-option>
                                    </template>
                                </b-form-select>
                            </b-form-group>

                            <b-form-group description="How many copies of each label to generate" label-size="lg"
                                label-class="text-purple-600">
                                <b-form-input type="number" step="1" min="1" :value="labelPrintState.labelsPerTag"
                                    @change="onChange('labelsPerTag', parseInt(($event || 1).toString(), 10))"></b-form-input>
                            </b-form-group>

                            <template v-if="!isSelectedLabelContentLayoutStatic"><b-form-group
                                    description="Select how you want to provide label data" label-size="sm"
                                    label-class="text-gray-400">
                                    <!-- <label class="text-gray-400">How do you want to fill out labels?</label> -->
                                    <b-form-radio-group :options="labelEndpointConfigOptions"
                                        v-model="labelPrintState.selectedLabelEndpoint"
                                        @change="onChange('selectedLabelEndpoint', $event)" stacked />
                                </b-form-group>
                            </template>
                        </b-card>

                        <b-card body-class="flex flex-col gap-6">

                            <b-form-group label="LABEL DATA" label-size="lg"
                                label-class="text-purple-800 font-semibold">

                                <p class="text-purple-500">Select what data appears in your labels</p>
                            </b-form-group>

                            <template v-if="isSelectedLabelContentLayoutStatic">
                                <p>This label content is fixed, no label data is required.</p>
                            </template>
                            <template v-if="isDemo">
                                <p>Demo, no label data is required.</p>
                            </template>
                            <template v-else>
                                <template
                                    v-if="labelPrintState.selectedLabelEndpoint === LabelEndpoint.RAW_LABEL_GENERATOR">
                                    <template v-if="!selectedLabelContentLayout">
                                        <p>Select a label content layout</p>
                                    </template>
                                    <template v-else>
                                        <p class="font-bold">{{ selectedLabelContentLayout.labelContentLayoutId }}
                                            columns:</p>

                                        <ul class="list-disc ml-4">
                                            <li v-bind:key="element.labelContentDataKey"
                                                v-for="element of selectedLabelContentLayout.labelContentLayoutConfig.labelContentLayoutElements">
                                                <span class="font-mono font-bold">{{ element.labelContentDataKey
                                                }}</span>:
                                                {{ element.description }}
                                            </li>
                                        </ul>

                                        <button
                                            class="btn btn-outline-primary mb-0 flex flex-row gap-2 justify-center items-center"
                                            @click="downloadTemplate()">
                                            <font-awesome-icon icon="fa-download" size="lg"></font-awesome-icon>
                                            <span>DOWNLOAD LABEL DATA TEMPLATE</span>
                                        </button>

                                        <label
                                            class="btn btn-outline-success mb-0 flex flex-row gap-2 justify-center items-center">
                                            <font-awesome-icon icon="fa-file-csv" size="lg"></font-awesome-icon>
                                            <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>
                                            UPLOAD LABEL DATA CSV
                                        </label>

                                        <template v-if="labelPrintState.rawCsvMatrix">
                                            <table class="font-mono border border-gray-400 border-collapse">
                                                <tr v-bind:key="rowIdx"
                                                    v-for="[rowIdx, row] in labelPrintState.rawCsvMatrix.entries()">
                                                    <td class="border border-gray-400 border-collapse"
                                                        v-bind:key="colIdx" v-for="[colIdx, col] of row.entries()">
                                                        {{ col }}
                                                    </td>
                                                </tr>
                                            </table>
                                        </template>

                                        <simple-drawer size="md" toggleText="HOW TO USE THIS?">
                                            <div class="flex flex-col gap-6">
                                                <p>Upload a CSV to manually specify the values that should appear in
                                                    each
                                                    label. One CSV row corresponds to
                                                    one label.</p>
                                                <p class="font-bold">Required CSV formatting:</p>
                                                <table class="font-mono border border-gray-400 border-collapse">
                                                    <tr>
                                                        <th class="border border-gray-400 border-collapse"
                                                            v-bind:key="element.labelContentDataKey"
                                                            v-for="element of selectedLabelContentLayout.labelContentLayoutConfig.labelContentLayoutElements">
                                                            {{ element.labelContentDataKey }}
                                                        </th>
                                                    </tr>
                                                    <tr>
                                                        <td class="border border-gray-400 border-collapse"
                                                            v-bind:key="element.labelContentDataKey"
                                                            v-for="element of selectedLabelContentLayout.labelContentLayoutConfig.labelContentLayoutElements">
                                                            example
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="border border-gray-400 border-collapse"
                                                            v-bind:key="element.labelContentDataKey"
                                                            v-for="element of selectedLabelContentLayout.labelContentLayoutConfig.labelContentLayoutElements">
                                                            example
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            ...
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </simple-drawer>
                                    </template>
                                </template>

                                <template
                                    v-if="labelPrintState.selectedLabelEndpoint === LabelEndpoint.ACTIVE_PACKAGES">
                                    <b-form-group label="ACTIVE PACKAGE LABELS"
                                        label-class="text-purple-400 font-semibold"
                                        description="Enter tags separated by commas or newlines. Must match existing active packages in Metrc">
                                        <b-textarea :value="labelPrintState.rawTagList" rows="8"
                                            @change="onChange('rawTagList', $event)"></b-textarea>
                                    </b-form-group>

                                    <div class="pl-4" style="border-left: 2px solid #a858d0f0">
                                        <b-form-group label-class="text-gray-500">
                                            <single-package-picker class="-mb-4 w-full" inputLabel="" maxWidth="100vw"
                                                :selectInTransitPackageTypes="false"
                                                inputDescription="Search for active Metrc packages by label, item, or strain"
                                                style="grid-template-columns: repeat(1, minmax(0, 1fr));"
                                                v-on:addPackage="addPackage({ pkg: $event })" :showSelection="false"
                                                :enablePaste="false"></single-package-picker>
                                        </b-form-group>
                                    </div>

                                    <div class="pl-4" style="border-left: 2px solid #a858d0f0">
                                        <b-form-group label-class="text-gray-500"
                                            description="Highlight rows orange in the Metrc active package table to auto-add them">
                                            <p class="text-xs text-red-500 pb-2"
                                                v-if="searchState.activeUniqueMetrcGridId !== UniqueMetrcGridId.PACKAGES_ACTIVE">
                                                Select the Active Packages tab in Metrc to use this
                                            </p>
                                            <b-button
                                                :disabled="searchState.activeUniqueMetrcGridId !== UniqueMetrcGridId.PACKAGES_ACTIVE || metrcTableState.barcodeValues.length === 0"
                                                variant="outline-primary"
                                                @click="addLabels(metrcTableState.barcodeValues)">ADD
                                                {{
                                                    metrcTableState.barcodeValues.length }} SELECTED ACTIVE
                                                PACKAGES</b-button>
                                        </b-form-group>
                                    </div>
                                </template>

                                <template
                                    v-if="labelPrintState.selectedLabelEndpoint === LabelEndpoint.INTRANSIT_PACKAGES">
                                    <b-form-group label="IN TRANSIT PACKAGE LABELS"
                                        label-class="text-purple-400 font-semibold"
                                        description="Enter tags separated by commas or newlines. Must match existing in-transit packages in Metrc">
                                        <b-textarea :value="labelPrintState.rawTagList" rows="8"
                                            @change="onChange('rawTagList', $event)"></b-textarea>
                                    </b-form-group>

                                    <div class="pl-4" style="border-left: 2px solid #a858d0f0">
                                        <b-form-group label-class="text-gray-500">
                                            <single-package-picker class="-mb-4 w-full" inputLabel="" maxWidth="100vw"
                                                :selectActivePackageTypes="false" :selectInTransitPackageTypes="true"
                                                inputDescription="Search for in-transit Metrc packages by label, item, or strain"
                                                style="grid-template-columns: repeat(1, minmax(0, 1fr));"
                                                v-on:addPackage="addPackage({ pkg: $event })" :showSelection="false"
                                                :enablePaste="false"></single-package-picker>
                                        </b-form-group>
                                    </div>

                                    <div class="pl-4" style="border-left: 2px solid #a858d0f0">
                                        <b-form-group label-class="text-gray-500"
                                            description="Highlight rows orange in the Metrc in-transit package table to auto-add them">
                                            <p class="text-xs text-red-500 pb-2"
                                                v-if="searchState.activeUniqueMetrcGridId !== UniqueMetrcGridId.PACKAGES_IN_TRANSIT">
                                                Select the In Transit Packages tab in Metrc to use this
                                            </p>

                                            <b-button
                                                :disabled="searchState.activeUniqueMetrcGridId !== UniqueMetrcGridId.PACKAGES_IN_TRANSIT || metrcTableState.barcodeValues.length === 0"
                                                variant="outline-primary"
                                                @click="addLabels(metrcTableState.barcodeValues)">ADD
                                                {{
                                                    metrcTableState.barcodeValues.length }} SELECTED IN TRANSIT
                                                PACKAGES</b-button>
                                        </b-form-group>
                                    </div>
                                </template>
                            </template>

                        </b-card>

                        <simple-drawer toggleText="ADVANCED" class="col-span-1 xl:col-span-2" variant="light">
                            <div class="grid grid-cols-2 gap-8">
                                <b-form-group
                                    description="Adjust this value if you're using a low-DPI printer and the printed
        barcodes are too thick
        and/or unscannable. A higher number means thicker barcode bars. 1.0 is the recommended value for most thermal printers."
                                    label-size="lg" label-class="text-purple-600">
                                    <b-form-input type="number" step="0.01" min="0.5" max="1.5"
                                        :value="labelPrintState.barcodeBarThickness"
                                        @change="onChange('barcodeBarThickness', parseFloat($event))"></b-form-input>
                                </b-form-group>

                                <b-form-group
                                    description="Adjust this value if your printer has trouble printing the exact center of labels. A higher number means thicker margins. 1.0 is the recommended value for most thermal printers."
                                    label-size="lg" label-class="text-purple-600">
                                    <b-form-input type="number" step="0.01" min="0.5" max="1.5"
                                        :value="labelPrintState.labelMarginThickness"
                                        @change="onChange('labelMarginThickness', parseFloat($event))"></b-form-input>
                                </b-form-group>

                                <b-form-group
                                    description="Thermal printers print labels sequentially, but the spooled order is reversed (last to first). Check this box to print labels in the same order as they appear in the PDF."
                                    label-size="lg" label-class="text-purple-600">
                                    <b-form-checkbox :checked="labelPrintState.reversePrintOrderdebug"
                                        @change="onChange('reversePrintOrder', $event)">
                                        Reverse print order
                                    </b-form-checkbox>
                                </b-form-group>

                                <b-form-group description="Draws boxes around printed content" label-size="lg"
                                    label-class="text-purple-600">
                                    <b-form-checkbox :checked="labelPrintState.debug"
                                        @change="onChange('debug', $event)">
                                        Debug
                                    </b-form-checkbox>
                                </b-form-group>
                            </div>
                        </simple-drawer>
                    </div>
                </div>

                <div class="flex flex-col items-stretch justify-start gap-8">
                    <div class="flex flex-row justify-center gap-3">

                        <b-button size="lg" variant="primary"
                            :disabled="!enableGeneration || labelPrintState.status === LabelPrintStatus.INFLIGHT"
                            @click="generateLabelPdf()">GENERATE
                            PDF</b-button>

                        <b-button size="lg" variant="success"
                            v-if="labelPrintState.labelPdfBlobUrl && labelPrintState.status === LabelPrintStatus.SUCCESS"
                            @click="downloadPdf({})">DOWNLOAD
                            PDF</b-button>
                    </div>

                    <div class="grid place-items-center">
                        <b-spinner v-if="labelPrintState.status === LabelPrintStatus.INFLIGHT"></b-spinner>
                    </div>

                    <p class="text-center"
                        v-if="!enableGeneration && labelPrintState.status !== LabelPrintStatus.INFLIGHT">No label
                        data found. Provide label data to
                        generate labels.
                    </p>

                    <template v-if="labelPrintState.status === LabelPrintStatus.SUCCESS">
                        <iframe :src="labelPrintState.labelPdfBlobUrl" class="w-full" style="height: 70vh"></iframe>
                    </template>
                    <template v-if="labelPrintState.status === LabelPrintStatus.ERROR">
                        <pre class="text-red-500 text-lg text-start">{{ labelPrintState.errorText }}</pre>
                    </template>
                </div>
            </div>
        </template>
    </fragment>
</template>

<script lang="ts">
import SimpleDrawer from "@/components/shared/SimpleDrawer.vue";
import { UniqueMetrcGridId } from "@/consts";
import { IIndexedPackageData, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { LabelEndpoint, LabelPrintActions, LabelPrintGetters, LabelPrintMutations, LabelPrintStatus } from "@/store/page-overlay/modules/label-print/consts";
import { ILabelEndpointConfig } from "@/store/page-overlay/modules/label-print/interfaces";
import { PluginAuthActions, T3ApiAuthState } from "@/store/page-overlay/modules/plugin-auth/consts";
import { hasPlusImpl } from "@/utils/plus";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import SinglePackagePicker from "../shared/SinglePackagePicker.vue";

export default Vue.extend({
    name: "LabelGenerator",
    store,
    router,
    props: {},
    components: {
        SinglePackagePicker,
        SimpleDrawer
    },
    computed: {
        ...mapState<IPluginState>({
            pluginAuthState: (state: IPluginState) => state.pluginAuth,
            labelPrintState: (state: IPluginState) => state.labelPrint,
            metrcTableState: (state: IPluginState) => state.metrcTable,
            searchState: (state: IPluginState) => state.search,
        }),
        hasPlus(): boolean {
            return hasPlusImpl();
        },
        ...mapGetters({
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
            labelEndpointConfigOptions: `labelPrint/${LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS}`,
            enableGeneration: `labelPrint/${LabelPrintGetters.ENABLE_GENERATION}`,
            selectedLabelContentLayout: `labelPrint/${LabelPrintGetters.SELECTED_LABEL_CONTENT_LAYOUT}`,
            isSelectedLabelContentLayoutStatic: `labelPrint/${LabelPrintGetters.IS_SELECTED_LABEL_CONTENT_LAYOUT_STATIC}`,
            isDemo: `labelPrint/${LabelPrintGetters.IS_DEMO}`,
        }),
        isLoading(): boolean {
            return store.state.pluginAuth.t3ApiAuthState === T3ApiAuthState.INITIAL;
        },
        isError(): boolean {
            return store.state.pluginAuth.t3ApiAuthState === T3ApiAuthState.NOT_AUTHENTICATED;
        },
        isReady(): boolean {
            return store.state.pluginAuth.t3ApiAuthState === T3ApiAuthState.AUTHENTICATED;
        },
        labelTemplateLayoutOptions(): ({ text?: string, value: string | null, html?: string, disabled?: boolean })[] {
            const thermalOptionGroup = store.state.labelPrint.labelTemplateLayoutOptions.filter((x) => x.labelTemplateLayoutConfig.printerTypes.includes('THERMAL')).map((x) => ({
                text: x.description,
                value: x.labelTemplateLayoutId
            }));
            const inkjetOptionGroup = store.state.labelPrint.labelTemplateLayoutOptions.filter((x) => x.labelTemplateLayoutConfig.printerTypes.includes('INKJET')).map((x) => ({
                text: x.description,
                value: x.labelTemplateLayoutId
            }));
            const laserOptionGroup = store.state.labelPrint.labelTemplateLayoutOptions.filter((x) => x.labelTemplateLayoutConfig.printerTypes.includes('LASER')).map((x) => ({
                text: x.description,
                value: x.labelTemplateLayoutId
            }));

            return [{
                disabled: true,
                text: 'THERMAL',
                value: null,
            },
            ...thermalOptionGroup,
            {
                disabled: true,
                text: 'LASER/INKJET',
                value: null,
            },
            ...laserOptionGroup,
            {
                value: null,
                disabled: true,
                html: `Don't see what you need? Click the SUGGEST MORE FORMATS link!`
            }];
        },
        labelContentLayoutOptions(): ({ text?: string, value: string | null, html?: string, disabled?: boolean })[] {
            const horizontalRectangleOptionGroup = store.state.labelPrint.labelContentLayoutOptions.filter((x) => x.labelContentLayoutConfig.aspectRatio > 1.1).map((x) => ({
                text: x.description,
                value: x.labelContentLayoutId
            }));
            const squareOptionGroup = store.state.labelPrint.labelContentLayoutOptions.filter((x) => x.labelContentLayoutConfig.aspectRatio > 0.9 && x.labelContentLayoutConfig.aspectRatio < 1.1).map((x) => ({
                text: x.description,
                value: x.labelContentLayoutId
            }));
            const verticalRectantgleOptionGroup = store.state.labelPrint.labelContentLayoutOptions.filter((x) => x.labelContentLayoutConfig.aspectRatio < 0.9).map((x) => ({
                text: x.description,
                value: x.labelContentLayoutId
            }));

            return [
                ...horizontalRectangleOptionGroup,
                ...squareOptionGroup,
                ...verticalRectantgleOptionGroup,
                {
                    value: null,
                    disabled: true,
                    html: `Don't see what you need? Click the SUGGEST MORE FORMATS link!`
                }
            ];

            // return [{
            //     label: 'HORIZONTAL RECTANGLES',
            //     options: horizontalRectangleOptionGroup
            // }, {
            //     label: 'SQUARE',
            //     options: squareOptionGroup
            // }, {
            //     label: 'VERTICAL RECTANGLES',
            //     options: verticalRectantgleOptionGroup
            // },
            // {
            //     value: null,
            //     disabled: true,
            //     html: `Don't see what you need? Click the SUGGEST ADDITIONAL FORMATS link!`
            // }];
        },
        labelEndpointConfigOptions(): { text: string, value: LabelEndpoint }[] {
            return store.getters[`labelPrint/${LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS}`].map((x: ILabelEndpointConfig) => ({
                text: x.description,
                value: x.id
            }));
        }
    },
    data() {
        return {
            LabelPrintStatus,
            csvFile: null,
            T3ApiAuthState,
            UniqueMetrcGridId,
            LabelEndpoint
        };
    },
    methods: {
        ...mapActions({
            refreshT3Auth: `pluginAuth/${PluginAuthActions.REFRESH_T3API_AUTH_STATE}`,
            downloadPdf: `labelPrint/${LabelPrintActions.DOWNLOAD_PDF}`,
            downloadTemplate: `labelPrint/${LabelPrintActions.DOWNLOAD_CSV_TEMPLATE}`,
        }),
        onChange(field: string, value: any) {
            store.commit(`labelPrint/${LabelPrintMutations.LABEL_PRINT_MUTATION}`, {
                [field]: value
            });
        },
        async generateLabelPdf() {
            // this.$data.inflight
            await store.dispatch(`labelPrint/${LabelPrintActions.GENERATE_LABEL_PDF}`, {});
        },
        addPackage({ pkg }: { pkg: IIndexedPackageData }) {
            this.addLabels([pkg.Label]);
        },
        addLabels(labels: string[]) {
            store.commit(`labelPrint/${LabelPrintMutations.LABEL_PRINT_MUTATION}`, {
                rawTagList: `${store.state.labelPrint.rawTagList}${store.state.labelPrint.rawTagList.length > 0 ? '\n' : ''}${labels.join('\n')}`
            });
        }
    },
    async created() { },
    async mounted() {
        await store.dispatch(`pluginAuth/${PluginAuthActions.REFRESH_T3API_AUTH_STATE}`, {});

        store.dispatch(`labelPrint/${LabelPrintActions.UPDATE_LAYOUT_OPTIONS}`, {});
    },
    watch: {
        csvFile: {
            immediate: true,
            handler(newValue, oldValue) {
                if (!newValue) {
                    return;
                }

                store.dispatch(`labelPrint/${LabelPrintActions.LOAD_CSV}`, {
                    file: newValue,
                });
            },
        },
        // labelPrintState: {
        //     immediate: true,
        //     handler(newValue, oldValue) {
        //         this.$data.labelPrintState = JSON.parse(JSON.stringify(store.state.labelPrint));
        //         // store.commit(`labelPrint/${LabelPrintMutations.}`, this.$data.labelPrintState);
        //     },
        // },
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
