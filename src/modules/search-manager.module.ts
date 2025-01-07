import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { SearchActions } from "@/store/page-overlay/modules/search/consts";
import { debounce } from "lodash-es";

class SearchManager implements IAtomicService {
  async init() {
    // Debounced handler for "keyup" event
    const debouncedKeyupHandler = debounce((e) => {
      if (e.isTrusted && e.key === "Escape") {
        store.dispatch(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, {
          showSearchResults: false,
        });
      }
    }, 150);

    // Debounced handler for "click" event
    const debouncedClickHandler = debounce((e) => {
      if (e.isTrusted) {
        store.dispatch(`search/${SearchActions.SET_SHOW_SEARCH_RESULTS}`, {
          showSearchResults: false,
        });
      }
    }, 150);

    document.addEventListener("keyup", debouncedKeyupHandler);
    document.addEventListener("click", debouncedClickHandler);
  }
}

export const searchManager = new SearchManager();
