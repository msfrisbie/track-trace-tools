import { IPlantSearchFilters } from "@/interfaces";

export interface IPlantSearchState {
  expandSearchOnNextLoad: boolean;
  plantQueryString: string;
  plantQueryStringHistory: string[];
  plantSearchFilters: IPlantSearchFilters;
  showPlantSearchResults: boolean;
}
