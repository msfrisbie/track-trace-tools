<template>
  <div v-show="isOnTagsPage" v-if="hasTagNumberFilter" class="flex flex-row space-x-2">
    <b-button-group v-if="hasTagNumberFilter">
      <b-button size="sm" variant="light" disabled
        >Tag #:
        <span class="metrc-tag">{{ tagSearchFilters.label }}</span>
      </b-button>
      <b-button size="sm" variant="light" @click="clearTagLabelFilter">&#10006;</b-button>
    </b-button-group>

    <b-button-group>
      <b-button size="sm" variant="danger" @click="clearMetrcSearch">RESET FILTERS</b-button>
    </b-button-group>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { ITagSearchFilters } from "@/interfaces";
import { pageManager, TAG_TAB_REGEX } from "@/modules/page-manager.module";
import { mapState } from "vuex";
import { TagFilterIdentifiers } from "@/consts";
import { MutationType } from "@/mutation-types";

interface ComponentData {
  tagSearchFilters: ITagSearchFilters;
}

export default Vue.extend({
  name: "TagSearchFilters",
  store,
  computed: {
    isOnTagsPage() {
      return window.location.pathname.match(TAG_TAB_REGEX);
    },
    hasTagNumberFilter() {
      return !!this.$store.state.tagSearchFilters.label;
    },
    ...mapState(["tagSearchFilters"])
  },
  methods: {
    clearTagLabelFilter() {
      pageManager.setTagFilter(TagFilterIdentifiers.Label, "");
    },
    clearMetrcSearch() {
      pageManager.resetMetrcTagFilters();
    }
  },
  async mounted() {
    if (!this.isOnTagsPage) {
      this.$store.commit(MutationType.SET_TAG_SEARCH_FILTERS, {});
    }
  }
});
</script>
