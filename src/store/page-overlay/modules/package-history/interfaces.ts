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
  maxParentLookupDepth: number | null;
  maxChildLookupDepth: number | null;
  maxParentVisibleDepth: number;
  maxChildVisibleDepth: number;
  showUnownedPackages: boolean;
  parentZoom: number;
  childZoom: number;
  log: string[];
}
