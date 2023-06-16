import { IIndexedPackageData, IPackageSearchFilters } from "@/interfaces";

export interface IPackageSearchState {
  packageSearchFilters: IPackageSearchFilters;
  packages: IIndexedPackageData[];
  selectedPackage: IIndexedPackageData | null;
}
