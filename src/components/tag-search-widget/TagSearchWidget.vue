<template>
  <div class="ttt-wrapper tag-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div class="search-bar-container flex flex-col flex-grow">
          <b-input-group size="md">
            <b-input-group-prepend
              ><b-input-group-text class="search-icon">
                <font-awesome-icon icon="search" />
              </b-input-group-text>

              <search-picker-select />
            </b-input-group-prepend>

            <b-form-input
              v-model="queryString"
              type="text"
              placeholder="Tag number"
              @input="search($event)"
              @click="openResultsCard"
              @focus="openResultsCard"
              @blur="closeResultsCard"
            ></b-form-input>

            <b-input-group-append v-if="queryString.length > 0">
              <b-button variant="light" @click="clearSearchField"
                ><font-awesome-icon icon="backspace"
              /></b-button>
            </b-input-group-append>
          </b-input-group>

          <!-- Anchor point for dropdown results card -->
          <div v-if="showResultsCard && queryString.length > 0" class="search-anchor">
            <div class="search-bar flex flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <p v-if="queryString.length > 0 && !inflight" class="text-gray-600 p-4">
                  <span class="font-bold text-gray-900">{{ queryString }}</span>
                  matches {{ tags.length }} tags:
                </p>

                <p v-if="inflight" class="flex flex-row justify-center text-gray-400 p-4">
                  <b-spinner class="ttt-purple mr-2" />Searching...
                </p>

                <div v-for="tag in visibleTags" :key="tag.Id" class="border-gray-300 border-t">
                  <tag-search-result :tag="tag" />
                </div>
              </div>

              <div
                class="flex flex-row items-center space-x-1 p-1 text-xs text-gray-500 border-purple-300 border-t"
              >
                <span>Press</span>
                <b-badge variant="light">esc</b-badge>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <tag-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import TagSearchFilters from "@/components/tag-search-widget/TagSearchFilters.vue";
import TagSearchResult from "@/components/tag-search-widget/TagSearchResult.vue";
import { IIndexedTagData, IIndexedTagFilters } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { databaseInterface } from "@/modules/database-interface.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

interface ComponentData {
  inflight: boolean;
  showFilters: boolean;
  limit: number;
  queryString: string;
  tags: Array<IIndexedTagData>;
  searchDebounceTimeoutId: number | null;
  closeCardTimeoutId: number | null;
  filters: IIndexedTagFilters;
}

const PAGE_SIZE = 10;

export default Vue.extend({
  name: "TagSearchWidget",
  store,
  components: {
    TagSearchResult,
    TagSearchFilters,
    SearchPickerSelect,
  },
  data(): ComponentData {
    return {
      showResultsCard: false,
      inflight: false,
      showFilters: false,
      queryString: "", //this.$store.state.tagQueryString,
      limit: PAGE_SIZE,
      tags: [],
      searchDebounceTimeoutId: null,
      closeCardTimeoutId: null,
      filters: {
        license: null,
      },
    } as ComponentData;
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.filters.license = authState.license;

    this.$data.inflight = this.queryString?.length > 0;

    // load tags now and show spinner
    primaryDataLoader.availableTags({}).then(() => this.search(this.queryString));
    // usedTags is enormous, don't index
    // primaryDataLoader.usedTags().then(() => this.search(this.queryString));
    primaryDataLoader.voidedTags().then(() => this.search(this.queryString));

    // Initialize
    this.search(this.queryString);
  },
  computed: {
    visibleTags(): Array<IIndexedTagData> {
      // return this.tags.slice(0, this.limit);
      return this.tags;
    },
    ...mapState(["loadingMessage", "errorMessage", "flashMessage"]),
    // displayPaginationButton(): boolean {
    //   return this.tags.length > 0 && this.limit < this.tags.length;
    // },
  },
  methods: {
    clearSearchField() {
      this.queryString = "";
      this.search(this.queryString);
    },
    async openResultsCard(event: any) {
      this.$data.showResultsCard = true;
    },
    async closeResultsCard(event: any) {
      // This is a hack. Immediately setting this to false cancels all click handers
      // in the nested components.
      this.$data.closeCardTimeoutId && clearTimeout(this.$data.closeCardTimeoutId);

      this.$data.closeCardTimeoutId = window.setTimeout(() => {
        this.$data.showResultsCard = false;
        this.$data.closeCardTimeoutId = null;
      }, 300);
    },
    async search(event: string) {
      this.searchDebounceTimeoutId && clearTimeout(this.searchDebounceTimeoutId);

      this.searchDebounceTimeoutId = window.setTimeout(async () => {
        this.searchDebounceTimeoutId = null;

        if (event !== this.$store.state.tagQueryString) {
          this.tags = [];
        }

        this.$store.commit(MutationType.SET_TAG_QUERY_STRING, event);

        this.inflight = false;
        // this.tags = [];
        this.limit = PAGE_SIZE;

        if (event.length > 0) {
          this.inflight = true;

          try {
            this.tags = (await databaseInterface.tagSearch(event, this.filters)).slice(0, 100);
          } catch (e) {
            console.error(e);
          } finally {
            this.inflight = false;
          }
        }
      }, 500);
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/search-widget";

body.tag-search-hidden .tag-search {
  display: none;
}
</style>
