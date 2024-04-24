<template>
    <div>{{ searchState.activeSearchResult }}</div>
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
    name: "SearchResultDetail",
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
    async created() {},
    async mounted() {},
    watch: {
      foobar: {
        immediate: true,
        handler(newValue, oldValue) {},
      },
    },
  });
  </script>
  
  <style type="text/scss" lang="scss" scoped></style>
  