import { MessageType } from '@/consts';
import { IPluginState } from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { t3RequestManager } from '@/modules/t3-request-manager.module';
import { isoDatetimedDifferenceInMinutes } from '@/utils/date';
// The marked import structure is causing problems
// @ts-ignore
import * as marked from 'marked/lib/marked.cjs';
import { ActionContext } from 'vuex';
import {
  AnnouncementsActions,
  AnnouncementsGetters,
  AnnouncementsMutations,
} from './consts';
import { IAnnouncementData, IAnnouncementsState } from './interfaces';

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

marked.use({ renderer });

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
    [AnnouncementsMutations.ANNOUNCEMENTS_MUTATION](state: IAnnouncementsState, data: any) {
      // state.data = data;
    },
  },
  getters: {
    [AnnouncementsGetters.DISMISSABLE_ANNOUNCEMENTS]: (
      state: IAnnouncementsState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ): IAnnouncementData[] => state.announcements
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
      rootGetters: any,
    ): IAnnouncementData[] => state.announcements
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
      rootGetters: any,
    ): IAnnouncementData[] => state.announcements
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
      data: any,
    ) => {
      // Only load once per minute
      if (
        !!ctx.state.lastAnnouncementsCheckDatetime
        && isoDatetimedDifferenceInMinutes(
          new Date().toISOString(),
          ctx.state.lastAnnouncementsCheckDatetime,
        ) < 1
      ) {
        console.log('declining to load');
        return;
      }

      await ctx.dispatch(AnnouncementsActions.LOAD_NOTIFICATIONS);
    },
    [AnnouncementsActions.LOAD_NOTIFICATIONS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any,
    ) => {
      const announcements = await t3RequestManager.loadAnnouncements();

      ctx.state.announcements = announcements;
      ctx.state.lastAnnouncementsCheckDatetime = new Date().toISOString();
      ctx.state.notificationCount = announcements.filter(
        (x) => x.show_notification
          // Only show fresh notifications
          && (!ctx.state.lastAnnouncementsViewedDatetime
            || x.published_at > ctx.state.lastAnnouncementsViewedDatetime),
      ).length;
    },
    [AnnouncementsActions.VIEW_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any,
    ) => {
      if (ctx.state.announcements.length === 0) {
        return;
      }

      ctx.state.lastAnnouncementsViewedDatetime = ctx.state.announcements[0].published_at;
      if (ctx.state.notificationCount > 0) {
        analyticsManager.track(MessageType.VIEWED_UNREAD_ANNOUNCEMENTS);
      }
      ctx.state.notificationCount = 0;
    },
    [AnnouncementsActions.SHOW_ALL_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any,
    ) => {
      ctx.state.showDismissed = true;
    },
    [AnnouncementsActions.DISMISS_ANNOUNCEMENTS]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any,
    ) => {
      if (ctx.state.announcements.length === 0) {
        return;
      }

      ctx.state.dismissedDatetime = ctx.state.announcements[0].published_at;

      analyticsManager.track(MessageType.DISMISSED_ANNOUNCEMENTS);
    },
    [AnnouncementsActions.RESET]: async (
      ctx: ActionContext<IAnnouncementsState, IPluginState>,
      data: any,
    ) => {
      ctx.state.notificationCount = 0;
      ctx.state.announcements = [];
      ctx.state.lastAnnouncementsCheckDatetime = null;
      ctx.state.lastAnnouncementsViewedDatetime = null;
      ctx.state.dismissedDatetime = null;
    },
  },
};

export const announcementsReducer = (state: IAnnouncementsState): IAnnouncementsState => ({
  ...state,
  ...inMemoryState,
});
