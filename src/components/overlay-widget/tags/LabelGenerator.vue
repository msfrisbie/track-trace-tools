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

                    <b-form-group label="LABEL TEMPLATE" description="Select what type of labels you are printing on"
                        label-size="lg" label-class="text-purple-600">
                        <b-form-select :options="labelTemplateLayoutOptions"
                            :value="labelPrintState.selectedTemplateLayout"
                            @change="onChange('selectedTemplateLayout', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>Select a label
                                    template</b-form-select-option>
                            </template></b-form-select>
                    </b-form-group>

                    <b-form-group label="LABEL LAYOUT" description="Specifies what you want to print on your labels"
                        label-size="lg" label-class="text-purple-600">
                        <b-form-select :options="labelContentLayoutOptions"
                            :value="labelPrintState.selectedContentLayout"
                            @change="onChange('selectedContentLayout', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>Select a label content
                                    layout</b-form-select-option>
                            </template></b-form-select>
                    </b-form-group>

                    <!-- TODO -->
                    <!-- <b-form-select :value="labelPrintState.labelsPerTag" @change="onChange('labelsPerTag', $event)"
                        :options="Array.from({ length: 20 }, (_, i) => ({ value: i + 1, text: i + 1 }))"></b-form-select> -->

                    <b-form-group label="TAG LIST"
                        description="Enter tags separated by commas or newlines. Must match existing tags in Metrc"
                        label-size="lg" label-class="text-purple-600">
                        <b-textarea :value="labelPrintState.rawTagList"
                            @change="onChange('rawTagList', $event)"></b-textarea>
                    </b-form-group>

                    <b-form-group description="Selecting a package here will autofill its tag into the tag list"
                        label-size="sm" label-class="text-gray-400">
                        <single-package-picker class="w-full" style="grid-template-columns: repeat(1, minmax(0, 1fr));"
                            v-on:addPackage="addPackage({ pkg: $event })" :showSelection="false"
                            :enablePaste="false"></single-package-picker>
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
import { ILabelContentLayoutOption, ILabelEndpointConfig, ILabelTemplateLayoutOption } from "@/store/page-overlay/modules/label-print/interfaces";
import { PluginAuthActions, T3ApiAuthState } from "@/store/page-overlay/modules/plugin-auth/consts";
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
        }),
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
        labelTemplateLayoutOptions(): { text: string, value: ILabelTemplateLayoutOption }[] {
            return store.state.labelPrint.labelTemplateLayoutOptions.map((x) => ({
                text: x.description,
                value: x
            }));
        },
        labelContentLayoutOptions(): { text: string, value: ILabelContentLayoutOption }[] {
            return store.state.labelPrint.labelContentLayoutOptions.map((x) => ({
                text: x.description,
                value: x
            }));
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
            store.commit(`labelPrint/${LabelPrintMutations.LABEL_PRINT_MUTATION}`, {
                rawTagList: `${store.state.labelPrint.rawTagList}${store.state.labelPrint.rawTagList.length > 0 ? '\n' : ''}${pkg.Label}`
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
