<template>
  <div class="grid grid-cols-2 gap-2 p-1 cursor-pointer border-b border-gray-200 bg-gray-100" v-bind:class="{
    [`hover:bg-${searchResult.isActive ? searchResult.colorClassName : 'gray'}-300`]: true,
    'bg-white': searchState.activeSearchResult === searchResult
  }" @click="selectSearchResult({ searchResult })" style="grid-template-columns: 10rem 1fr;">
    <div class="flex flex-col justify-center gap-1 items-center text-center text-sm my-2 mx-2">
      <complex-icon :class="`text-${searchResult.isActive ? searchResult.colorClassName + '-700' : 'gray-300'}`"
        :primaryIconName="searchResult.primaryIconName" primaryIconSize="xl"
        :secondaryIconName="searchResult.secondaryIconName" secondaryIconSize="sm"></complex-icon>

      <div class="font-bold text-base">
        {{ searchResult.primaryStatusTextualDescriptor }} {{ searchResult.primaryTextualDescriptor }}
      </div>
    </div>

    <div class="flex flex-col gap-6 p-4">
      <div class="w-full gap-2 text-wrap break-words border-b border-gray-200"
        v-for="[idx, matchedField] of searchResult.matchedFields.entries()" v-bind:key="idx">
        <fragment>
          <div class="font-bold text-sm pb-2 text-gray-400">{{ matchedField.field }}</div>
          <div class="font-mono">
            <partial-string-emphasis :fullString="matchedField.value"
              :partialString="searchState.queryString"></partial-string-emphasis>
          </div>
        </fragment>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ComplexIcon from "@/components/overlay-widget/shared/ComplexIcon.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { ISearchResult } from "@/store/page-overlay/modules/search/interfaces";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import PartialStringEmphasis from "../shared/PartialStringEmphasis.vue";

export default Vue.extend({
  name: "SearchResultPreview",
  store,
  router,
  props: {
    searchResult: Object as () => ISearchResult,
  },
  components: {
    ComplexIcon,
    PartialStringEmphasis
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      searchState: (state: IPluginState) => state.search,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    })
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      selectSearchResult: `search/${SearchActions.SELECT_SEARCH_RESULT}`,
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
