import { MetrcGridId } from "@/consts";
import {
  IIndexedHarvestData,
  IIndexedItemData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedSalesReceiptData,
  IIndexedStrainData,
  IIndexedTagData,
  IIndexedTransferData,
  IIndexedTransferredPackageData,
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
  item?: IIndexedItemData;
  strain?: IIndexedStrainData;
  salesReceipt?: IIndexedSalesReceiptData;
  // Metadata
  score: number;
  isActive: boolean;
  isInactive: boolean;
  isPrimaryIdentifierMetrcTag: boolean;
  matchedFields: {
    field: string;
    value: string;
    subscore: number;
  }[];
  // Rendering
  primaryIconName: string;
  secondaryIconName: string | null;
  metrcGridId: MetrcGridId;
  colorClassName: string;
  primaryTextualIdentifier: string;
  secondaryTextualIdentifier: string | null;
  primaryTextualDescriptor: string;
  secondaryTextualDescriptor: string | null;
  primaryStatusTextualDescriptor: string | null;
  // Navigation
  path: string;
  primaryField: string;
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
