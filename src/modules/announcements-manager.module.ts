import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { AnnouncementsActions } from "@/store/page-overlay/modules/announcements/consts";

class AnnouncementsManager implements IAtomicService {
  async init() {
    store.dispatch(`announcements/${AnnouncementsActions.INTERVAL_LOAD_NOTIFICATIONS}`);
  }
}

export let announcementsManager = new AnnouncementsManager();
