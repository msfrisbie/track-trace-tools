import { IIndexedPackageData, IIndexedPlantBatchData, IIndexedPlantData, IIndexedSalesReceiptData, IIndexedTagData, IIndexedTransferData, IIndexedTransferredPackageData, IItemData, ISalesReceiptData, IStrainData } from '@/interfaces';
import { SearchType } from './consts';

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
  searchInflight: boolean;
  queryString: string;
  queryLicenseNumber: string;
  queryStringHistory: string[];
  modalSearchOpen: boolean;
  searchResults: ISearchResult[];
  activeSearchResult: ISearchResult | null;
}
