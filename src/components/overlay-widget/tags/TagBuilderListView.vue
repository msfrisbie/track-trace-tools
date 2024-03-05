<template>
    <builder-list :options="options"></builder-list>
</template>

<script lang="ts">
import BuilderList from "@/components/overlay-widget/shared/BuilderList.vue";
import { IBuilderListOption, IPluginState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
    name: "PackageBuilderListView",
    store,
    components: {
        BuilderList,
    },
    methods: {},
    data() {
        return {
        };
    },
    async mounted() {
    },
    async created() { },
    computed: {
        ...mapState<IPluginState>({
            authState: (state: IPluginState) => state.pluginAuth.authState,
            debugMode: (state: IPluginState) => state.debugMode,
            clientState: (state: IPluginState) => state.client,
        }),
        options(): IBuilderListOption[] {
            return [
                {
                    route: "/tags/print-tags",
                    text: "PRINT TAGS",
                    icon: "print",
                    backgroundColor: "#2774ae",
                    isBeta: false,
                    isNew: true,
                    enabled: true,
                    visible: true,
                    isPlus: false,
                    showDisabledMessage: false,
                },
                {
                    backgroundColor: "#2774ae",
                    text: "VOID TAGS",
                    route: "/tags/void-tags",
                    icon: "tags",
                    visible: true,
                    enabled: true,
                    isBeta: false,
                    isNew: false,
                    isPlus: false,
                    showDisabledMessage: false
                },
            ];
        },
    },
});
</script>

<style type="text/scss" lang="scss"></style>
