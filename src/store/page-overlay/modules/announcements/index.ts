import { AnalyticsEvent } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { isoDatetimedDifferenceInMinutes } from "@/utils/date";
// The marked import structure is causing problems
// @ts-ignore
import * as marked from "marked/lib/marked.cjs";
import { ActionContext } from "vuex";
import { AnnouncementsActions, AnnouncementsGetters, AnnouncementsMutations } from "./consts";
import { IAnnouncementData, IAnnouncementsState } from "./interfaces";

const renderer = {
  heading(text: string, level: any) {
    return `<h${level} class="text-${4 - level}xl ttt-purple">${text}</h${level}>`;
  },
  link(href: string, title: string, text: string) {
    if (href === null) {
      return text;
    }
    let out = `<a target="_blank" class="text-purple-500 underline" href="${href}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    out += `>${text}</a>`;
    return out;
  },
};

marked.use({
  renderer,
  mangle: false,
  headerIds: false,
});

const inMemoryState = {
  showDismissed: false,
};

const persistedState = {
  announcements: [],
  notificationCount: 0,
  lastAnnouncementsCheckDatetime: null,
  lastAnnouncementsViewedDatetime: null,
  dismissedDatetime: null,
};

const defaultState: IAnnouncementsState = {
  ...inMemoryState,
  ...persistedState,
};

export const announcementsModule = {
  state: () => defaultState,
  mutations: {
    [AnnouncementsMutations.ANNOUNCEMENTS_MUTATION](
      state: IAnnouncementsState,
      data: Partial<IAnnouncementsState>
    ) {
      (Object.keys(data) as Array<keyof IAnnouncementsState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
  },
  getters: {
    [AnnouncementsGetters.DISMISSABLE_ANNOUNCEMENTS]: (
      state: IAnnouncementsState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IAnnouncementData[] =>
      state.announcements
        .filter((x) => {
          if (!state.dismissedDatetime) {
            return true;
          }

          return x.published_at > state.dismissedDatetime;
        })
        .map((x) => {
          x.html = marked.parse(x.markdown);
          x.readable_published_at = new Date(x.published_at).toLocaleString();
          return x;
        }),
    [AnnouncementsGetters.VISIBLE_ANNOUNCEMENTS]: (
      state: IAnnouncementsState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IAnnouncementData[] =>
      state.announcements
        .filter((x) => {
          if (state.showDismissed) {
            return true;
          }

          if (!state.dismissedDatetime) {
            return true;
          }

          return x.published_at > state.dismissedDatetime;
        })
        .map((x) => {
          x.html = marked.parse(x.markdown);
          x.readable_published_at = new Date(x.published_at).toLocaleString();
          return x;
        }),
    [AnnouncementsGetters.HIDDEN_ANNOUNCEMENTS]: (
      state: IAnnouncementsState,
      getters: any,
      rootState: any,
      rootGetters: any
    ): IAnnouncementData[] =>
      state.announcements
        .filter((x) => {
          if (state.showDismissed) {
            return false;
          }

          if (!state.dismissedDatetime) {
            return false;
          }

          return x.published_at <= state.dismissedDatetime;
        })
        .map((x) => {
          x.html = marked.parse(x.markdown);
          x.readable_published_at = new Date(x.published_at).toLocaleString();
          return x;
        }),
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
        return;
      }

      await ctx.dispatch(AnnouncementsActions.LOAD_NOTIFICATIONS);
    },
    [AnnouncementsActions.LOAD_NOTIFICATIONS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      const announcements = await t3RequestManager.loadAnnouncements();
      const lastAnnouncementsCheckDatetime = new Date().toISOString();
      const notificationCount = announcements.filter(
        (x) =>
          x.show_notification &&
          // Only show fresh notifications
          (!ctx.state.lastAnnouncementsViewedDatetime ||
            x.published_at > ctx.state.lastAnnouncementsViewedDatetime)
      ).length;

      ctx.commit(AnnouncementsMutations.ANNOUNCEMENTS_MUTATION, {
        announcements,
        lastAnnouncementsCheckDatetime,
        notificationCount,
      } as Partial<IAnnouncementsState>);
    },
    [AnnouncementsActions.VIEW_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      if (ctx.state.announcements.length === 0) {
        return;
      }

      const lastAnnouncementsViewedDatetime = ctx.state.announcements[0].published_at;

      ctx.commit(AnnouncementsMutations.ANNOUNCEMENTS_MUTATION, {
        lastAnnouncementsViewedDatetime,
        notificationCount: 0,
      } as Partial<IAnnouncementsState>);

      if (ctx.state.notificationCount > 0) {
        analyticsManager.track(AnalyticsEvent.VIEWED_UNREAD_ANNOUNCEMENTS);
      }
    },
    [AnnouncementsActions.SHOW_ALL_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      ctx.commit(AnnouncementsMutations.ANNOUNCEMENTS_MUTATION, {
        showDismissed: true,
      } as Partial<IAnnouncementsState>);
    },
    [AnnouncementsActions.DISMISS_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      if (ctx.state.announcements.length === 0) {
        return;
      }

      const dismissedDatetime = ctx.state.announcements[0].published_at;

      ctx.commit(AnnouncementsMutations.ANNOUNCEMENTS_MUTATION, {
        dismissedDatetime,
      } as Partial<IAnnouncementsState>);

      analyticsManager.track(AnalyticsEvent.DISMISSED_ANNOUNCEMENTS);
    },
    [AnnouncementsActions.RESET]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any
    ) => {
      ctx.commit(AnnouncementsMutations.ANNOUNCEMENTS_MUTATION, {
        notificationCount: 0,
        announcements: [],
        lastAnnouncementsCheckDatetime: null,
        lastAnnouncementsViewedDatetime: null,
        dismissedDatetime: null,
      } as Partial<IAnnouncementsState>);
    },
  },
};

export const announcementsReducer = (state: IAnnouncementsState): IAnnouncementsState => ({
  ...state,
  ...inMemoryState,
});
