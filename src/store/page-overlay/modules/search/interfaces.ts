export type SearchType = "PACKAGES" | "TRANSFERS" | "TAGS" | "PLANTS";

export interface ISearchState {
  searchType: SearchType;
}
