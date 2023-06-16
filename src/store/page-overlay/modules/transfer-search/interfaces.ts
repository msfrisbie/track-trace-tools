import { IIndexedTransferData, ITransferSearchFilters } from "@/interfaces";

export interface ITransferSearchState {
  transferSearchFilters: ITransferSearchFilters;
  transfers: IIndexedTransferData[];
  selectedTransfer: IIndexedTransferData | null;
}
