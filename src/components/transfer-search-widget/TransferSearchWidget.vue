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
import TransferSearchFilters from "@/components/transfer-search-widget/TransferSearchFilters.vue";
import TransferSearchResults from "@/components/transfer-search-widget/TransferSearchResults.vue";
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { databaseInterface } from "@/modules/database-interface.module";
import { searchManager } from "@/modules/search-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { TransferSearchActions } from "@/store/page-overlay/modules/transfer-search/consts";
import { combineLatest, Observable, of, timer } from "rxjs";
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
        searchManager.setTransferSearchVisibility({ showTransferSearchResults: false });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        searchManager.setTransferSearchVisibility({ showTransferSearchResults: false });
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

    const queryString$: Observable<string> = searchManager.transferQueryString.asObservable().pipe(
      tap((queryString: string) => {
        this.$data.queryString = queryString;
      }),
      filter(
        (queryString: string) =>
          queryString !== this.$store.state.transferSearch.transferQueryString
      ),
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
        startWith(this.$store.state.transferSearch.transferQueryString)
      ),
      of(true),
    ]).subscribe(async ([queryString, transferIndexUpdated]: [string, boolean]) => {
      this.$data.searchInflight = true;

      if (queryString.length > 0) {
        this.$data.firstSearchResolver();
      }

      this.$data.transfers = [];

      try {
        const promises: Promise<any>[] = [];

        promises.push(
          primaryDataLoader.onDemandIncomingTransferSearch({ queryString }).then((transfers) => {
            this.$data.transfers = [...transfers, ...this.$data.transfers];
          })
        );
        // promises.push(
        //   primaryDataLoader.onDemandIncomingInactiveTransferSearch({ queryString }).then((transfers) => {
        //     this.$data.transfers = this.$data.transfers.concat(transfers);
        //   })
        // );
        // promises.push(
        //   primaryDataLoader.onDemandOutgoingTransferSearch({ queryString }).then((transfers) => {
        //     this.$data.transfers = this.$data.transfers.concat(transfers);
        //   })
        // );
        // promises.push(
        //   primaryDataLoader.onDemandRejectedTransferSearch({ queryString }).then((transfers) => {
        //     this.$data.transfers = this.$data.transfers.concat(transfers);
        //   })
        // );
        // promises.push(
        //   primaryDataLoader.onDemandOutgoingInactiveTransferSearch({ queryString }).then((transfers) => {
        //     this.$data.transfers = this.$data.transfers.concat(transfers);
        //   })
        // );

        const results = await Promise.allSettled(promises);

        if (results.find((promise) => promise.status === "rejected")) {
          throw new Error("Could not resolve all transfer requests");
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.$data.searchInflight = false;
      }
    });
  },
  computed: {
    inflight(): boolean {
      return this.$data.searchInflight || this.$data.indexInflight;
    },
    ...mapState<IPluginState>({
      transferQueryString: (state: IPluginState) => state.transferSearch.transferQueryString,
      showTransferSearchResults: (state: IPluginState) =>
        state.transferSearch.showTransferSearchResults,
    }),
  },
  methods: {
    ...mapActions({
      setTransferQueryString: `transferSearch/${TransferSearchActions.SET_TRANSFER_QUERY_STRING}`,
      setExpandSearchOnNextLoad: `transferSearch/${TransferSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
    }),
    async setShowTransferSearchResults({
      showTransferSearchResults,
    }: {
      showTransferSearchResults: boolean;
    }) {
      searchManager.setTransferSearchVisibility({ showTransferSearchResults });
    },
    search(queryString: string) {
      searchManager.setTransferSearchVisibility({ showTransferSearchResults: true });
      searchManager.transferQueryString.next(queryString);
    },
    clearSearchField() {
      searchManager.transferQueryString.next("");
    },
  },
  watch: {
    showTransferSearchResults: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue) {
          timer(500).subscribe(
            // @ts-ignore
            () => this.$refs.search?.$el.focus()
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
