<template>
    <div>
        <label class="btn btn-primary mb-0">
            <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>
            UPLOAD CSV
        </label>
    </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { CsvFillToolActions } from "@/store/page-overlay/modules/csv-fill-tool/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import _ from "lodash-es";
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
        }),
    },
    async created() { },
    async mounted() {
        const modal = activeMetrcModalOrNull();

        if (!modal) {
            return;
        }

        const debouncedHandler = _.debounce(() => store.dispatch(`csvFillTool/${CsvFillToolActions.ANALYZE}`, { modal }), 100);
        const observer = new MutationObserver(() => debouncedHandler());
        observer.observe(modal, { subtree: true, childList: true });
    },
    watch: {
        csvFile: {
            immediate: true,
            handler(newValue, oldValue) {
                if (!newValue) {
                    return;
                }

                store.dispatch(`csvFillTool/${CsvFillToolActions.CSV_FILL_TOOL_ACTION}`, {
                    file: newValue,
                });
            },
        },
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
