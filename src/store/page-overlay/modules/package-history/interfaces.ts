import { IPackageData } from "@/interfaces";

export interface IPackageHistoryState {
  sourcePackage: IPackageData | null;
  ancestors: IPackageData[][];
  children: IPackageData[][];
}
