import {
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedTransferData,
  IPackageData,
} from "@/interfaces";
import { PackageHistoryStatus } from "./consts";

interface IPackageHistoryEntry {
  pkg?: IIndexedPackageData;
  harvest?: IIndexedHarvestData;
  transfer?: IIndexedTransferData;
}

export interface IPackageHistoryState {
  status: PackageHistoryStatus;
  sourcePackage: IPackageData | null;
  ancestors: IPackageHistoryEntry[][];
  children: IPackageHistoryEntry[][];
  log: string[];
}
