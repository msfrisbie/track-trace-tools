import { IIndexedPackageData, IPackageSearchFilters } from "@/interfaces";

export interface ISelectedPackageMetadata {
  packageData: IIndexedPackageData;
  sectionName: string;
  priority: number;
}

export interface IPackageSearchState {
  searchInflight: boolean;
  packageSearchFilters: IPackageSearchFilters;
  packages: IIndexedPackageData[];
  selectedPackageMetadata: ISelectedPackageMetadata | null;
}
