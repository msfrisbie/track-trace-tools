<template>
    <div class="m-2 flex flex-row gap-2">
        <b-button-group>
            <button class="btn btn-outline-primary mb-0 flex flex-row gap-2 items-center" @click="downloadTemplate()">
                <font-awesome-icon icon="fa-download" size="lg"></font-awesome-icon>
                <span>DOWNLOAD EMPTY TEMPLATE</span>
            </button>
            <button class="btn btn-outline-primary mb-0 flex flex-row gap-2 items-center" @click="dumpForm()">
                <font-awesome-icon icon="fa-file-export" size="lg"></font-awesome-icon>
                EXPORT FORM DATA
            </button>
            <label class="btn btn-outline-success mb-0 flex flex-row gap-2 items-center">
                <font-awesome-icon icon="fa-file-csv" size="lg"></font-awesome-icon>
                <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>
                AUTOFILL T3 CSV
            </label>
        </b-button-group>
    </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { CsvFillToolActions } from "@/store/page-overlay/modules/csv-fill-tool/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "CsvFillTool",
    store,
    router,
    props: {},
    components: {},
    computed: {
        ...mapState<IPluginState>({
            authState: (state: IPluginState) => state.pluginAuth.authState,
        }),
        ...mapGetters({
            exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
        }),
    },
    data() {
        return {
            csvFile: null,
        };
    },
    methods: {
        ...mapActions({
            exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
            downloadTemplate: `csvFillTool/${CsvFillToolActions.DOWNLOAD_TEMPLATE}`,
            dumpForm: `csvFillTool/${CsvFillToolActions.DUMP_FORM}`
        }),
    },
    async created() { },
    async mounted() {
        // const modal = activeMetrcModalOrNull();

        // if (!modal) {
        //     return;
        // }

        // const debouncedHandler = _.debounce(() => store.dispatch(`csvFillTool/${CsvFillToolActions.ANALYZE}`, { modal }), 100);
        // const observer = new MutationObserver(() => debouncedHandler());
        // observer.observe(modal, { subtree: true, childList: true });
    },
    watch: {
        csvFile: {
            immediate: true,
            handler(newValue, oldValue) {
                if (!newValue) {
                    return;
                }

                store.dispatch(`csvFillTool/${CsvFillToolActions.FILL_CSV_INTO_MODAL_FORM}`, {
                    file: newValue,
                });
            },
        },
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
