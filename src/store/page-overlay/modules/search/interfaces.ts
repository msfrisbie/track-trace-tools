export type SearchType = "PACKAGES" | "TRANSFERS" | "TAGS" | "PLANTS";

export interface ISearchState {
  showSearchResults: boolean;
  searchType: SearchType;
  expandSearchOnNextLoad: boolean;
  queryString: string;
  queryStringHistory: string[];
}
