<template>
    <div class="search-filter-hover-reveal-target select-none">
        <div class="flex flex-row items-start px-4 pb-2">
            <div class="grid grid-cols-7 flex-none">
                <div class="flex flex-col w-36" v-for="group of searchState.searchResultMetrcGridGroups"
                    v-bind:key="group.name">
                    <div @click.stop.prevent="toggleGroup(group)">
                        <b-form-checkbox class="pt-1" size="sm" name="check-button" switch
                            :checked="!!group.children.find((x) => x.enabled)">
                            {{ group.name }}
                        </b-form-checkbox>
                    </div>
                </div>
            </div>

            <b-button-group>
                <b-button variant="outline-primary" class="text-xs" size="sm" @click="toggleAll()">TOGGLE ALL</b-button>
                <b-button variant="outline-primary" class="text-xs" size="sm" @click="setDefault()">RESET</b-button>
                <b-form-select variant="outline-primary" class="text-xs"
                    style="border-top-left-radius: 0; border-bottom-left-radius: 0;" size="sm"
                    @change="updatePageSize($event)" :value="searchState.searchResultPageSize">
                    <b-form-select-option :value="null" disabled>Search Engine Results</b-form-select-option>
                    <b-form-select-option :value="10">FASTEST (some results filtered)</b-form-select-option>
                    <b-form-select-option :value="100">BALANCED (medium speed &amp; accuracy)</b-form-select-option>
                    <b-form-select-option :value="500">MOST ACCURATE (slower results)</b-form-select-option>
                </b-form-select>
            </b-button-group>
        </div>

        <div class="relative search-filter-hover-reveal z-10">
            <div
                class="flex flex-row items-start absolute w-full bg-white px-4 py-2 border-b border-l border-r border-gray-50 shadow-xl">
                <div class="grid grid-cols-7 flex-none">
                    <div class="flex flex-col w-36" v-for="group of searchState.searchResultMetrcGridGroups"
                        v-bind:key="group.name">
                        <div @click.stop.prevent="toggleSingle(group, child)" v-for="child of group.children"
                            v-bind:key="child.name">
                            <b-form-checkbox size="sm" name="check-button" switch :checked="child.enabled">
                                {{ child.name }}
                            </b-form-checkbox>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { ALL_METRC_GROUPS, SearchActions } from "@/store/page-overlay/modules/search/consts";
import { MetrcGridChild, MetrcGroup } from "@/store/page-overlay/modules/search/interfaces";
import _ from "lodash-es";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
    name: "SearchControlPanel",
    store,
    router,
    props: {},
    components: {},
    computed: {
        ...mapState<IPluginState>({
            authState: (state: IPluginState) => state.pluginAuth.authState,
            searchState: (state: IPluginState) => state.search
        }),
        ...mapGetters({
            exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
            hasT3plus: `client/${ClientGetters.T3PLUS}`,
        }),
    },
    data() {
        return {};
    },
    methods: {
        ...mapActions({
            exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
        }),
        toggleSingle(group: MetrcGroup, child: MetrcGridChild) {
            const copy: MetrcGroup[] = _.cloneDeep(store.state.search.searchResultMetrcGridGroups);

            const current = copy.find((x) => x.name === group.name)!.children.find((x) => x.uniqueMetrcGridId === child.uniqueMetrcGridId)!;

            current.enabled = !current.enabled;

            store.dispatch(`search/${SearchActions.UPDATE_SEARCH_GROUPS}`, {
                searchResultMetrcGridGroups: copy
            });
        },
        toggleGroup(group: MetrcGroup) {
            const copy: MetrcGroup[] = _.cloneDeep(store.state.search.searchResultMetrcGridGroups);

            // Find the current group
            const currentGroup = copy.find((x) => x.name === group.name);

            if (!currentGroup) return; // If the group is not found, exit the function

            // Determine if any child is currently enabled
            const anyChildEnabled = currentGroup.children.some((child) => child.enabled);

            // Toggle all children based on the state of anyChildEnabled
            currentGroup.children.map((child) => {
                child.enabled = !anyChildEnabled;
            });

            // Commit the updated groups back to the store
            store.dispatch(`search/${SearchActions.UPDATE_SEARCH_GROUPS}`, {
                searchResultMetrcGridGroups: copy
            });
        },
        toggleAll() {
            const copy: MetrcGroup[] = _.cloneDeep(store.state.search.searchResultMetrcGridGroups);

            // Determine if any group has any enabled child
            const anyChildEnabled = copy.some((group) => group.children.some((child) => child.enabled));

            // Toggle all children of all groups
            copy.map((group) => {
                group.children.map((child) => {
                    child.enabled = !anyChildEnabled;
                });
            });

            // Commit the updated groups back to the store
            store.dispatch(`search/${SearchActions.UPDATE_SEARCH_GROUPS}`, {
                searchResultMetrcGridGroups: copy
            });
        },
        setDefault() {
            // Commit the updated groups back to the store
            store.dispatch(`search/${SearchActions.UPDATE_SEARCH_GROUPS}`, {
                searchResultMetrcGridGroups: ALL_METRC_GROUPS
            });
        },
        updatePageSize(searchResultPageSize: number) {
            store.dispatch(`search/${SearchActions.UPDATE_SEARCH_RESULT_PAGE_SIZE}`, {
                searchResultPageSize
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

<style type="text/scss" lang="scss" scoped>
.search-filter-hover-reveal-target .search-filter-hover-reveal {
    display: none;
}

.search-filter-hover-reveal-target:hover .search-filter-hover-reveal,
.search-filter-hover-reveal:hover {
    display: block;
}
</style>
