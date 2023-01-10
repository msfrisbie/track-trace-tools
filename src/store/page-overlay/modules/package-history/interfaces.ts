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
  ancestorTree: IPackageAncestorTreeNode | null;
  childTree: IPackageChildTreeNode | null;
  sourceHarvests: IHarvestHistoryData[];
  maxLookupDepth: number | null;
  log: string[];
}
