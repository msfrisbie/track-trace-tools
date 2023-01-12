import {
  IHarvestHistoryData,
  IPackageChildTreeNode,
  IPackageData,
  IPackageParentTree,
} from "@/interfaces";
import { PackageHistoryStatus } from "./consts";

export interface IPackageHistoryState {
  status: PackageHistoryStatus;
  sourcePackage: IPackageData | null;
  parentTree: IPackageParentTree | null;
  childTree: IPackageChildTreeNode | null;
  sourceHarvests: IHarvestHistoryData[];
  maxLookupDepth: number | null;
  log: string[];
}
