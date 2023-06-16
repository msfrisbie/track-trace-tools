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

    <template v-if="!filtersApplied || expandLocationNameGroup">
      <tag-search-results-group
        :tags="locationNameTags"
        sectionName="location"
        tagFilterIdentifier="locationName"
        :sectionPriority="1"
        :expanded="expandLocationNameGroup"
        :previewLength="3"
      />
    </template>

    <template v-if="!filtersApplied || expandStrainNameGroup">
      <tag-search-results-group
        :tags="strainNameTags"
        sectionName="strain"
        tagFilterIdentifier="strainName"
        :sectionPriority="2"
        :expanded="expandStrainNameGroup"
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
import Vue from "vue";
import { MutationType } from "@/mutation-types";
import { IIndexedTagData } from "@/interfaces";
import { MessageType, TagFilterIdentifiers, TagState } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { copyToClipboard } from "@/utils/dom";
import { mapActions, mapState } from "vuex";
import TagSearchResultsGroup from "@/components/search/tag-search/TagSearchResultsGroup.vue";
import TagSearchFiltersVue from "./TagSearchFilters.vue";
import { searchManager } from "@/modules/search-manager.module";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import { timer } from "rxjs";

export default Vue.extend({
  name: "TagResultGroups",
  props: {
    tags: Array as () => IIndexedTagData[],
  },
  components: { TagSearchResultsGroup },
  data(): {} {
    return {};
  },
  computed: {
    ...mapState({
      tagQueryString: (state: any) => state.tagSearch?.tagQueryString,
      tagSearchFilters: (state: any) => state.tagSearch?.tagSearchFilters,
    }),
    filtersApplied() {
      return false;
    },
    expandLabelGroup() {
      return !!this.tagSearchFilters.label;
    },
    expandStrainNameGroup() {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!this.tagSearchFilters.strainName;
    },
    expandLocationNameGroup() {
      if (this.expandLabelGroup) {
        return false;
      }

      return !!this.tagSearchFilters.locationName;
    },
    allTagsPreviewLength() {
      // @ts-ignore
      if (this.labelTags.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.strainNameTags.length > 0) {
        return 0;
      }
      // @ts-ignore
      if (this.locationNameTags.length > 0) {
        return 0;
      }

      return 3;
    },
    labelTags(): IIndexedTagData[] {
      const tags = this.tags.filter((tagData) =>
        tagData.Label.includes(this.tagQueryString)
      );

      return tags;
    },
    strainNameTags(): IIndexedTagData[] {
      const tags = this.tags.filter((tagData) =>
        tagData.StrainName?.toUpperCase().includes(this.tagQueryString.toUpperCase())
      );

      return tags;
    },
    locationNameTags(): IIndexedTagData[] {
      const tags = this.tags.filter((tagData) =>
        tagData.LocationName?.toUpperCase().includes(this.tagQueryString.toUpperCase())
      );

      return tags;
    },
  },
  methods: {
    ...mapActions({
      setShowTagSearchResults: `tagSearch/${TagSearchActions.SET_SHOW_TAG_SEARCH_RESULTS}`,
    }),
    resetFilters() {
      pageManager.resetMetrcTagFilters();
    },
    // async setTagLabelFilter(tag: IIndexedTagData) {
    //   analyticsManager.track(MessageType.SELECTED_TAG);

    //   this.$store.dispatch(
    //     `tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`,
    //     {
    //       tagState: tag.TagState,
    //       tagSearchFilters: {
    //         label: tag.Label
    //       }
    //     }
    //   );

    //   (this as any).setShowTagSearchResults({ showTagSearchResults: false });
    // }
  },
});
</script>
