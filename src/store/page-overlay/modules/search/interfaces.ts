import { SearchType } from "./consts";

export interface ISearchState {
  showSearchResults: boolean;
  searchType: SearchType;
  queryString: string;
  queryStringHistory: string[];
  modalSearchOpen: boolean;
}
