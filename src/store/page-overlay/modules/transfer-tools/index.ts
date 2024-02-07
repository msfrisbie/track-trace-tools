import { IMetrcFacilityData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import {
  extractRecentDestinationFacilitiesFromTransfers,
  extractRecentTransporterFacilitiesFromTransfers,
} from "@/utils/transfer";
import { ActionContext } from "vuex";
import { TransferToolsActions, TransferToolsGetters, TransferToolsMutations } from "./consts";
import { ITransferToolsState } from "./interfaces";

const inMemoryState = {
  destinationFacilities: [],
  transporterFacilities: [],
  recentTransporterFacilities: [],
  recentDestinationFacilities: [],
  selectedDestinationLicense: null,
};

const persistedState = {};

const defaultState: ITransferToolsState = {
  ...inMemoryState,
  ...persistedState,
};

export const transferToolsModule = {
  state: () => defaultState,
  mutations: {
    [TransferToolsMutations.TRANSFER_TOOLS_MUTATION](
      state: ITransferToolsState,
      data: Partial<ITransferToolsState>
    ) {
      (Object.keys(data) as Array<keyof ITransferToolsState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
  },
  getters: {
    [TransferToolsGetters.TRANSFER_TOOLS_GETTER]: (
      state: ITransferToolsState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [TransferToolsActions.LOAD_TRANSFER_TOOL_DATA]: async (
      ctx: ActionContext<ITransferToolsState, IPluginState>,
      data: any
    ) => {
      primaryDataLoader.transferDestinationFacilities().then((destinationFacilities) => {
        ctx.commit(TransferToolsMutations.TRANSFER_TOOLS_MUTATION, {
          destinationFacilities,
        } as Partial<ITransferToolsState>);
      });

      primaryDataLoader.transferTransporterFacilities().then((transporterFacilities) => {
        ctx.commit(TransferToolsMutations.TRANSFER_TOOLS_MUTATION, {
          transporterFacilities,
        } as Partial<ITransferToolsState>);
      });

      extractRecentDestinationFacilitiesFromTransfers().then(
        (recentDestinationFacilities: IMetrcFacilityData[]) => {
          ctx.commit(TransferToolsMutations.TRANSFER_TOOLS_MUTATION, {
            recentDestinationFacilities: recentDestinationFacilities.sort((a, b) =>
              a.FacilityName.localeCompare(b.FacilityName)
            ),
          } as Partial<ITransferToolsState>);
        }
      );

      extractRecentTransporterFacilitiesFromTransfers().then(
        (recentTransporterFacilities: IMetrcFacilityData[]) => {
          ctx.commit(TransferToolsMutations.TRANSFER_TOOLS_MUTATION, {
            recentTransporterFacilities: recentTransporterFacilities.sort((a, b) =>
              a.FacilityName.localeCompare(b.FacilityName)
            ),
          } as Partial<ITransferToolsState>);
        }
      );
    },
  },
};

export const transferToolsReducer = (state: ITransferToolsState): ITransferToolsState => ({
  ...state,
  ...inMemoryState,
});
