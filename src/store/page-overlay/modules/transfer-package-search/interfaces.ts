import { IIndexedRichOutgoingTransferData } from "@/interfaces";
import { TransferPackageSearchAlgorithm, TransferPackageSearchState } from "./consts";

export interface ITransferPackageSearchState {
  startDate: string | null;
  algorithm: TransferPackageSearchAlgorithm;
  state: TransferPackageSearchState;
  results: IIndexedRichOutgoingTransferData[];
  abortController: AbortController;
  messages: { message: string; variant: "primary" | "error" | "warning"; timestamp: number }[];
}
