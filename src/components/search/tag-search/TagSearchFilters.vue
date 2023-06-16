<template>
  <div v-show="isOnTagsPage" v-if="hasFiltersApplied" class="flex flex-row gap-2">
    <b-button-group v-if="tagSearchFilters.label">
      <b-button size="sm" variant="light" disabled
        >Tag:
        <span class="metrc-tag">{{ tagSearchFilters.label }}</span>
      </b-button>
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdateTagSearchFilters({ tagSearchFilters: { label: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="tagSearchFilters.locationName">
      <b-button size="sm" variant="light" disabled
        >Location matches "{{ tagSearchFilters.locationName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdateTagSearchFilters({ tagSearchFilters: { locationName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group v-if="tagSearchFilters.strainName">
      <b-button size="sm" variant="light" disabled
        >Strain matches "{{ tagSearchFilters.strainName }}"</b-button
      >
      <b-button
        size="sm"
        variant="light"
        @click="partialUpdateTagSearchFilters({ tagSearchFilters: { strainName: '' } })"
        >&#10006;</b-button
      >
    </b-button-group>

    <b-button-group>
      <b-button size="sm" variant="danger" @click="setTagSearchFilters({ tagSearchFilters: {} })"
        >RESET FILTERS</b-button
      >
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { ITagSearchFilters } from "@/interfaces";
import { TAG_TAB_REGEX } from "@/modules/page-manager/consts";
import { mapActions, mapState } from "vuex";
import { TagFilterIdentifiers } from "@/consts";
import { MutationType } from "@/mutation-types";
import { TagSearchActions } from "@/store/page-overlay/modules/tag-search/consts";

interface ComponentData {
  tagSearchFilters: ITagSearchFilters;
}

export default Vue.extend({
  name: "TagSearchFilters",
  store,
  computed: {
    ...mapState({
      tagSearchFilters: (state: any) => state.tagSearch.tagSearchFilters,
    }),
    isOnTagsPage() {
      return window.location.pathname.match(TAG_TAB_REGEX);
    },
    hasFiltersApplied() {
      return Object.values(this.tagSearchFilters || {}).filter((x) => !!x).length > 0;
    },
  },
  methods: {
    ...mapActions({
      partialUpdateTagSearchFilters: `tagSearch/${TagSearchActions.PARTIAL_UPDATE_TAG_SEARCH_FILTERS}`,
      setTagSearchFilters: `tagSearch/${TagSearchActions.SET_TAG_SEARCH_FILTERS}`,
    }),
  },
  async mounted() {
    if (!this.isOnTagsPage) {
      // this.$store.dispatch(`tagSearch/${TagSearchActions.SET_TAG_SEARCH_FILTERS}`, {});
    }
  },
});
</script>
