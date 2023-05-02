import { ITransferSearchFilters } from "@/interfaces";

export interface ITransferSearchState {
  expandSearchOnNextLoad: boolean;
  transferQueryString: string;
  transferQueryStringHistory: string[];
  transferSearchFilters: ITransferSearchFilters;
  showTransferSearchResults: boolean;
}
