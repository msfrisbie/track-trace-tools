import { IIndexedTransferData, ITransferSearchFilters } from "@/interfaces";

export interface ISelectedTransferMetadata {
  transferData: IIndexedTransferData;
  sectionName: string;
  priority: number;
}


export interface ITransferSearchState {
  searchInflight: boolean;
  transferSearchFilters: ITransferSearchFilters;
  transfers: IIndexedTransferData[];
  selectedTransferMetadata: ISelectedTransferMetadata | null;
}
