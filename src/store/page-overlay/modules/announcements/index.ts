import { IPluginState } from "@/interfaces";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { isoDatetimedDifferenceInMinutes } from "@/utils/date";
import { ActionContext } from "vuex";
import {
  AnnouncementsActions,
  AnnouncementsGetters,
  AnnouncementsMutations,
} from "../announcements/consts";
import { IAnnouncementsState } from "../announcements/interfaces";

const inMemoryState = {};

const persistedState = {
  announcements: [],
  notificationCount: 0,
  lastAnnouncementsCheckDatetime: null,
  lastAnnouncementsViewedDatetime: null,
};

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
    [AnnouncementsActions.INTERVAL_LOAD_NOTIFICATIONS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      // Only load once per minute
      if (
        !!ctx.state.lastAnnouncementsCheckDatetime &&
        isoDatetimedDifferenceInMinutes(
          new Date().toISOString(),
          ctx.state.lastAnnouncementsCheckDatetime
        ) < 1
      ) {
        console.log("declining to load");
        return;
      }

      await ctx.dispatch(AnnouncementsActions.LOAD_NOTIFICATIONS);
    },
    [AnnouncementsActions.LOAD_NOTIFICATIONS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      const announcements = await t3RequestManager.loadAnnouncements();

      ctx.state.announcements = announcements;
      ctx.state.lastAnnouncementsCheckDatetime = new Date().toISOString();
      ctx.state.notificationCount = announcements.filter(
        (x) =>
          x.show_notification &&
          // Only show fresh notifications
          (!ctx.state.lastAnnouncementsViewedDatetime ||
            x.published_at > ctx.state.lastAnnouncementsViewedDatetime)
      ).length;
    },
    [AnnouncementsActions.VIEW_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      if (ctx.state.announcements.length === 0) {
        return;
      }

      ctx.state.lastAnnouncementsViewedDatetime = ctx.state.announcements[0].published_at;
      ctx.state.notificationCount = 0;
    },
    [AnnouncementsActions.RESET]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      ctx.state.lastAnnouncementsCheckDatetime = null;
      ctx.state.lastAnnouncementsViewedDatetime = null;
      ctx.state.notificationCount = 0;
      ctx.state.announcements = [];
    },
  },
};

export const announcementsReducer = (state: IAnnouncementsState): IAnnouncementsState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
