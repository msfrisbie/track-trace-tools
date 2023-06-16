import { ITagSearchFilters } from "@/interfaces";

export interface ITagSearchState {
  expandSearchOnNextLoad: boolean;
  tagQueryString: string;
  tagQueryStringHistory: string[];
  tagSearchFilters: ITagSearchFilters;
  showTagSearchResults: boolean;
}
