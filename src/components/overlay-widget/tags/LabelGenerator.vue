<template>
    <fragment>
        <div class="flex flex-col items-center justify-center h-full">
            <template v-if="isLoading">
                <b-spinner small></b-spinner>
            </template>
            <template v-if="isError">
                <span class="text-red-500">Something went wrong.</span>
                <b-button @click="refreshT3Auth()">RETRY</b-button>
            </template>
            <template v-if="isReady">
                <div class="grid grid-cols-2 w-full" style="grid-template-columns: 420px 1fr;">
                    <div class="flex flex-col items-stretch">
                        <b-form-select :options="labelEndpointConfigOptions"
                            :value="labelPrintState.selectedLabelEndpoint"
                            @change="onChange('selectedLabelEndpoint', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>How do you want to fill out
                                    labels?</b-form-select-option>
                            </template></b-form-select>

                        <b-form-select :options="labelTemplateLayoutOptions"
                            :value="labelPrintState.selectedTemplateLayout"
                            @change="onChange('selectedTemplateLayout', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>Select a label
                                    template</b-form-select-option>
                            </template></b-form-select>

                        <b-form-select :options="labelContentLayoutOptions"
                            :value="labelPrintState.selectedContentLayout"
                            @change="onChange('selectedContentLayout', $event)">

                            <template #first>
                                <b-form-select-option :value="null" disabled>Select a label content
                                    layout</b-form-select-option>
                            </template></b-form-select>

                        <b-textarea :value="labelPrintState.rawTagList"
                            @change="onChange('rawTagList', $event)"></b-textarea>

                        <b-button @click="generateLabelPdf()">GENERATE</b-button>
                    </div>
                    <div>
                        <iframe v-if="labelPrintState.labelPdfBlobUrl" :src="labelPrintState.labelPdfBlobUrl"
                            width="100%" height="600px"></iframe>
                        {{ labelPrintState }}
                    </div>
                </div>
            </template>
        </div>
    </fragment>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { LabelEndpoint, LabelPrintActions, LabelPrintGetters, LabelPrintMutations } from "@/store/page-overlay/modules/label-print/consts";
import { ILabelContentLayoutOption, ILabelEndpointConfig, ILabelTemplateLayoutOption } from "@/store/page-overlay/modules/label-print/interfaces";
import { PluginAuthActions, T3ApiAuthState } from "@/store/page-overlay/modules/plugin-auth/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "LabelGenerator",
    store,
    router,
    props: {},
    components: {
    },
    computed: {
        ...mapState<IPluginState>({
            pluginAuthState: (state: IPluginState) => state.pluginAuth,
            labelPrintState: (state: IPluginState) => state.labelPrint,
        }),
        ...mapGetters({
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
            labelEndpointConfigOptions: `labelPrint/${LabelPrintGetters.LABEL_ENDPOINT_CONFIG_OPTIONS}`,
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
            // TODO this might not work with a file type, serialize to string?
            // labelPrintState: JSON.parse(JSON.stringify(store.state.labelPrint)),
        };
    },
    methods: {
        ...mapActions({
            refreshT3Auth: `pluginAuth/${PluginAuthActions.REFRESH_T3API_AUTH_STATE}`,
            // generateLabelPdf: `labelPrint/${LabelPrintActions.GENERATE_LABEL_PDF}`
        }),
        onChange(field: string, value: any) {
            store.commit(`labelPrint/${LabelPrintMutations.LABEL_PRINT_MUTATION}`, {
                [field]: value
            });
        },
        async generateLabelPdf() {
            // this.$data.inflight
            await store.dispatch(`labelPrint/${LabelPrintActions.GENERATE_LABEL_PDF}`, {});
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
