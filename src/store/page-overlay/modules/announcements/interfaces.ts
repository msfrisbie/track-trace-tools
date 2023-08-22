export interface IAnnouncementsState {
  announcements: IAnnouncementData[];
  notificationCount: number;
  // The last time notifications were loaded from the server
  lastAnnouncementsCheckDatetime: string | null;
  // The most recent announcement datetime actually viewed
  // When loading new announcements, add a notification for each
  // announcement that is AFTER this datetime
  lastAnnouncementsViewedDatetime: string | null;
  // The datetime before which all notifications are dismissed
  dismissedDatetime: string | null;
  showDismissed: boolean;
}

export interface IAnnouncementData {
  markdown: string;
  published_at: string;
  show_notification: boolean;
  html?: string;
  readable_published_at?: string;
}
