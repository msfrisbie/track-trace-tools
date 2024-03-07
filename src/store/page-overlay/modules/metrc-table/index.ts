import { METRC_TAG_REGEX } from '@/consts';
import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { MetrcTableActions, MetrcTableGetters, MetrcTableMutations } from './consts';
import { IMetrcTableState } from './interfaces';

const inMemoryState = {
  barcodeValues: []
};

const persistedState = {};

const defaultState: IMetrcTableState = {
  ...inMemoryState,
  ...persistedState,
};

export const metrcTableModule = {
  state: () => defaultState,
  mutations: {
    [MetrcTableMutations.METRC_TABLE_MUTATION](state: IMetrcTableState, data: Partial<IMetrcTableState>) {
      (Object.keys(data) as Array<keyof IMetrcTableState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== 'undefined') {
          // @ts-ignore
          state[key] = value;
        }
      });
    }
  },
  getters: {
    [MetrcTableGetters.METRC_TABLE_GETTER]: (
      state: IMetrcTableState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [MetrcTableActions.UPDATE_PRINTABLE_TAG_POOL]: async (
      ctx: ActionContext<IMetrcTableState, IPluginState>,
      actionData: any = {},
    ) => {
      const selectedRows = [...document.querySelectorAll(".k-master-row.k-state-selected")];

      const labels: string[] = selectedRows.map((selectedRow) => {
        const tdElements = [...selectedRow.querySelectorAll(`td`)];

        for (const tdElement of tdElements) {
          const labelCandidate = (tdElement.textContent ?? '').trim();

          if (labelCandidate.match(METRC_TAG_REGEX)) {
            return labelCandidate;
          }
        }

        return null;
      }).filter((x) => x !== null) as string[];

      const mutationData: Partial<IMetrcTableState> = {
        barcodeValues: labels
      };

      ctx.commit(MetrcTableMutations.METRC_TABLE_MUTATION, mutationData);
    },
  },
};

export const metrcTableReducer = (state: IMetrcTableState): IMetrcTableState => ({
  ...state,
  ...inMemoryState,
});
