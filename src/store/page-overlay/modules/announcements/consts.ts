export enum AnnouncementsMutations {
  ANNOUNCEMENTS_MUTATION = "ANNOUNCEMENTS_MUTATION",
}

export enum AnnouncementsGetters {
  VISIBLE_ANNOUNCEMENTS = "VISIBLE_ANNOUNCEMENTS",
  HIDDEN_ANNOUNCEMENTS = "HIDDEN_ANNOUNCEMENTS",
  DISMISSABLE_ANNOUNCEMENTS = "DISMISSABLE_ANNOUNCEMENTS"
}

export enum AnnouncementsActions {
  RESET = "RESET",
  LOAD_NOTIFICATIONS = "LOAD_NOTIFICATIONS",
  INTERVAL_LOAD_NOTIFICATIONS = "INTERVAL_LOAD_NOTIFICATIONS",
  VIEW_ANNOUNCEMENTS = "VIEW_ANNOUNCEMENTS",
  DISMISS_ANNOUNCEMENTS = "DISMISS_ANNOUNCEMENTS",
  SHOW_ALL_ANNOUNCEMENTS = "SHOW_ALL_ANNOUNCEMENTS"
}
