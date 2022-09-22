<template>
  <div class="ttt-wrapper transfer-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <b-input-group size="md">
            <b-input-group-prepend @click="setShowTransferSearchResults(true)"
              ><b-input-group-text class="search-icon">
                <font-awesome-icon icon="search" />
              </b-input-group-text>

              <search-picker-select />
            </b-input-group-prepend>

            <b-form-input
              v-model="queryString"
              type="text"
              placeholder="Manifest number, license, source/destination..."
              autocomplete="off"
              @input="search($event)"
              @click="setShowTransferSearchResults(true)"
              @focus="setShowTransferSearchResults(true)"
              ref="search"
            ></b-form-input>

            <b-input-group-append v-if="queryString.length > 0">
              <b-button variant="light" @click="clearSearchField"
                ><font-awesome-icon icon="backspace"
              /></b-button>
            </b-input-group-append>
          </b-input-group>

          <!-- Anchor point for dropdown results card -->
          <div v-if="showTransferSearchResults" class="search-anchor">
            <div class="search-bar flex flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <transfer-search-results :transfers="transfers" :inflight="inflight" />
              </div>

              <div
                class="flex flex-row items-center space-x-1 p-1 text-xs text-gray-500 border-blue-300 border-t"
              >
                <span>Press</span>
                <b-badge variant="light">esc</b-badge>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="my-4">
        <transfer-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import TransferSearchFilters from "@/components/transfer-search-widget/TransferSearchFilters.vue";
import TransferSearchResults from "@/components/transfer-search-widget/TransferSearchResults.vue";
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { databaseInterface } from "@/modules/database-interface.module";
import { searchManager } from "@/modules/search-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { combineLatest, Observable } from "rxjs";
import { debounceTime, filter, startWith, tap } from "rxjs/operators";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "TransferSearchWidget",
  store,
  components: {
    TransferSearchResults,
    TransferSearchFilters,
    SearchPickerSelect,
  },
  data() {
    return {
      firstSearch: null,
      firstSearchResolver: null,
      searchInflight: false,
      indexInflight: false,
      showFilters: false,
      queryString: "", //this.$store.state.transferQueryString,
      transfers: [],
      filters: {
        license: null,
      },
    };
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.filters.license = authState.license;

    searchManager.init();

    document.addEventListener("keyup", (e) => {
      if (e.isTrusted && e.key === "Escape") {
        searchManager.setTransferSearchVisibility(false);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        searchManager.setTransferSearchVisibility(false);
      }
    });

    searchManager.transferIndexInflight().subscribe((indexInflight: boolean) => {
      this.$data.indexInflight = indexInflight;
    });

    // Initialize
    searchManager.transferQueryString.next(this.$data.queryString);

    this.$data.firstSearch = new Promise((resolve) => {
      this.$data.firstSearchResolver = resolve;
    });
    this.$data.firstSearch.then(() => searchManager.indexTransfers());

    const queryString$: Observable<string> = searchManager.transferQueryString.asObservable().pipe(
      tap((queryString: string) => {
        this.$data.queryString = queryString;
      }),
      filter((queryString: string) => queryString !== this.$store.state.transferQueryString),
      debounceTime(500),
      tap((queryString: string) => {
        if (queryString) {
          analyticsManager.track(MessageType.ENTERED_TRANSFER_SEARCH_QUERY, {
            queryString,
          });
        }

        this.$data.transfers = [];

        searchManager.selectedTransfer.next(null);

        // This also writes to the search history,
        // so this must be after debounce
        this.$store.commit(MutationType.SET_TRANSFER_QUERY_STRING, queryString);
      })
    );

    combineLatest([
      queryString$.pipe(
        filter((queryString: string) => !!queryString),
        startWith(this.$store.state.transferQueryString)
      ),
      searchManager.transferIndexUpdated().pipe(
        filter((x) => !!x),
        startWith(true)
      ),
    ]).subscribe(async ([queryString, transferIndexUpdated]: [string, boolean]) => {
      this.$data.searchInflight = true;

      if (queryString.length > 0) {
        this.$data.firstSearchResolver();
      }

      try {
        this.$data.transfers = await databaseInterface.transferSearch(
          queryString,
          this.$data.filters
        );
      } catch (e) {
        console.error(e);
      } finally {
        this.$data.searchInflight = false;
      }
    });
  },
  computed: {
    inflight() {
      return this.$data.searchInflight || this.$data.indexInflight;
    },
    ...mapState([
      "loadingMessage",
      "errorMessage",
      "flashMessage",
      "transferQueryStringHistory",
      "showTransferSearchResults",
      "transferQueryString",
    ]),
  },
  methods: {
    async setShowTransferSearchResults(showTransferSearchResults: boolean) {
      searchManager.setTransferSearchVisibility(showTransferSearchResults);
    },
    search(queryString: string) {
      searchManager.setTransferSearchVisibility(true);
      searchManager.transferQueryString.next(queryString);
    },
    clearSearchField() {
      searchManager.transferQueryString.next("");
    },
    setSearch(queryString: string) {
      // @ts-ignore
      this.$refs.search.$el?.focus();
      searchManager.transferQueryString.next(queryString);
      analyticsManager.track(MessageType.CLICKED_RECENT_TRANSFER_QUERY, {
        queryString,
      });
    },
  },
});
</script>

<style type="text/scss" lang="scss">
@import "@/scss/search-widget";

body.transfer-search-hidden .transfer-search {
  display: none;
}
</style>
