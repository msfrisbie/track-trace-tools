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
            <div class="grid grid-cols-2 w-full h-full p-8 gap-8 justify-start"
                style="grid-template-columns: 420px 1fr;">
                <div class="flex flex-col items-stretch gap-8">

                    <b-card v-if="!hasPlus" class="text-lg">
                        <div class="flex flex-col gap-2">
                            <span>You're using the free version of T3 label
                                printing.</span>
                            <span class="font-bold"><a class="underline text-purple-500"
                                    href="https://trackandtrace.tools/plus" target="_blank">Subscribe to T3+</a> to
                                remove the T3 promo text
                                from your labels.</span>
                        </div>
                    </b-card>

                    <b-card class="text-lg">T3 label printing is in beta.<br /><a
                            href="https://forms.gle/9J5UMXN4FkAZQ5wH9" target="_blank"
                            class="underline text-purple-500 font-semibold">SUGGEST MORE
                            FORMATS</a> or <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSd2hQFwtXyv1Bco9nHN9d4tEqkgbhe3w-WdbZAemBCTD_19VQ/viewform?usp=sf_link"
                            class="underline text-purple-500 font-semibold" target="_blank">REPORT A
                            PROBLEM</a>.</b-card>

                    <!-- <b-form-group label="LABEL GENERATION"
                        description="Automatically generate from tag numbers, or manually provide label text"
                        label-size="sm" label-class="text-gray-400">
                        <b-form-select :options="labelEndpointConfigOptions"
                            :value="labelPrintState.selectedLabelEndpoint"
                            @change="onChange('selectedLabelEndpoint', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>How do you want to fill out
                                    labels?</b-form-select-option>
                            </template></b-form-select>
</b-form-group> -->

                    <hr />

                    <b-form-group label="LABEL TEMPLATE" description="Select what type of labels you are printing on"
                        label-size="lg" label-class="text-purple-600">
                        <b-form-select :options="labelTemplateLayoutOptions"
                            :value="labelPrintState.selectedTemplateLayoutId"
                            @change="onChange('selectedTemplateLayoutId', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>Select a label
                                    template</b-form-select-option>
                            </template>
                        </b-form-select>
                    </b-form-group>

                    <b-form-group description="Specifies what you want to print on your labels" label-size="lg"
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

                    <hr />

                    <b-form-group label="TAG LIST"
                        description="Enter tags separated by commas or newlines. Must match existing tags in Metrc"
                        label-size="lg" label-class="text-purple-600">
                        <b-textarea :value="labelPrintState.rawTagList"
                            @change="onChange('rawTagList', $event)"></b-textarea>
                    </b-form-group>

                    <single-package-picker class="w-full" inputLabel="AUTO-ADD PACKAGE TAG SEARCH"
                        style="grid-template-columns: repeat(1, minmax(0, 1fr));"
                        v-on:addPackage="addPackage({ pkg: $event })" :showSelection="false"
                        :enablePaste="false"></single-package-picker>

                    <div class="flex flex-col gap-1">
                        <b-button :disabled="metrcTableState.barcodeValues.length === 0" variant="outline-primary"
                            @click="addLabels(metrcTableState.barcodeValues)">ADD {{
                                metrcTableState.barcodeValues.length }} SELECTED METRC
                            PACKAGES</b-button>
                        <span class="text-xs text-gray-400" v-if="metrcTableState.barcodeValues.length === 0">
                            Highlight rows in the Metrc package table to auto-add them
                        </span>
                    </div>

                    <hr />

                    <b-form-group description="How many copies of each label to generate" label-size="lg"
                        label-class="text-purple-600">
                        <b-form-input type="number" step="1" min="1" :value="labelPrintState.labelsPerTag"
                            @change="onChange('labelsPerTag', $event)"></b-form-input>
                    </b-form-group>

                    <b-button variant="primary" :disabled="!enableGeneration" @click="generateLabelPdf()">GENERATE
                        PDF</b-button>

                    <b-button variant="success" v-if="labelPrintState.labelPdfBlobUrl" @click="downloadPdf({})">DOWNLOAD
                        PDF</b-button>

                </div>
                <div>
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
        SinglePackagePicker
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
