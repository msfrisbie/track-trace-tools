<template>
  <div
    class="flex flex-col items-center space-y-8 px-2 p-4"
  >
    <div class="w-full grid grid-cols-3" style="grid-template-columns: 1fr 8fr 1fr">
      <div></div>

      <div class="flex flex-col items-center space-y-8 flex-grow">
        <div class="flex flex-col space-y-2 items-center">
          <div class="flex flex-col items-center space-x-4 text-center">
            <metrc-tag
              :label="searchState.activeSearchResult.tag.Label"
              :sideText="searchState.activeSearchResult.tag.TagTypeName"
            ></metrc-tag>
          </div>

          <b-badge
            class="text-lg"
            :variant="badgeVariant(searchState.activeSearchResult.tag)"
            >{{ displayTagState(searchState.activeSearchResult.tag) }}</b-badge
          >
        </div>
      </div>

      <div
        v-show="isOnTagsPage"
        @click.stop.prevent="setTagLabelFilter(searchState.activeSearchResult.tag)"
        class="flex flex-row items-center justify-center cursor-pointer h-full"
      >
        <font-awesome-icon icon="chevron-right" class="text-2xl text-purple-500" />
      </div>
    </div>

    <recursive-json-table
      :jsonObject="searchState.activeSearchResult.tag"
    ></recursive-json-table>
  </div>
</template>

<script lang="ts">
import { MessageType, TagState } from '@/consts';
import { IIndexedTagData, IPluginState } from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { TAG_TAB_REGEX } from '@/modules/page-manager/consts';
import { searchManager } from '@/modules/search-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import store from '@/store/page-overlay/index';
import { TagSearchActions } from '@/store/page-overlay/modules/tag-search/consts';
import { copyToClipboard } from '@/utils/dom';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import MetrcTag from '@/components/overlay-widget/shared/MetrcTag.vue';
import RecursiveJsonTable from '@/components/search/shared/RecursiveJsonTable.vue';
import { SearchActions } from '@/store/page-overlay/modules/search/consts';

export default Vue.extend({
  name: 'TagSearchResultDetail',
  store,
  components: { MetrcTag, RecursiveJsonTable },
  data(): {
  } {
    return {
    };
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      flags: (state: IPluginState) => state.flags,
      searchState: (state: IPluginState) => state.search,
    }),
    isOnTagsPage() {
      return window.location.pathname.match(TAG_TAB_REGEX);
    },
    ...mapGetters({}),
  },
  watch: {},
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      partialUpdateTagSearchFilters: `tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`,
      setTagSearchFilters: `tagSearch/${TagSearchActions.SET_TAG_SEARCH_FILTERS}`,
    }),
    async setTagLabelFilter(tag: IIndexedTagData) {
      analyticsManager.track(MessageType.SELECTED_TAG);

      store.dispatch(`tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`, {
        tagState: tag.TagState,
        tagSearchFilters: {
          label: tag.Label,
        },
      });

      this.setShowSearchResults({ showSearchResults: false });
    },
    copyToClipboard(tag: IIndexedTagData) {
      analyticsManager.track(MessageType.COPIED_TEXT, { value: tag.Label });

      copyToClipboard(tag.Label);

      toastManager.openToast(`'${tag.Label}' copied to clipboard`, {
        title: 'Copied Tag',
        autoHideDelay: 5000,
        variant: 'primary',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    },
    badgeVariant(tag: IIndexedTagData) {
      // @ts-ignore
      switch (tag.TagState as TagState) {
        case TagState.AVAILABLE:
          return 'success';
        case TagState.USED:
          return 'dark';
        case TagState.VOIDED:
          return 'danger';
        default:
          return null;
      }
    },
    displayTagState(tag: IIndexedTagData) {
      return tag.TagState.replaceAll('_', ' ');
    },
  },
});
</script>
