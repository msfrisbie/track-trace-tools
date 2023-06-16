<template>
  <div v-if="tags.length > 0" class="border-purple-300 border-b">
    <div class="p-4 flex flex-row items-center border-purple-300">
      <div class="flex flex-row items-center space-x-4">
        <font-awesome-icon :icon="groupIcon" class="text-3xl text-gray-400" />

        <div class="text-xl text-gray-500">
          <template v-if="sectionName">
            {{ tags.length }}{{ tags.length === 500 ? "+" : "" }}&nbsp;{{
              sectionName
            }}&nbsp;matches:
          </template>
          <template v-else> All matching tags: </template>
        </div>
      </div>

      <div class="flex-grow"></div>

      <b-button
        v-if="!expanded && !disableFilter"
        variant="outline-primary"
        size="sm"
        @click.stop.prevent="applyFilter"
        v-show="isOnTagsPage"
      >
        FILTER
        <!-- <font-awesome-icon icon="chevron-right"/> -->
      </b-button>
    </div>

    <tag-search-result-preview
      v-for="(tag, index) in visibleTags"
      :key="tag.Id"
      :tag="tag"
      :sectionName="sectionName"
      :selected="
        !!selectedTagMetadata &&
        tag.Id === selectedTagMetadata.tagData.Id &&
        sectionName === selectedTagMetadata.sectionName
      "
      :idx="index"
      v-on:selected-tag="showTagDetail($event)"
    />

    <div
      v-if="!showAll && !expanded && tags.length > previewLength"
      class="cursor-pointer flex flex-row justify-center items-center hover:bg-purple-100"
      @click.stop.prevent="showAll = true"
    >
      <span class="text-gray-500 p-2">{{ tags.length - previewLength }}&nbsp;MORE</span>
    </div>
  </div>
</template>

<script lang="ts">
import TagSearchResultPreview from "@/components/search/tag-search/TagSearchResultPreview.vue";
import { IIndexedTagData, IPluginState } from "@/interfaces";
import { TAG_TAB_REGEX } from "@/modules/page-manager/consts";
import { ISelectedTagMetadata, searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "TagSearchResultsGroup",
  store,
  components: { TagSearchResultPreview },
  data(): {
    destroyed$: Subject<void>;
    selectedTagMetadata: ISelectedTagMetadata | null;
    showAll: boolean;
  } {
    return {
      destroyed$: new Subject(),
      selectedTagMetadata: null,
      showAll: false,
    };
  },
  props: {
    sectionName: String,
    tags: Array as () => IIndexedTagData[],
    tagFilterIdentifier: String,
    sectionPriority: Number,
    expanded: Boolean,
    previewLength: Number,
  },
  watch: {
    tags: {
      immediate: true,
      handler(newValue, oldValue) {
        searchManager.selectedTag
          .asObservable()
          .pipe(take(1))
          .subscribe((tagMetadata) => {
            if (
              newValue.length > 0 &&
              !newValue.find((x: any) => x.Id === tagMetadata?.tagData.Id)
            ) {
              searchManager.maybeInitializeSelectedTag(
                newValue[0],
                this.sectionName,
                this.sectionPriority
              );
            }
          });
      },
    },
  },
  computed: {
    ...mapState<IPluginState>({
      queryString: (state: IPluginState) => state.search.queryString,
    }),
    isOnTagsPage(): boolean {
      return !!window.location.pathname.match(TAG_TAB_REGEX);
    },
    visibleTags(): IIndexedTagData[] {
      return this.expanded || this.$data.showAll
        ? this.tags
        : this.tags.slice(0, this.previewLength);
    },
    groupIcon(): string {
      switch (this.tagFilterIdentifier) {
        case "label":
          return "tags";
        case "strainName":
          return "cannabis";
        case "locationName":
          return "map-marker-alt";
        default:
          return "boxes";
      }
    },
    disableFilter(): boolean {
      return !this.tagFilterIdentifier || this.tagFilterIdentifier === "label";
    },
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
    }),
    showTagDetail(tagData: IIndexedTagData) {
      // TODO debounce this to improve mouseover accuracy
      searchManager.selectedTag.next({
        tagData,
        sectionName: this.sectionName,
        priority: this.sectionPriority,
      });
    },
    applyFilter() {
      if (this.disableFilter) {
        return;
      }

      this.$store.dispatch(`tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`, {
        tagSearchFilters: {
          [this.tagFilterIdentifier]: this.$store.state.search.queryString,
        },
      });

      this.setShowSearchResults({ showSearchResults: false });
    },
  },
  created() {
    searchManager.selectedTag
      .asObservable()
      .pipe(takeUntil(this.$data.destroyed$))
      .subscribe((selectedTagMetadata) => (this.$data.selectedTagMetadata = selectedTagMetadata));
  },
  beforeDestroy() {
    this.$data.destroyed$.next(null);
  },
});
</script>
