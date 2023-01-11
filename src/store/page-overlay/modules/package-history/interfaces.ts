import {
  IHarvestHistoryData,
  IPackageAncestorTreeNode,
  IPackageChildTreeNode,
  IPackageData,
} from "@/interfaces";
import { PackageHistoryStatus } from "./consts";

export interface IPackageHistoryState {
  status: PackageHistoryStatus;
  sourcePackage: IPackageData | null;
  ancestorTree: { [key: string]: IPackageAncestorTreeNode } | null;
  childTree: { [key: string]: IPackageChildTreeNode } | null;
  sourceHarvests: IHarvestHistoryData[];
  maxLookupDepth: number | null;
  log: string[];
}
