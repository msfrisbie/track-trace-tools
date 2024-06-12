<template>
    <fragment>
        <div class="flex flex-col items-center">
            <template v-if="labelPrintState.labelDataList.length === 0">
                <div class="font-bold">You haven't added any labels to print.</div>
                <div>Add labels using T3 search, by selecting rows in Metrc, or in
                    T3 tool menus.</div>
            </template>
            <template v-else>
                <div class="grid grid-cols-3 gap-4 place-items-center">
                    <div class="flex flex-col items-center gap-2">
                        <b-button variant="primary" :disabled="!hasT3plus && totalLabels > 10" @click="printLabels({
                labelDataList: labelPrintState.labelDataList,
                templateId: labelTemplateOption,
                download: false
            })">PRINT {{ totalLabels }} TAGS</b-button>
                        <div v-if="!hasT3plus && totalLabels > 10" class="text-red-500 text-xs">
                            Free plans are limited to 10 tags per PDF. Print unlimited labels with T3+
                        </div>
                    </div>
                    <div></div>
                    <b-button variant="warning" @click="resetLabels()">CLEAR ALL TAGS</b-button>

                    <div></div>
                    <div>Copies per tag:</div>
                    <div class="flex flex-col gap-2">
                        <b-form-select :disabled="!hasT3plus" :options="copiesOptions"
                            @change="updateCount($event)"></b-form-select>
                        <div v-if="!hasT3plus" class="text-red-500 text-xs">
                            Enable this with T3+
                        </div>
                    </div>

                    <div></div>
                    <div>Printer label template:</div>
                    <div class="flex flex-col gap-2">
                        <b-form-select v-model="labelTemplateOption" :options="labelTemplateOptions"></b-form-select>
                        <div v-if="!hasT3plus" class="text-red-500 text-xs">
                            Enable all label templates with T3+
                        </div>
                    </div>

                    <div class="col-span-3 h-24"></div>

                    <fragment v-for="labelData of labelPrintState.labelDataList" v-bind:key="labelData.primaryValue">
                        <printable-tag :label="labelData.primaryValue"></printable-tag>
                        <div class="text-4xl">x{{ labelData.count }}</div>
                        <div>
                            <b-button variant="outline-danger"
                                @click="removeLabel({ labelValue: labelData.primaryValue })">&times; REMOVE</b-button>
                        </div>
                    </fragment>
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
            totalLabels: `labelPrint/${LabelPrintGetters.TOTAL_LABELS}`,
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
        }),
        labelTemplateOptions(): { value: string, text: string, disabled: boolean }[] {
            return [
                {
                    text: 'Avery 8160 (2 5/8" x 1")',
                    value: 'AVERY_8160',
                    disabled: false
                },
                {
                    text: 'Dymo 30252 (3 1/2" x 1 1/8")',
                    value: 'DYMO_30252',
                    disabled: !this.hasT3plus
                }
            ];
        }
    },
    data() {
        return {
            copiesOptions: Array.from(Array(25), (x, i) => i + 1),
            labelTemplateOption: "AVERY_8160"
        };
    },
    methods: {
        ...mapActions({
            resetLabels: `labelPrint/${LabelPrintActions.RESET_LABELS}`,
            removeLabel: `labelPrint/${LabelPrintActions.REMOVE_LABEL}`,
            printLabels: `labelPrint/${LabelPrintActions.PRINT_LABELS}`
        }),
        updateCount(count: string) {
            store.dispatch(`labelPrint/${LabelPrintActions.UPDATE_LABELS}`, {
                labelDataList: store.state.labelPrint.labelDataList.map((x) => ({
                    ...x,
                    ...{
                        count: parseInt(count, 10)
                    }
                }))
            });
        },
    },
    async created() { },
    async mounted() { },
    watch: {
        foobar: {
            immediate: true,
            handler(newValue, oldValue) { },
        },
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
