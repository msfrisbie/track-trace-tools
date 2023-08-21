import { IPluginState } from "@/interfaces";
import { ActionContext } from "vuex";
import { AnnouncementsActions, AnnouncementsGetters, AnnouncementsMutations } from "../announcements/consts";
import { IAnnouncementsState } from "../announcements/interfaces";

const inMemoryState = {};

const persistedState = {};

const defaultState: IAnnouncementsState = {
  ...inMemoryState,
  ...persistedState,
};

export const announcementsModule = {
  state: () => defaultState,
  mutations: {
    [AnnouncementsMutations.ANNOUNCEMENTS_MUTATION](state: IAnnouncementsState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [AnnouncementsGetters.ANNOUNCEMENTS_GETTER]: (
      state: IAnnouncementsState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [AnnouncementsActions.ANNOUNCEMENTS_ACTION]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      ctx.commit(AnnouncementsMutations.ANNOUNCEMENTS_MUTATION, data);
    },
  },
};

export const announcementsReducer = (state: IAnnouncementsState): IAnnouncementsState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
