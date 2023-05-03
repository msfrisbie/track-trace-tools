import {
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedTagData,
  IIndexedTransferData,
  IPackageSearchFilters,
  IPlantSearchFilters,
  ITagSearchFilters,
  ITransferSearchFilters,
} from "@/interfaces";

export interface IOmniSearchState {
  expandSearchOnNextLoad: boolean;
  queryString: string;
  selectedObject: ISelectedOmniObject | null;
  queryStringHistory: string[];
  searchFilters: IOmniSearchFilters;
  showSearchResults: boolean;
}

export interface ISelectedOmniObject {
  selectedPackage?: IIndexedPackageData;
  selectedTransfer?: IIndexedTransferData;
  selectedPlant?: IIndexedPlantData;
  selectedTag?: IIndexedTagData;
}

export interface IOmniSearchFilters {
  packageSearchFilters: IPackageSearchFilters | null;
  plantSearchFilters: IPlantSearchFilters | null;
  transferSearchFilters: ITransferSearchFilters | null;
  tagSearchFilters: ITagSearchFilters | null;
  // TODO: plant batch
}
