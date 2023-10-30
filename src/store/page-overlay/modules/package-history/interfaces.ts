import {
  IPackageAncestorTreeNode,
  IPackageChildTreeNode,
  IPackageData,
  IPackageSourceHarvestData,
} from '@/interfaces';
import { PackageHistoryStatus } from './consts';

export interface IPackageHistoryState {
  status: PackageHistoryStatus;
  sourcePackage: IPackageData | null;
  ancestorTree: IPackageAncestorTreeNode | null;
  childTree: IPackageChildTreeNode | null;
  sourceHarvests: IPackageSourceHarvestData[];
  maxParentLookupDepth: number | null;
  maxChildLookupDepth: number | null;
  maxParentVisibleDepth: number;
  maxChildVisibleDepth: number;
  showUnownedPackages: boolean;
  parentZoom: number;
  childZoom: number;
  log: string[];
}
