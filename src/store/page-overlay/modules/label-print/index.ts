import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { LabelPrintActions, LabelPrintGetters, LabelPrintMutations } from "./consts";
import { ILabelData, ILabelPrintState } from "./interfaces";

const inMemoryState = {};

const persistedState = {
  labelDataList: [],
};

const defaultState: ILabelPrintState = {
  ...inMemoryState,
  ...persistedState,
};

export const labelPrintModule = {
  state: () => defaultState,
  mutations: {
    [LabelPrintMutations.LABEL_PRINT_MUTATION](
      state: ILabelPrintState,
      data: Partial<ILabelPrintState>
    ) {
      (Object.keys(data) as Array<keyof ILabelPrintState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
  },
  getters: {
    [LabelPrintGetters.LABEL_PRINT_GETTER]: (
      state: ILabelPrintState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [LabelPrintActions.UPDATE_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {
        labelDataList,
      }: {
        labelDataList: ILabelData[];
      }
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, { labelDataList });
    },
    [LabelPrintActions.PUSH_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      {
        labelDataList,
      }: {
        labelDataList: ILabelData[];
      }
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelDataList: [...ctx.state.labelDataList, ...labelDataList],
      });
    },
    [LabelPrintActions.REMOVE_LABEL]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      { labelValue }: { labelValue: string }
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelDataList: ctx.state.labelDataList.filter((x) => x.primaryValue !== labelValue),
      });
    },
    [LabelPrintActions.RESET_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      actionData: any = {}
    ) => {
      ctx.commit(LabelPrintMutations.LABEL_PRINT_MUTATION, {
        labelDataList: [],
      });
    },
    [LabelPrintActions.PRINT_LABELS]: async (
      ctx: ActionContext<ILabelPrintState, IPluginState>,
      actionData: any = {}
    ) => {},
  },
};

export const labelPrintReducer = (state: ILabelPrintState): ILabelPrintState => ({
  ...state,
  ...inMemoryState,
});
