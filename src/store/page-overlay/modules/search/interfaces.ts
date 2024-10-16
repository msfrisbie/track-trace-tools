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
  IStrainData,
} from "@/interfaces";
import { SearchStatus, SearchType } from "./consts";

export interface ISearchResult {
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
  // Metadata
  score: number;
  primaryIconName: string;
  secondaryIconName: string | null;
  primaryTextualIdentifier: string;
  secondaryTextualIdentifier: string | null;
  primaryTextualDescriptor: string;
  secondaryTextualDescriptor: string | null;
  primaryStatusTextualDescriptor: string | null;
  isActive: boolean;
  isInactive: boolean;
  matchedFields: {
    field: string;
    value: string;
    subscore: number;
  }[];
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
  metrcGridFilters: { [key: string]: { [key: string]: string } };

  // Deprecated

  searchType: SearchType;
}
