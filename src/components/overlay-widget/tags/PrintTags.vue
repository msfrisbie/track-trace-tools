<template>
    <fragment>
        <div class="flex flex-col items-center">
            <template v-if="totalLabels === 0">
                <div class="font-bold">You haven't added any labels to print.</div>
                <div>Add labels using T3 search, by selecting rows in Metrc, or in
                    T3 tool menus.</div>
            </template>
            <template v-else>
                <div class="flex flex-row gap-8">
                    <div class="grid grid-cols-2 gap-4 place-items-center">
                        <fragment v-for="labelData of activeLabels" v-bind:key="labelData.primaryValue">
                            <div class="w-full rounded overflow-hidden flex flex-col items-center"
                                style="border: 1px dashed gray">
                                <printable-tag :label="labelData.primaryValue"
                                    :title="showDescription ? labelData.secondaryValue : null"></printable-tag>
                            </div>
                            <div class="flex flex-row items-center gap-8">
                                <div class="text-4xl">x{{ labelData.count }}</div>
                                <div>
                                    <b-button variant="outline-danger" size="lg"
                                        @click="removeLabel({ labelValue: labelData.primaryValue })">&times;</b-button>
                                </div>
                            </div>
                        </fragment>
                    </div>
                    <div class="flex flex-col gap-2">
                        <div class="text-red-500 max-w-md" v-if="!hasT3plus">
                            You're using the free version of T3 label printing. Subscribe to T3+ to unlock all features.
                        </div>

                        <div>Printer label template:</div>
                        <div class="flex flex-col gap-2">
                            <b-form-select v-model="labelTemplateOption"
                                :options="labelTemplateOptions"></b-form-select>
                        </div>

                        <div>Printer label template:</div>
                        <div class="flex flex-col gap-2">
                            <b-form-select v-model="labelLayoutOption" :options="labelLayoutOptions"></b-form-select>
                        </div>

                        <div>Copies per tag:</div>
                        <div class="flex flex-col gap-2">
                            <b-form-select :disabled="!hasT3plus" :options="copiesOptions"
                                @change="updateCount($event)"></b-form-select>
                        </div>

                        <div class="flex flex-col items-stretch gap-2 my-16">
                            <b-button variant="primary" :disabled="!hasT3plus && totalLabels > 10" @click="printLabels({
                labelDataList: activeLabels,
                templateId: labelTemplateOption,
                layoutId: labelLayoutOption,
                download: false
            })">PRINT {{ totalLabels }} TAGS</b-button>
                            <div v-if="!hasT3plus && totalLabels > 10" class="text-red-500 text-xs">
                                Free plans are limited to 10 tags per PDF.
                            </div>
                        </div>
                        <!-- <b-button variant="outline-primary" @click="generateLabelFields()"
                            :disabled="!hasT3plus">REGENERATE TAG
                            DESCRIPTIONS</b-button> -->

                        <b-button variant="outline-danger" @click="resetLabels()">CLEAR ALL TAGS</b-button>
                    </div>
                </div>
            </template>
        </div>
    </fragment>
</template>

<script lang="ts">
import PrintableTag from '@/components/overlay-widget/shared/PrintableTag.vue';
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { LabelPrintActions, LabelPrintGetters } from "@/store/page-overlay/modules/label-print/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "PrintTags",
    store,
    router,
    props: {},
    components: {
        PrintableTag
    },
    computed: {
        ...mapState<IPluginState>({
            authState: (state: IPluginState) => state.pluginAuth.authState,
            labelPrintState: (state: IPluginState) => state.labelPrint
        }),
        ...mapGetters({
            activeLabels: `labelPrint/${LabelPrintGetters.ACTIVE_LABELS}`,
            totalLabels: `labelPrint/${LabelPrintGetters.TOTAL_LABELS}`,
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
        }),
        showDescription(): boolean {
            return this.$data.labelLayoutOption === 'COL_DESC_CODE128_ID';
        },
        labelTemplateOptions(): { value: string, text: string, disabled: boolean }[] {
            return [
                {
                    text: 'Avery 8160 (2 5/8" x 1")',
                    value: 'AVERY_8160',
                    disabled: false
                },
                {
                    text: 'Thermal (3 1/2" x 1 1/8")',
                    value: 'THERMAL_3.5W_1.125H',
                    disabled: false
                },
                {
                    text: 'Thermal (3" x 1")',
                    value: 'THERMAL_3.0W_1.0H',
                    disabled: !this.hasT3plus
                }
            ];
        },
        labelLayoutOptions(): { value: string, text: string, disabled: boolean }[] {
            return [
                {
                    text: 'Barcode only',
                    value: 'COL_CODE128_ID',
                    disabled: false
                },
                {
                    text: 'Barcode + Description',
                    value: 'COL_DESC_CODE128_ID',
                    disabled: !this.hasT3plus
                }
            ];
        },
    },
    data() {
        return {
            copiesOptions: Array.from(Array(25), (x, i) => i + 1),
            labelTemplateOption: "AVERY_8160",
            labelLayoutOption: store.getters[`client/${ClientGetters.T3PLUS}`] ? 'COL_DESC_CODE128_ID' : 'COL_CODE128_ID'
        };
    },
    methods: {
        ...mapActions({
            resetLabels: `labelPrint/${LabelPrintActions.RESET_LABELS}`,
            removeLabel: `labelPrint/${LabelPrintActions.REMOVE_LABEL}`,
            printLabels: `labelPrint/${LabelPrintActions.PRINT_LABELS}`,
            generateLabelFields: `labelPrint/${LabelPrintActions.GENERATE_LABEL_FIELDS}`
        }),
        updateCount(count: string) {
            const labelDataList = store.state.labelPrint.labelDataList;

            for (const labelData of labelDataList) {
                if (labelData.licenseNumber !== store.state.pluginAuth.authState?.license) {
                    continue;
                }

                labelData.count = parseInt(count, 10);
            }

            store.dispatch(`labelPrint/${LabelPrintActions.UPDATE_LABELS}`, {
                labelDataList
            });
        },
    },
    async created() { },
    async mounted() {
        // this.generateLabelFields();
    },
    watch: {
        foobar: {
            immediate: true,
            handler(newValue, oldValue) { },
        },
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
