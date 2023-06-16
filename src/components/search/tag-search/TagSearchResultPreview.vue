<template>
  <div
    class="border-purple-300"
    v-bind:class="{
      'bg-white': selected,
    }"
    @mouseenter="selectTag(tag)"
    @click.stop.prevent="setTagLabelFilter(tag)"
  >
    <div class="flex flex-row items-center space-x-6 cursor-pointer p-4">
      <div
        class="flex flex-column-shim flex-col space-y-2"
        v-bind:class="{ 'font-bold': selected }"
      >
        <div class="text-xl text-purple-700 demo-blur">
          {{ tag.StrainName }}
        </div>
        <div class="text-gray-700 text-lg metrc-tag">{{ tag.Label }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IIndexedTagData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import Vue from "vue";
import { mapActions } from "vuex";

export default Vue.extend({
  name: "TagSearchResultPreview",
  props: {
    sectionName: String,
    tag: Object as () => IIndexedTagData,
    selected: Boolean,
    idx: Number,
  },
  methods: {
    ...mapActions({
      setShowTagSearchResults: `tagSearch/${TagSearchActions.SET_SHOW_TAG_SEARCH_RESULTS}`,
      partialUpdateTagSearchFilters: `tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`,
      setTagSearchFilters: `tagSearch/${TagSearchActions.SET_TAG_SEARCH_FILTERS}`,
    }),
    selectTag(tag: IIndexedTagData) {
      this.$emit("selected-tag", tag);
    },
    async setTagLabelFilter(tag: IIndexedTagData) {
      analyticsManager.track(MessageType.SELECTED_TAG);

      this.$store.dispatch(
        `tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`,
        {
          tagState: tag.TagState,
          tagSearchFilters: {
            label: tag.Label,
          },
        }
      );

      (this as any).setShowTagSearchResults({ showTagSearchResults: false });
    },
  },
});
</script>
