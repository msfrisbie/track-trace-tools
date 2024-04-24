import { MetrcGridId } from "@/consts";
import {
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedSalesReceiptData,
  IIndexedTagData,
  IIndexedTransferData,
  IIndexedTransferredPackageData,
  IItemData,
  IStrainData,
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
  activeGridId: MetrcGridId | null;
  metrcSearchFilters: { [key: string]: { [key: string]: string } };

  // Deprecated

  searchType: SearchType;
}
