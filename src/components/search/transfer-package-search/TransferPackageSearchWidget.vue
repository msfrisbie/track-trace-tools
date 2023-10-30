<template>
  <div class="ttt-wrapper package-search">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div v-on:click.stop.prevent class="search-bar-container flex flex-col flex-grow">
          <div v-if="searchState.showSearchResults" class="relative">
            <div class="search-bar flex absolute w-full flex-col bg-white rounded-b-md">
              <div class="flex-grow overflow-y-auto">
                <div
                  class="hide-scrollbar grid grid-cols-6 grid-rows-3 h-full"
                  style="grid-template-rows: auto auto 1fr"
                >
                  <template v-if="searchState.queryString.length > 0">
                    <search-view-selector />

                    <div
                      class="col-span-6 flex flex-row items-center space-x-2 p-4 border-purple-300 border-b"
                    >
                      <div class="flex-grow">
                        <p class="text-lg text-gray-600">
                          <template v-if="inflight">
                            <span class="font-bold text-gray-900">{{
                              searchState.queryString
                            }}</span>
                            matches {{ transferPackageSearchState.results.length
                            }}{{ transferPackageSearchState.results.length === 500 ? "+" : "" }}
                            transfers
                          </template>
                          <template v-if="initial">
                            Search your inactive outgoing transfers for packages matching
                            <span class="font-bold text-gray-900">{{
                              searchState.queryString
                            }}</span
                            >.</template
                          >
                        </p>
                      </div>

                      <template v-if="inflight">
                        <b-spinner class="ttt-purple mr-2" />
                      </template>
                    </div>

                    <div class="flex flex-col gap-2 overflow-y-auto col-span-2 p-4">
                      <template v-if="initial">
                        <p class="text-base text-gray-500">
                          Set the filters below to get faster results
                        </p>
                        <hr />
                      </template>
                      <b-form-group label="Search order:" size="sm">
                        <b-select :disabled="!initial" v-model="algorithm" size="sm">
                          <b-select-option :value="TransferPackageSearchAlgorithm.OLD_TO_NEW"
                            >Search oldest transfers first</b-select-option
                          >
                          <b-select-option :value="TransferPackageSearchAlgorithm.NEW_TO_OLD"
                            >Search newest transfers first</b-select-option
                          >
                        </b-select>
                      </b-form-group>

                      <b-form-group label="Only search transfers after:" size="sm">
                        <b-form-datepicker
                          :disabled="!initial"
                          size="sm"
                          v-model="startDate"
                        ></b-form-datepicker>
                        <b-button
                          variant="link"
                          v-if="startDate && initial"
                          @click="startDate = null"
                          size="sm"
                          >CLEAR</b-button
                        >
                      </b-form-group>

                      <template v-if="initial">
                        <b-button variant="primary" @click="executeSearch({})">SEARCH</b-button>
                      </template>

                      <template v-if="inflight">
                        <b-button variant="outline-danger" @click="stopSearch({})">STOP</b-button>
                      </template>

                      <template v-if="success || error">
                        <b-button variant="outline-danger" @click="resetSearch({})">RESET</b-button>
                      </template>

                      <div class="flex flex-col">
                        <div v-for="msg of reversedMessages" v-bind:key="msg.timestamp">
                          <div
                            class="py-2"
                            v-bind:class="{
                              'text-red-500': msg.variant === 'danger',
                              'text-yellow-600': msg.variant === 'warning',
                            }"
                          >
                            {{ msg.message }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-col col-span-4 p-4 gap-4 overflow-y-auto">
                      <div
                        v-for="transfer of transferPackageSearchState.results"
                        v-bind:key="transfer.Id"
                      >
                        <b-card no-body>
                          <template #header>
                            <div class="flex flex-row justify-between items-center">
                              <div class="text-lg text-purple-800">
                                Manifest
                                {{ transfer.ManifestNumber }}
                              </div>
                              <div
                                v-show="isOnTransfersPage"
                                @click.stop.prevent="setTransferManifestNumberFilter(transfer)"
                                class="flex flex-row items-center justify-center cursor-pointer h-full"
                              >
                                <font-awesome-icon
                                  icon="chevron-right"
                                  class="text-2xl text-purple-500"
                                />
                              </div>
                            </div>
                          </template>

                          <div>
                            <div
                              v-for="destination of transfer.outgoingDestinations"
                              v-bind:key="destination.Id"
                            >
                              <div v-for="pkg of destination.packages" v-bind:key="pkg.Id">
                                <div
                                  class="py-4 px-2 w-full flex flex-row items-center justify-start space-x-4"
                                >
                                  <picker-icon
                                    icon="box"
                                    style="width: 5rem"
                                    class="flex-shrink-0"
                                    :textClass="getQuantityOrError(pkg) === 0 ? 'text-red-500' : ''"
                                    :text="`${getQuantityOrError(
                                      pkg
                                    )} ${getItemUnitOfMeasureAbbreviationOrError(pkg)}`"
                                  />

                                  <picker-card
                                    class="flex-grow"
                                    :title="`${getItemNameOrError(pkg)}`"
                                    :label="getLabelOrError(pkg)"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </b-card>

                        <!-- <div
                          class="w-full grid grid-cols-3"
                          style="
                            grid-template-columns:
                              1fr 8fr
                              1fr;
                          "
                        >
                          <div></div>

                          <div class="flex flex-col items-center space-y-8 flex-grow">
                            <div class="flex flex-col space-y-2 items-center">
                              <div class="flex flex-row items-center space-x-4 text-center"></div>

                              <b-badge class="text-lg" :variant="badgeVariant(transfer)">{{
                                displayTransferState(transfer)
                              }}</b-badge>
                            </div>
                          </div>
                        </div>

                        <div
                          v-for="destination of transfer.destinations"
                          v-bind:key="destination.Id"
                        >
                          <div v-for="pkg of destination.packages" v-bind:key="pkg.Id">
                            {{ pkg.PackageLabel }}
                          </div>
                        </div> -->
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="col-span-6">
                      <!-- Top row is sized "auto", so this placeholer is needed -->
                    </div>

                    <div class="flex flex-col overflow-y-auto col-span-6">
                      <history-list />
                    </div>
                  </template>
                </div>
              </div>

              <div
                v-if="!searchState.modalSearchOpen"
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
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { IIndexedTagData, IIndexedTransferData, IPluginState } from '@/interfaces';
import SearchViewSelector from '@/components/search/shared/SearchViewSelector.vue';
import {
  TransferPackageSearchActions,
  TransferPackageSearchAlgorithm,
  TransferPackageSearchState,
} from '@/store/page-overlay/modules/transfer-package-search/consts';
import { TRANSFER_TAB_REGEX } from '@/modules/page-manager/consts';
import { MessageType, TagState, TransferState } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { SearchActions } from '@/store/page-overlay/modules/search/consts';
import { TransferSearchActions } from '@/store/page-overlay/modules/transfer-search/consts';
import {
  getLabelOrError,
  getQuantityOrError,
  getItemNameOrError,
  getItemUnitOfMeasureNameOrError,
  getItemUnitOfMeasureAbbreviationOrError,
} from '@/utils/package';
import PickerCard from '@/components/overlay-widget/shared/PickerCard.vue';
import PickerIcon from '@/components/overlay-widget/shared/PickerIcon.vue';
import HistoryList from '@/components/search/shared/HistoryList.vue';

export default Vue.extend({
  name: 'TransferPackageSearchWidget',
  store,
  router,
  props: {},
  components: {
    SearchViewSelector,
    PickerCard,
    PickerIcon,
    HistoryList,
  },
  computed: {
    ...mapState<IPluginState>({
      transferPackageSearchState: (state: IPluginState) => state.transferPackageSearch,
      searchState: (state: IPluginState) => state.search,
    }),
    reversedMessages(): any[] {
      return [...store.state.transferPackageSearch.messages].reverse();
    },
    isOnTransfersPage(): boolean {
      return !!window.location.pathname.match(TRANSFER_TAB_REGEX);
    },
    initial(): boolean {
      return store.state.transferPackageSearch.state === TransferPackageSearchState.INITIAL;
    },
    inflight(): boolean {
      return store.state.transferPackageSearch.state === TransferPackageSearchState.INFLIGHT;
    },
    success(): boolean {
      return store.state.transferPackageSearch.state === TransferPackageSearchState.SUCCESS;
    },
    error(): boolean {
      return store.state.transferPackageSearch.state === TransferPackageSearchState.ERROR;
    },
    algorithm: {
      get(): TransferPackageSearchAlgorithm {
        return store.state.transferPackageSearch.algorithm;
      },
      set(algorithm: TransferPackageSearchAlgorithm) {
        store.state.transferPackageSearch.algorithm = algorithm;
      },
    },
    startDate: {
      get(): string | null {
        return store.state.transferPackageSearch.startDate;
      },
      set(startDate: string | null) {
        store.state.transferPackageSearch.startDate = startDate;
      },
    },
  },
  data() {
    return {
      TransferPackageSearchState,
      TransferPackageSearchAlgorithm,
    };
  },
  methods: {
    ...mapActions({
      setShowSearchResults: `search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`,
      executeSearch: `transferPackageSearch/${TransferPackageSearchActions.EXECUTE_SEARCH}`,
      stopSearch: `transferPackageSearch/${TransferPackageSearchActions.STOP_SEARCH}`,
      resetSearch: `transferPackageSearch/${TransferPackageSearchActions.RESET_SEARCH}`,
      updateSearchParameters: `transferPackageSearch/${TransferPackageSearchActions.UPDATE_SEARCH_PARAMETERS}`,
    }),
    getLabelOrError,
    getQuantityOrError,
    getItemNameOrError,
    getItemUnitOfMeasureNameOrError,
    getItemUnitOfMeasureAbbreviationOrError,
    displayTransferState(transfer: IIndexedTransferData) {
      return transfer.TransferState.replaceAll('_', ' ');
    },
    async setTransferManifestNumberFilter(transfer: IIndexedTransferData) {
      analyticsManager.track(MessageType.SELECTED_TRANSFER);

      store.dispatch(`transferPackageSearch/${TransferPackageSearchActions.STOP_SEARCH}`, {});

      store.dispatch(
        `transferSearch/${TransferSearchActions.PARTIAL_UPDATE_TRANSFER_SEARCH_FILTERS}`,
        {
          transferState: transfer.TransferState,
          transferSearchFilters: {
            manifestNumber: transfer.ManifestNumber,
          },
        },
      );

      this.setShowSearchResults({ showSearchResults: false });
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
