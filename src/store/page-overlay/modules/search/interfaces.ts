import { SearchType } from "./consts";

export interface ISearchState {
  showSearchResults: boolean;
  searchType: SearchType;
  expandSearchOnNextLoad: boolean;
  queryString: string;
  queryStringHistory: string[];
  modalSearchOpen: boolean;
}
