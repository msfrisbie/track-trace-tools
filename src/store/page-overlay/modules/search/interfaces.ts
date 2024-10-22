import {
  HarvestState,
  ItemState,
  PackageState,
  PlantBatchState,
  PlantState,
  SalesReceiptState,
  StrainState,
  TagState,
  TransferState,
  UniqueMetrcGridId,
} from "@/consts";
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
import { SearchStatus } from "./consts";

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
  isPrimaryIdentifierMetrcTag: boolean;
  matchedFields: {
    field: string;
    value: string;
    subscore: number;
  }[];
  // Rendering
  primaryIconName: string;
  secondaryIconName: string | null;
  uniqueMetrcGridId: UniqueMetrcGridId;
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

export interface MetrcGridChild {
  name: string;
  uniqueMetrcGridId: UniqueMetrcGridId;
  enabled: boolean;
}

export interface MetrcGroup {
  name: string;
  children: MetrcGridChild[];
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
  searchResultMetrcGridGroups: MetrcGroup[];
  queryId: string;
  searchResultPageSize: number;

  // Metrc page mirror data
  activeUniqueMetrcGridId: UniqueMetrcGridId | null;
  metrcGridFilters: { [key: string]: { [key: string]: string } };
}

export interface SearchConfigEntry<TParams, TResult> {
  loader: (params: TParams) => Promise<TResult[]>;
  params: TParams;
  key: string;
  uniqueMetrcGridId: UniqueMetrcGridId;
}

interface QueryParams {
  queryString: string;
}

export interface PackageSearchParams extends QueryParams {
  packageState: PackageState;
}
export interface TransferredPackageSearchParams extends QueryParams {}

export interface PlantSearchParams extends QueryParams {
  plantState: PlantState;
}

export interface TransferSearchParams extends QueryParams {
  transferState: TransferState;
}

export interface TagSearchParams extends QueryParams {
  tagState: TagState;
}

export interface HarvestSearchParams extends QueryParams {
  harvestState: HarvestState;
}

export interface SalesReceiptSearchParams extends QueryParams {
  salesReceiptState: SalesReceiptState;
}

export interface PlantBatchSearchParams extends QueryParams {
  plantBatchState: PlantBatchState;
}

export interface ItemSearchParams extends QueryParams {
  itemState: ItemState;
}

export interface StrainSearchParams extends QueryParams {
  strainState: StrainState;
}
