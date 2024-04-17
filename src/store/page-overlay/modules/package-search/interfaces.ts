import { IPackageSearchFilters, IUnionIndexedPackageData } from "@/interfaces";

export interface ISelectedPackageMetadata {
  packageData: IUnionIndexedPackageData;
  sectionName: string;
  priority: number;
}

export interface IPackageSearchState {
  searchInflight: boolean;
  packageSearchFilters: IPackageSearchFilters;
  packages: IUnionIndexedPackageData[];
  selectedPackageMetadata: ISelectedPackageMetadata | null;
}
