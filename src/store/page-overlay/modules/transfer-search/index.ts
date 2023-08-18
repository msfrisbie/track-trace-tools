import { TransferFilterIdentifiers, TransferState } from "@/consts";
import { IPluginState, ITransferSearchFilters } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { timer } from "rxjs";
import { ActionContext } from "vuex";
import { TransferSearchActions, TransferSearchMutations } from "./consts";
import { ITransferSearchState } from "./interfaces";

const inMemoryState = {
  searchInflight: false,
  transfers: [],
  selectedTransferMetadata: null,
  transferSearchFilters: {
    manifestNumber: null,
    shipperFacilityInfo: null,
    deliveryFacilities: null,
  },
};

const persistedState = {};

const defaultState: ITransferSearchState = {
  ...inMemoryState,
  ...persistedState,
};

export const transferSearchModule = {
  state: () => defaultState,
  mutations: {
    [TransferSearchMutations.SET_TRANSFER_SEARCH_FILTERS](
      state: ITransferSearchState,
      { transferSearchFilters }: { transferSearchFilters: ITransferSearchFilters }
    ) {
      state.transferSearchFilters = {
        ...transferSearchFilters,
      };
    },
  },
  getters: {},
  actions: {
    [TransferSearchActions.EXECUTE_QUERY]: async (
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      { queryString }: { queryString: string }
    ) => {
      ctx.state.transfers = [];
      ctx.state.selectedTransferMetadata = null;

      ctx.state.searchInflight = true;

      await Promise.allSettled([
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.INCOMING,
            queryString,
          })
          .then((result) => {
            ctx.state.transfers = [...ctx.state.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.INCOMING_INACTIVE,
            queryString,
          })
          .then((result) => {
            ctx.state.transfers = [...ctx.state.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.OUTGOING,
            queryString,
          })
          .then((result) => {
            ctx.state.transfers = [...ctx.state.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.OUTGOING_INACTIVE,
            queryString,
          })
          .then((result) => {
            ctx.state.transfers = [...ctx.state.transfers, ...result];
          }),
        primaryDataLoader
          .onDemandTransferSearch({
            transferState: TransferState.REJECTED,
            queryString,
          })
          .then((result) => {
            ctx.state.transfers = [...ctx.state.transfers, ...result];
          }),
      ]);

      ctx.state.searchInflight = false;
    },
    [TransferSearchActions.PARTIAL_UPDATE_TRANSFER_SEARCH_FILTERS]: async (
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      {
        transferSearchFilters,
        propagate = true,
        transferState = null,
      }: {
        transferSearchFilters: ITransferSearchFilters;
        propagate?: boolean;
        transferState?: TransferState | null;
      }
    ) => {
      if (transferState) {
        switch (transferState as TransferState) {
          case TransferState.INCOMING:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Incoming");
            break;
          case TransferState.INCOMING_INACTIVE:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Inactive");
            break;
          case TransferState.OUTGOING:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Outgoing");
            break;
          case TransferState.REJECTED:
            await pageManager.clickTabStartingWith(pageManager.transferTabs, "Rejected");
            break;
          case TransferState.OUTGOING_INACTIVE:
            await pageManager.clickTabStartingWith(
              pageManager.transferTabs,
              "Inactive",
              "Rejected"
            );
            break;
          default:
            break;
        }
      }

      await timer(1000).toPromise();

      ctx.dispatch(TransferSearchActions.SET_TRANSFER_SEARCH_FILTERS, {
        transferSearchFilters: {
          ...ctx.state.transferSearchFilters,
          ...transferSearchFilters,
        },
        propagate,
      });
    },
    [TransferSearchActions.SET_TRANSFER_SEARCH_FILTERS](
      ctx: ActionContext<ITransferSearchState, IPluginState>,
      {
        transferSearchFilters,
        propagate = true,
      }: { transferSearchFilters: ITransferSearchFilters; propagate?: boolean }
    ) {
      const defaultTransferSearchFilters = {
        manifestNumber: null,
      };

      transferSearchFilters = {
        ...defaultTransferSearchFilters,
        ...transferSearchFilters,
      };

      if (propagate) {
        for (let [k, v] of Object.entries(transferSearchFilters)) {
          // @ts-ignore
          if (ctx.state.transferSearchFilters[k] !== v) {
            switch (k) {
              case "manifestNumber":
                pageManager.setTransferFilter(TransferFilterIdentifiers.ManifestNumber, v);
                break;
              case "destinationFacilities":
                pageManager.setTransferFilter(TransferFilterIdentifiers.DeliveryFacilities, v);
                break;
              case "shipperFacilityInfo":
                pageManager.setTransferFilter(TransferFilterIdentifiers.ShipperFacilityInfo, v);
                break;
              default:
                break;
            }
          }
        }
      }

      ctx.commit(TransferSearchMutations.SET_TRANSFER_SEARCH_FILTERS, { transferSearchFilters });
    },
  },
};

export const transferSearchReducer = (state: ITransferSearchState): ITransferSearchState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
