<template>
    <div class="search-filter-hover-reveal-target flex flex-row items-start flex-wrap">
        <div class="flex flex-col w-36" v-for="group of searchState.searchResultMetrcGridGroups"
            v-bind:key="group.name">
            <div @click.stop.prevent="toggleGroup(group)">
                <b-form-checkbox class="pt-1" size="sm" name="check-button" switch
                    :checked="!!group.children.find((x) => x.enabled)">
                    {{ group.name }}
                </b-form-checkbox>
            </div>
            <div class="relative">
                <!-- Wrapper div with a white background containing the absolute content -->
                <div class="absolute bg-white w-full flex flex-col items-stretch p-2 shadow-lg z-10">
                    <hr />
                    <div @click.stop.prevent="toggleSingle(group, child)" v-for="child of group.children"
                        v-bind:key="child.name">
                        <b-form-checkbox size="sm" name="check-button" switch :checked="child.enabled">
                            {{ child.name }}
                        </b-form-checkbox>
                    </div>
                </div>
            </div>
        </div>

        <b-button class="text-xs" size="sm" @click="toggleAll()">TOGGLE ALL</b-button>
        <b-button class="text-xs" size="sm" @click="setDefault()">RESET</b-button>
    </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { ALL_METRC_GROUPS, SearchMutations } from "@/store/page-overlay/modules/search/consts";
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

            const current = copy.find((x) => x.name === group.name)!.children.find((x) => x.metrcGridId === child.metrcGridId)!;

            current.enabled = !current.enabled;

            store.commit(`search/${SearchMutations.SEARCH_MUTATION}`, {
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
            store.commit(`search/${SearchMutations.SEARCH_MUTATION}`, {
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
            store.commit(`search/${SearchMutations.SEARCH_MUTATION}`, {
                searchResultMetrcGridGroups: copy
            });
        },
        setDefault() {
            // Commit the updated groups back to the store
            store.commit(`search/${SearchMutations.SEARCH_MUTATION}`, {
                searchResultMetrcGridGroups: ALL_METRC_GROUPS
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
    display: block;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s ease, visibility 0s 3s;
}

.search-filter-hover-reveal-target:hover .search-filter-hover-reveal,
.search-filter-hover-reveal:hover {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.5s ease, visibility 0s 0s;
}
</style>
