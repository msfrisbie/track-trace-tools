import { IPackageSearchFilters } from "@/interfaces";
import { ISelectedPackageMetadata } from "@/modules/search-manager.module";

export interface IPackageSearchState {
  expandSearchOnNextLoad: boolean;
  packageQueryString: string;
  selectedPackageMetadata: ISelectedPackageMetadata;
  packageQueryStringHistory: string[];
  packageSearchFilters: IPackageSearchFilters;
  showPackageSearchResults: boolean;
}
