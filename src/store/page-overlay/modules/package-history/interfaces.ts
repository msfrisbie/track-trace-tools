import {
  IChildPackageTree,
  IHarvestHistoryData,
  IPackageData,
  IParentPackageTree,
} from "@/interfaces";
import { PackageHistoryStatus } from "./consts";

export interface IPackageHistoryState {
  status: PackageHistoryStatus;
  sourcePackage: IPackageData | null;
  parentTree: IParentPackageTree | null;
  childTree: IChildPackageTree | null;
  sourceHarvests: IHarvestHistoryData[];
  maxLookupDepth: number | null;
  log: string[];
}
