<template>
    <fragment>
        <div class="flex flex-col items-center">
            <template v-if="labelPrintState.labelDataList.length === 0">
                <div>You haven't added any labels to print.</div>
                <div>Add labels using T3 search, by selecting rows in Metrc, or in
                    T3 tool menus.</div>
            </template>
            <template v-else>
                <div class="grid grid-cols-2 gap-4">
                    <div>Copies per tag:</div>
                    <b-form-select v-model="selected" :options="options" @change="updateCount($event)"></b-form-select>
                    <hr class="col-span-2" />
                    <fragment v-for="labelData of labelPrintState.labelDataList" v-bind:key="labelData.primaryValue">
                        <metrc-tag :label="labelData.primaryValue" sideText="METRC"></metrc-tag>
                        <div>
                            <b-button variant="outline-danger"
                                @click="removeLabel({ labelValue: labelData.primaryValue })">&times;</b-button>
                        </div>
                    </fragment>
                </div>
                <b-button @click="resetLabels()">RESET</b-button>
                <b-button @click="printLabels({
                labelDataList: labelPrintState.labelDataList,
                templateId: 'AVERY_8160',
                download: false
            })">PRINT</b-button>
            </template>
            {{ labelPrintState }}
        </div>
    </fragment>
</template>

<script lang="ts">
import MetrcTag from '@/components/overlay-widget/shared/MetrcTag.vue';
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { LabelPrintActions } from "@/store/page-overlay/modules/label-print/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "PrintTags",
    store,
    router,
    props: {},
    components: {
        // PlantPicker,
        // PlantBatchPicker,
        // PackagePicker,
        // TagPicker
        MetrcTag
    },
    computed: {
        ...mapState<IPluginState>({
            authState: (state: IPluginState) => state.pluginAuth.authState,
            labelPrintState: (state: IPluginState) => state.labelPrint
        }),
        ...mapGetters({
            exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
        }),
    },
    data() {
        return {
            selected: 1,
            options: Array.from(Array(25), (x, i) => i + 1)
        };
    },
    methods: {
        ...mapActions({
            resetLabels: `labelPrint/${LabelPrintActions.RESET_LABELS}`,
            removeLabel: `labelPrint/${LabelPrintActions.REMOVE_LABEL}`,
            printLabels: `labelPrint/${LabelPrintActions.PRINT_LABELS}`
        }),
        updateCount(count: number) {
            store.dispatch(`labelPrint/${LabelPrintActions.UPDATE_LABELS}`, {
                labelDataList: store.state.labelPrint.labelDataList.map((x) => ({
                    ...x,
                    ...{
                        count
                    }
                }))
            });
        }
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
