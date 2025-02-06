<template>
    <div class="flex flex-col items-center justify-center relative m-2">
        <font-awesome-icon :icon="primaryIconName" :size="primaryIconSize"></font-awesome-icon>
        <div v-if="secondaryIconName"
            class="absolute p-1 rounded-full bg-white flex flex-col items-center justify-center"
            v-bind:class="secondaryIconClass" style="left: 50%; top: 50%;">
            <font-awesome-icon :icon="secondaryIconName" :size="secondaryIconSize"></font-awesome-icon>
        </div>
    </div>
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
    name: "ComplexIcon",
    store,
    router,
    props: {
        primaryIconName: String,
        primaryIconSize: String,
        secondaryIconName: {
            // type: String,
            default: null
        },
        secondaryIconSize: {
            type: String,
            default: null
        },
        secondaryIconClass: {
            type: String,
            default: null
        }
    },
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
        return {};
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
