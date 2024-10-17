<template>
    <div class="flex flex-row items-center">
        <span v-bind:key="idx" v-for="[idx, stringPiece] of stringPieces.entries()"
            v-bind:class="{ 'font-extrabold underline': stringPiece.emphasized, 'font-light': !stringPiece.emphasized }">
            {{ stringPiece.text }}
        </span>
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
    name: "PartialStringEmphasis",
    store,
    router,
    props: {
        fullString: String,
        partialString: String
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
        stringPieces(): { text: string, emphasized: boolean }[] {
            const deemphasizedPieces: string[] = this.$props.fullString.split(this.$props.partialString);

            const allPieces: { text: string, emphasized: boolean }[] = [];

            for (const [index, deemphasizedPiece] of Object.entries(deemphasizedPieces)) {
                const isLastPiece = Number(index) === deemphasizedPieces.length - 1;

                // Add the deemphasized piece (not emphasized)
                allPieces.push({
                    text: deemphasizedPiece,
                    emphasized: false
                });

                // If it's not the last piece, add the emphasized partial string
                if (!isLastPiece) {
                    allPieces.push({
                        text: this.$props.partialString,
                        emphasized: true
                    });
                }
            }

            return allPieces;
        }
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
