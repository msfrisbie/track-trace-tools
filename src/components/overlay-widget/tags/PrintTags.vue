<template>
    <fragment>
        Foobar
        {{ labelPrintState }}
        <!-- <b-tabs pills card vertical class="h-full">
            <b-tab title="Unused Tags" active>
                <tag-picker :selectedTags.sync="selectedTags" :tagTypeNames="[
                    'CannabisPackage',
                    'MedicalPackage',
                    'Cannabis Package',
                    'Medical Package',
                    'CannabisPlant',
                    'MedicalPlant',
                    'Cannabis Plant',
                    'Medical Plant'
                ]" :tagCount="0"></tag-picker>
            </b-tab>

            <b-tab title="Plants">
                <plant-picker :selectedPlants.sync="selectedPlants"></plant-picker>
            </b-tab>

            <b-tab title="Plant Batches">
                <plant-batch-picker :selectedPlantBatches.sync="selectedPlantBatches"></plant-batch-picker>
            </b-tab>

            <b-tab title="Packages">
                <package-picker :selectedPackages.sync="selectedPackages" :eagerLoad="true"
                    :showLocationPicker="true"></package-picker>
            </b-tab>
        </b-tabs> -->
    </fragment>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
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
            // selectedPlants: [],
            // selectedPackages: [],
            // selectedPlantBatches: [],
            // selectedTags: [],
            // tagData: []
        };
    },
    methods: {
        ...mapActions({
            exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
        }),
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
