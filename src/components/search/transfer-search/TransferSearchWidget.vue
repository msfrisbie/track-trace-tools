<template>
  <div class="ttt-wrapper transfer-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <b-input-group size="md">
            <b-input-group-prepend @click="setShowSearchResults({ showSearchResults: true })"
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
              @click="setShowSearchResults({ showSearchResults: true })"
              @focus="setShowSearchResults({ showSearchResults: true })"
              ref="search"
            ></b-form-input>

            <b-input-group-append v-if="queryString.length > 0">
              <b-button variant="light" @click="clearSearchField"
                ><font-awesome-icon icon="backspace"
              /></b-button>
            </b-input-group-append>
          </b-input-group>

          <!-- Anchor point for dropdown results card -->
          <div v-if="transferSearchState.showSearchResults" class="search-anchor">
            <div class="search-bar flex flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <transfer-search-results :transfers="transfers" :inflight="searchInflight" />
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

      <div class="my-4">
        <transfer-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SearchPickerSelect from "@/components/page-overlay/SearchPickerSelect.vue";
import TransferSearchFilters from "@/components/search/transfer-search/TransferSearchFilters.vue";
import TransferSearchResults from "@/components/search/transfer-search/TransferSearchResults.vue";
import { MessageType, TransferState } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { databaseInterface } from "@/modules/database-interface.module";
import { searchManager } from "@/modules/search-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { combineLatest, Observable, timer } from "rxjs";
import { debounceTime, filter, startWith, tap } from "rxjs/operators";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

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
      showFilters: false,
      queryString: "",
      transfers: [],
      filters: {
        license: null,
      },
    };
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    this.$data.filters.license = authState.license;

    document.addEventListener("keyup", (e) => {
      if (e.isTrusted && e.key === "Escape") {
        this.setShowSearchResults({ showSearchResults: false });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        this.setShowSearchResults({ showSearchResults: false });
      }
    });

    // Initialize
    searchManager.transferQueryString.next(this.$data.queryString);

    this.$data.firstSearch = new Promise((resolve) => {
      this.$data.firstSearchResolver = resolve;
    });

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
        this.setTransferQueryString({ transferQueryString: queryString });
      })
    );

    combineLatest([
      queryString$.pipe(
        filter((queryString: string) => !!queryString),
        startWith(this.$store.state.transferSearch.transferQueryString || "")
      ),
    ]).subscribe(async ([queryString]: [string]) => {
      this.$data.searchInflight = true;

      if (queryString.length > 0) {
        this.$data.firstSearchResolver();
      }

      this.$data.transfers = [];

      await Promise.allSettled([
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.INCOMING,
            queryString,
          })
          .then((result) => {
            this.$data.transfers = [...this.$data.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.INCOMING_INACTIVE,
            queryString,
          })
          .then((result) => {
            this.$data.transfers = [...this.$data.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.OUTGOING,
            queryString,
          })
          .then((result) => {
            this.$data.transfers = [...this.$data.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.OUTGOING_INACTIVE,
            queryString,
          })
          .then((result) => {
            this.$data.transfers = [...this.$data.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.REJECTED,
            queryString,
          })
          .then((result) => {
            this.$data.transfers = [...this.$data.transfers, ...result];
          }),
      ]);

      this.$data.searchInflight = false;
    });

    if (this.$store.state.expandSearchOnNextLoad) {
      this.setExpandSearchOnNextLoad({
        expandSearchOnNextLoad: false,
      });

      this.setShowSearchResults({ showSearchResults: true });
    }
  },
  computed: {
    ...mapState<IPluginState>({
      transferSearchState: (state: IPluginState) => state.transferSearch,
    }),
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      setTransferQueryString: `transferSearch/${TransferSearchActions.SET_TRANSFER_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `transferSearch/${TransferSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
    search(queryString: string) {
      this.setShowSearchResults({ showSearchResults: true });
      searchManager.transferQueryString.next(queryString);
    },
    clearSearchField() {
      searchManager.transferQueryString.next("");
    },
  },
  watch: {
    "transferSearchState.showSearchResults": {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue) {
          timer(500).subscribe(() =>
            // @ts-ignore
            this.$refs.search?.$el.focus()
          );
        }
      },
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
