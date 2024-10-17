<template>
  <div class="flex flex-row gap-2 p-1 cursor-pointer border-b border-purple-200" v-bind:class="{
    'bg-white': searchState.activeSearchResult === searchResult,
    [classNames(searchResult).bgColorClass]: true
  }" @click="selectSearchResult({ searchResult })">
    <div class="flex flex-col justify-center gap-1 items-center text-center w-20 text-sm my-2">
      <complex-icon v-bind:class="{
        [classNames(searchResult).textColorClass]: true
      }" :primaryIconName="searchResult.primaryIconName" primaryIconSize="xl"
        :secondaryIconName="searchResult.secondaryIconName" secondaryIconSize="sm"></complex-icon>

      <div class="font-bold text-base">
        {{ searchResult.primaryTextualDescriptor }}
      </div>
    </div>

    <div class="flex flex-row items-center p-2">
      <table class="table-auto w-full text-start">
        <tr class="border-b" v-for="[idx, matchedField] of searchResult.matchedFields.entries()" v-bind:key="idx">
          <td class="text-right p-2 align-top">{{ matchedField.field }}:</td>
          <td class="p-2 font-mono align-top">
            <partial-string-emphasis class="text-wrap flex-wrap" :fullString="matchedField.value"
              style="max-width:300px" :partialString="searchState.queryString"></partial-string-emphasis>
          </td>
        </tr>
      </table>
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
    classNames(searchResult: ISearchResult): { bgColorClass: string, textColorClass: string } {
      if (searchResult.plant || searchResult.plantBatch) {
        return {
          bgColorClass: 'bg-purple-100 hover:bg-green-300',
          textColorClass: 'text-green-700'
        };
      }

      if (searchResult.tag) {
        return {
          bgColorClass: 'bg-purple-100 hover:bg-blue-300',
          textColorClass: 'text-blue-700'
        };
      }

      if (searchResult.incomingTransfer || searchResult.outgoingTransfer) {
        return {
          bgColorClass: 'bg-purple-100 hover:bg-yellow-300',
          textColorClass: 'text-yellow-700'
        };
      }

      return {
        bgColorClass: 'bg-purple-100 hover:bg-purple-300',
        textColorClass: 'ttt-purple'
      };
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

<style type="text/scss" lang="scss" scoped></style>
