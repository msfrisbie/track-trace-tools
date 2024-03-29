<template>
  <div>
    <template v-if="!filtersApplied || expandLabelGroup">
      <tag-search-results-group
        :tags="labelTags"
        sectionName="tag"
        tagFilterIdentifier="label"
        :sectionPriority="0"
        :expanded="expandLabelGroup"
        :previewLength="3"
      />
    </template>

    <!-- All results -->
    <template v-if="!filtersApplied">
      <tag-search-results-group
        :tags="tags"
        sectionName=""
        :tagFilterIdentifier="null"
        :sectionPriority="3"
        :expanded="false"
        :previewLength="allTagsPreviewLength"
      />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MutationType } from '@/mutation-types';
import { IIndexedTagData, IPluginState } from '@/interfaces';
import { MessageType, TagFilterIdentifiers, TagState } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { pageManager } from '@/modules/page-manager/page-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import { copyToClipboard } from '@/utils/dom';
import { mapActions, mapState } from 'vuex';
import TagSearchResultsGroup from '@/components/search/tag-search/TagSearchResultsGroup.vue';
import { searchManager } from '@/modules/search-manager.module';
import { TagSearchActions } from '@/store/page-overlay/modules/tag-search/consts';
import { timer } from 'rxjs';
import { SearchActions } from '@/store/page-overlay/modules/search/consts';
import store from '@/store/page-overlay/index';
import TagSearchFiltersVue from './TagSearchFilters.vue';

export default Vue.extend({
  name: 'TagResultGroups',
  props: {
    tags: Array as () => IIndexedTagData[],
  },
  components: { TagSearchResultsGroup },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState<IPluginState>({
      tagSearchFilters: (state: IPluginState) => state.tagSearch.tagSearchFilters,
    }),
    filtersApplied(): boolean {
      return false;
    },
    expandLabelGroup(): boolean {
      return !!store.state.tagSearch.tagSearchFilters.label;
    },
    allTagsPreviewLength(): number {
      if (this.labelTags.length > 0) {
        return 0;
      }

      return 3;
    },
    labelTags(): IIndexedTagData[] {
      const tags = this.tags.filter((tagData) =>
        tagData.Label.includes(store.state.search.queryString));

      return tags;
    },
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    resetFilters() {
      pageManager.resetMetrcTagFilters();
    },
  },
});
</script>
