<template>
    <div class="flex flex-row items-center gap-2 text-xl h-10">
        <template v-if="formattedFilters.length > 0">
            <b-button size="sm" variant="danger" @click="clearGridFilters()">CLEAR FILTERS</b-button>
        </template>

        <b-button size="sm" disabled variant="primary" v-for="[k, v] of formattedFilters" v-bind:key="k">
            {{ k }}:&nbsp;{{ v }}
        </b-button>
    </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import { clearGridFilters, getActiveUniqueMetrcGridIdOrNull } from "@/modules/page-manager/search-utils";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "GridFilters",
    store,
    router,
    props: {},
    components: {},
    computed: {
        ...mapState<IPluginState>({
            authState: (state: IPluginState) => state.pluginAuth.authState,
            searchState: (state: IPluginState) => state.search,
        }),
        ...mapGetters({
            exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
        }),
        formattedFilters(): [string, any][] {
            if (!store.state.search.activeUniqueMetrcGridId) {
                return [];
            }

            if (!store.state.search.metrcGridFilters) {
                return [];
            }

            return Object.entries(
                store.state.search.metrcGridFilters[store.state.search.activeUniqueMetrcGridId] ?? {}
            );
        },
    },
    data() {
        return {};
    },
    methods: {
        ...mapActions({
            exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
        }),
        clearGridFilters() {
            const activeUniqueMetrcGridId = getActiveUniqueMetrcGridIdOrNull();

            if (!activeUniqueMetrcGridId) {
                return;
            }

            clearGridFilters(activeUniqueMetrcGridId);
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
