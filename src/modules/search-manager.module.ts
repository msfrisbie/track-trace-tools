import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";

class SearchManager implements IAtomicService {
  async init() {
    document.addEventListener("keyup", (e) => {
      if (e.isTrusted && e.key === "Escape") {
        store.dispatch(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, {
          showSearchResults: false,
        });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.isTrusted) {
        store.dispatch(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, {
          showSearchResults: false,
        });
      }
    });
  }
}

export const searchManager = new SearchManager();
