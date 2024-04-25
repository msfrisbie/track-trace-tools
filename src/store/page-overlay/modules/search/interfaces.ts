import { MetrcGridId } from "@/consts";
import {
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedSalesReceiptData,
  IIndexedTagData,
  IIndexedTransferData,
  IIndexedTransferredPackageData,
  IItemData,
  IStrainData
} from "@/interfaces";
import { SearchStatus, SearchType } from "./consts";

export interface ISearchResult {
  score: number;
  pkg?: IIndexedPackageData;
  transferPkg?: IIndexedTransferredPackageData;
  plant?: IIndexedPlantData;
  plantBatch?: IIndexedPlantBatchData;
  tag?: IIndexedTagData;
  incomingTransfer?: IIndexedTransferData;
  outgoingTransfer?: IIndexedTransferData;
  harvest?: IIndexedHarvestData;
  item?: IItemData;
  strain?: IStrainData;
  salesReceipt?: IIndexedSalesReceiptData;
}

export interface ISearchState {
  showSearchResults: boolean;
  status: SearchStatus;
  statusMessage: string | null;
  queryString: string;
  queryLicenseNumber: string;
  queryStringHistory: string[];
  modalSearchOpen: boolean;
  searchResults: ISearchResult[];
  activeSearchResult: ISearchResult | null;

  // Metrc page mirror data
  activeMetrcGridId: MetrcGridId | null;
  metrcSearchFilters: { [key: string]: { [key: string]: string } };

  // Deprecated

  searchType: SearchType;
}
