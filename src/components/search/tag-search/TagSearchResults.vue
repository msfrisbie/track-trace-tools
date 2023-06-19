<template>
  <div
    class="hide-scrollbar grid grid-cols-6 grid-rows-2"
    style="height: 100%; grid-template-rows: auto 1fr"
  >
    <template v-if="searchState.queryString.length > 0">
      <div class="col-span-6 flex flex-row items-center space-x-2 p-4 border-purple-300 border-b">
        <!-- <template v-if="filtersApplied">
          <b-button-group v-if="tagSearchFilters.locationName">
            <b-button variant="outline-dark" disabled
              >Location matches "{{ tagSearchFilters.locationName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="partialUpdateTagSearchFilters({ tagSearchFilters: { locationName: '' } })"
              >&#10006;</b-button
            >
          </b-button-group>

          <b-button-group v-if="tagSearchFilters.strainName">
            <b-button variant="outline-dark" disabled
              >Strain matches "{{ tagSearchFilters.strainName }}"</b-button
            >
            <b-button
              size="sm"
              variant="outline-dark"
              @click="partialUpdateTagSearchFilters({ tagSearchFilters: { strainName: '' } })"
              >&#10006;</b-button
            >
          </b-button-group>
        </template> -->

        <!-- <template v-if="!filtersApplied"> -->
        <p class="text-lg text-gray-600">
          <span class="font-bold text-gray-900">{{ queryString }}</span>
          matches {{ filteredTags.length }}{{ filteredTags.length === 500 ? "+" : "" }} tags
        </p>
        <!-- </template> -->

        <div class="flex-grow"></div>

        <template v-if="inflight">
          <b-spinner class="ttt-purple mr-2" />
        </template>
      </div>
    </template>

    <template v-if="searchState.queryString.length > 0">
      <div class="flex flex-col overflow-y-auto bg-purple-50 col-span-3">
        <tag-result-groups :tags="filteredTags" />

        <div class="flex-grow bg-purple-50"></div>
      </div>

      <div class="flex flex-col overflow-y-auto col-span-3">
        <tag-search-result-detail />
      </div>
    </template>

    <template v-else>
      <div class="col-span-6">
        <!-- Top row is sized "auto", so this placeholer is needed -->
      </div>

      <div class="flex flex-col overflow-y-auto col-span-6">
        <tag-history-list />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
// import TagManifestCartBuilder from "@/components/search/tag-search/TagManifestCartBuilder.vue";
import TagHistoryList from "@/components/search/tag-search/TagHistoryList.vue";
import TagResultGroups from "@/components/search/tag-search/TagResultGroups.vue";
import TagSearchResultDetail from "@/components/search/tag-search/TagSearchResultDetail.vue";
import { IIndexedTagData, IPluginState, ITagData } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "TagSearchResults",
  store,
  components: {
    TagSearchResultDetail,
    TagResultGroups,
    // TagManifestCartBuilder,
    TagHistoryList,
  },
  data() {
    return {};
  },
  props: {
    tags: Array as () => IIndexedTagData[],
    inflight: Boolean,
  },
  watch: {
    tags: {
      immediate: true,
      handler(newValue, oldValue) {
        // if (
        //   !this.$data.detailTagData ||
        //   !newValue.find((x: any) => x.Id === this.$data.detailTagData?.Id)
        // ) {
        //   searchManager.selectedTag.next(newValue[0]);
        // }
      },
    },
  },
  methods: {
    ...mapActions({
      partialUpdateTagSearchFilters: `tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`,
      setTagSearchFilters: `tagSearch/${TagSearchActions.SET_TAG_SEARCH_FILTERS}`,
    }),
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      searchState: (state: IPluginState) => state.search,
      tagSearchFilters: (state: IPluginState) => state.tagSearch.tagSearchFilters,
    }),
    ...mapGetters({}),
    filteredTags(): IIndexedTagData[] {
      return this.tags.filter((x: IIndexedTagData) => {
        // if (!!this.tagSearchFilters.strainName) {
        //   if (!!x.StrainName && !x.StrainName.includes(this.tagSearchFilters.strainName)) {
        //     return false;
        //   }
        // }
        // if (!!this.tagSearchFilters.locationName) {
        //   if (!!x.LocationName && !x.LocationName.includes(this.tagSearchFilters.locationName)) {
        //     return false;
        //   }
        // }

        return true;
      });
    },
    filtersApplied(): boolean {
      return (
        Object.values(this.$store.state.tagSearch.tagSearchFilters || {}).filter((x) => !!x)
          .length > 0
      );
    },
  },
});
</script>

<style scoped type="text/scss" lang="scss"></style>
