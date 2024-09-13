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

        <b-button class="ttt-purple flex flex-row gap-2 items-center" variant="link"
            href="https://www.youtube.com/watch?v=PyM30jB-G8I" target="_blank">
            <font-awesome-icon icon="fa-external-link-alt" size="lg"></font-awesome-icon>
            <span>WATCH DEMO</span></b-button>

        <h1>Select a Folder to Read Files</h1>
        <button id="folderPicker">Select Folder</button>

        <h2>Files:</h2>
        <ul id="fileList"></ul>
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
        const folderPicker = document.getElementById('folderPicker')!;
        const fileList = document.getElementById('fileList')!;

        folderPicker.addEventListener('click', async () => {
            // Request access to the user's folder
            // @ts-ignore
            const directoryHandle = await window.showDirectoryPicker();
            fileList.innerHTML = ''; // Clear previous file list
            // fileContent.textContent = ''; // Clear previous file content

            // Recursively read the directory and display files
            async function readDirectory(handle: any) {
                for await (const entry of handle.values()) {
                    console.log({ entry });
                    if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        console.log({ file });

                        // Display file information and provide a way to view content
                        const li = document.createElement('li');
                        li.innerHTML = `${entry.name} (${file.size} bytes) <button data-file="${entry.name}">View Content</button>`;
                        fileList.appendChild(li);

                        // Attach event to display file content when the button is clicked
                        // const viewButton = li.querySelector('button');
                        // viewButton.addEventListener('click', async () => {
                        //     // Read and display the file content
                        const fileContentText = await file.text();
                        console.log(`File: ${entry.name}\n\n${fileContentText}`);
                        // });
                    } else if (entry.kind === 'directory') {
                        await readDirectory(entry);
                    }
                }
            }

            // Start reading the directory
            await readDirectory(directoryHandle);
        });
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
