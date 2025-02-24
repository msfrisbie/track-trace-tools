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

                        <!-- <b-form-group label="LABEL GENERATION"
                        description="Automatically generate from tag numbers, or manually provide label text"
                        label-size="sm" label-class="text-gray-400">
                        <b-form-select :options="labelEndpointConfigOptions"
                            :value="labelPrintState.selectedLabelEndpoint"
                            @change="onChange('selectedLabelEndpoint', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>How do you want to fill out
                                    labels?</b-form-select-option>
                            </template></b-form-select></b-form-group> -->

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
                                    @change="onChange('labelsPerTag', $event)"></b-form-input>
                            </b-form-group>
                        </b-card>

                        <b-card>
                            <b-form-group label="LABEL DATA" label-size="lg"
                                label-class="text-purple-800 font-semibold">

                                <p class="text-purple-500">Select what data appears in your labels</p>

                            </b-form-group>

                            <b-form-group
                                description="Enter tags separated by commas or newlines. Must match existing tags in Metrc">
                                <b-textarea :value="labelPrintState.rawTagList"
                                    @change="onChange('rawTagList', $event)"></b-textarea>
                            </b-form-group>

                            <div class="pl-4" style="border-left: 2px solid #a858d0f0">
                                <b-form-group label="SEARCH FOR PACKAGES" label-class="text-gray-500">
                                    <single-package-picker class="w-full" inputLabel=""
                                        inputDescription="Search for Metrc packages by label or item"
                                        style="grid-template-columns: repeat(1, minmax(0, 1fr));"
                                        v-on:addPackage="addPackage({ pkg: $event })" :showSelection="false"
                                        :enablePaste="false"></single-package-picker>
                                </b-form-group>
                            </div>

                            <div class="pl-4" style="border-left: 2px solid #a858d0f0">
                                <b-form-group label="SELECT PACKAGES IN METRC" label-class="text-gray-500"
                                    description="Highlight rows in the Metrc package table to auto-add them">
                                    <b-button :disabled="metrcTableState.barcodeValues.length === 0"
                                        variant="outline-primary" @click="addLabels(metrcTableState.barcodeValues)">ADD
                                        {{
                                            metrcTableState.barcodeValues.length }} SELECTED METRC
                                        PACKAGES</b-button>
                                    <!-- <span class="text-xs text-gray-400" v-if="metrcTableState.barcodeValues.length === 0">
                        </span> -->
                                </b-form-group>
                            </div>
                        </b-card>

                        <simple-drawer toggleText="ADVANCED" class="col-span-1 xl:col-span-2">
                            <b-form-group
                                description="Adjust this value if you're using a low-DPI printer and the printed
        barcodes are too thick
        and/or unscannable. A higher number means thicker barcode bars. 0.94 is the recommended value for most thermal printers."
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

                            <b-form-group>
                                <b-form-checkbox :checked="labelPrintState.debug" @change="onChange('debug', $event)">
                                    Debug
                                </b-form-checkbox>
                            </b-form-group>
                        </simple-drawer>
                    </div>
                </div>

                <div class="flex flex-col items-stretch justify-center gap-8">
                    <div class="flex flex-row justify-center gap-3">
                        <b-button size="lg" variant="primary" :disabled="!enableGeneration"
                            @click="generateLabelPdf()">GENERATE
                            PDF</b-button>

                        <b-button size="lg" variant="success" v-if="labelPrintState.labelPdfBlobUrl"
                            @click="downloadPdf({})">DOWNLOAD
                            PDF</b-button>
                    </div>

                    <p class="text-center" v-if="!enableGeneration">Select at least one package tag to generate labels
                    </p>

                    <template v-if="labelPrintState.labelPdfBlobUrl">
                        <iframe :src="labelPrintState.labelPdfBlobUrl" class="w-full" style="height: 70vh"></iframe>
                    </template>
                    <template v-if="labelPrintState.errorText">
                        <pre class="text-red-500 text-lg text-center">{{ labelPrintState.errorText }}</pre>
                    </template>
                </div>

            </div>
        </template>
    </fragment>
</template>

<script lang="ts">
import SimpleDrawer from "@/components/shared/SimpleDrawer.vue";
import { IIndexedPackageData, IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { LabelEndpoint, LabelPrintActions, LabelPrintGetters, LabelPrintMutations } from "@/store/page-overlay/modules/label-print/consts";
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
        }),
        hasPlus(): boolean {
            return hasPlusImpl();
        },
        ...mapGetters({
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
            labelEndpointConfigOptions: `labelPrint/${LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS}`,
            enableGeneration: `labelPrint/${LabelPrintGetters.ENABLE_GENERATION}`,
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
            const thermalOptionGroup = store.state.labelPrint.labelTemplateLayoutOptions.filter((x) => x.printerTypes.includes('THERMAL')).map((x) => ({
                text: x.description,
                value: x.id
            }));
            const inkjetOptionGroup = store.state.labelPrint.labelTemplateLayoutOptions.filter((x) => x.printerTypes.includes('INKJET')).map((x) => ({
                text: x.description,
                value: x.id
            }));
            const laserOptionGroup = store.state.labelPrint.labelTemplateLayoutOptions.filter((x) => x.printerTypes.includes('LASER')).map((x) => ({
                text: x.description,
                value: x.id
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
            const horizontalRectangleOptionGroup = store.state.labelPrint.labelContentLayoutOptions.filter((x) => x.aspectRatio > 1.1).map((x) => ({
                text: x.description,
                value: x.id
            }));
            const squareOptionGroup = store.state.labelPrint.labelContentLayoutOptions.filter((x) => x.aspectRatio > 0.9 && x.aspectRatio < 1.1).map((x) => ({
                text: x.description,
                value: x.id
            }));
            const verticalRectantgleOptionGroup = store.state.labelPrint.labelContentLayoutOptions.filter((x) => x.aspectRatio < 0.9).map((x) => ({
                text: x.description,
                value: x.id
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
            T3ApiAuthState,
        };
    },
    methods: {
        ...mapActions({
            refreshT3Auth: `pluginAuth/${PluginAuthActions.REFRESH_T3API_AUTH_STATE}`,
            downloadPdf: `labelPrint/${LabelPrintActions.DOWNLOAD_PDF}`,
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
