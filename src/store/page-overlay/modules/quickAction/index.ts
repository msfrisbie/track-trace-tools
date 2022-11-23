import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { ActionContext } from "vuex";
import { QuickActionActions, QuickActionMutations } from "./consts";
import { IQuickActionState } from "./interfaces";

const inMemoryState = {
  quickActionVisible: false,
};

const persistedState = {};

const defaultState: IQuickActionState = {
  ...inMemoryState,
  ...persistedState,
};

export const quickActionModule = {
  state: () => defaultState,
  mutations: {
    [QuickActionMutations.SET_QUICK_ACTION_VISIBLE](
      state: IQuickActionState,
      { quickActionVisible }: { quickActionVisible: boolean }
    ) {
      state.quickActionVisible = quickActionVisible;

      if (quickActionVisible) {
        analyticsManager.track(MessageType.QUICK_ACTION_OPEN, {});
      }
    },
  },
  getters: {},
  actions: {
    [QuickActionActions.SET_QUICK_ACTION_VISIBLE](
      ctx: ActionContext<IQuickActionState, IPluginState>,
      { quickActionVisible }: { quickActionVisible: boolean }
    ) {
      ctx.commit(QuickActionMutations.SET_QUICK_ACTION_VISIBLE, { quickActionVisible });
    },
    [QuickActionActions.TOGGLE_QUICK_ACTION_VISIBLE](
      ctx: ActionContext<IQuickActionState, IPluginState>,
      {}: {}
    ) {
      ctx.commit(QuickActionMutations.SET_QUICK_ACTION_VISIBLE, {
        quickActionVisible: !ctx.state.quickActionVisible,
      });
    },
  },
};

export const quickActionReducer = (state: IQuickActionState): IQuickActionState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
