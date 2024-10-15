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
            <label for="fileInput" class="btn btn-outline-primary mb-0 flex flex-row gap-2 items-center">
                <font-awesome-icon icon="fa-image" size="lg"></font-awesome-icon>
                {{ preloadedFiles.length === 0 ? 'PRELOAD IMAGES' : preloadedFiles.length + ' FILES PRELOADED' }}
            </label>
            <input class="hidden" type="file" id="fileInput" webkitdirectory multiple @change="handleChange($event)" />
            <label class="btn btn-outline-success mb-0 flex flex-row gap-2 items-center">
                <font-awesome-icon icon="fa-file-csv" size="lg"></font-awesome-icon>
                <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>
                AUTOFILL T3 CSV
            </label>
        </b-button-group>

        <b-button class="ttt-purple flex flex-row gap-2 items-center" variant="link"
            href="https://www.youtube.com/watch?v=PyM30jB-G8I" target="_blank">
            <font-awesome-icon icon="fa-external-link-alt" size="lg"></font-awesome-icon>
            <span>WATCH DEMO</span></b-button>
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
            // name, file object
            preloadedFiles: []
        };
    },
    methods: {
        ...mapActions({
            exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
            downloadTemplate: `csvFillTool/${CsvFillToolActions.DOWNLOAD_TEMPLATE}`,
            dumpForm: `csvFillTool/${CsvFillToolActions.DUMP_FORM}`
        }),
        async handleChange(event: any) {
            this.$data.preloadedFiles = [];

            const files = event.target.files;

            const promises: Promise<any>[] = [];

            // Loop through files and check if they are images
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                    this.$data.preloadedFiles.push(file);
                }
            }

            await Promise.allSettled(promises);
        }
    },
    async created() { },
    async mounted() {
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
                    preloadedFiles: this.$data.preloadedFiles
                });
            },
        },
    },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
