import { IPackageSearchFilters } from "@/interfaces";

export interface IPackageSearchState {
  expandSearchOnNextLoad: boolean;
  packageQueryString: string;
  packageQueryStringHistory: string[];
  packageSearchFilters: IPackageSearchFilters;
}
