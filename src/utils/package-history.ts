import { HistoryTreeNodeType, PackageState } from '@/consts';
import {
  IIndexedPackageData,
  IPackageAncestorTreeNode,
  IPackageChildTreeNode,
  IPackageHistoryData,
  IPackageSourceHarvestData,
  IStrippedIndexedPackage,
} from '@/interfaces';
import { authManager } from '@/modules/auth-manager.module';
import {
  DataLoader,
  getDataLoader,
  primaryDataLoader,
} from '@/modules/data-loader/data-loader.module';
import { facilityManager } from '@/modules/facility-manager.module';
import store from '@/store/page-overlay/index';
import {
  PackageHistoryActions,
  PackageHistoryStatus,
} from '@/store/page-overlay/modules/package-history/consts';
import { LRU } from './cache';
import {
  extractChildPackageLabelsFromHistory,
  extractParentPackageLabelsFromHistory,
} from './history';

interface IRootAncestorHistoryContext {
  treeNodeCache: Map<string, IPackageAncestorTreeNode>;
  licenseCache: LRU<string>;
  packageStateCache: LRU<PackageState>;
}

export async function getParentPackageHistoryTree({
  label,
}: {
  label: string;
}): Promise<IPackageAncestorTreeNode> {
  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Fetching parent history for ${label}`,
  });

  const treeNodeCache: Map<string, IPackageAncestorTreeNode> = new Map();
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber,
  );
  const licenseCache: LRU<string> = new LRU(ownedLicenses);
  const packageStateCache: LRU<PackageState> = new LRU([
    PackageState.ACTIVE,
    PackageState.INACTIVE,
    PackageState.IN_TRANSIT,
  ]);
  licenseCache.touch((await authManager.authStateOrError()).license);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `License cache: ${licenseCache.elements.join(',\n')}`,
  });

  const rootContext: IRootAncestorHistoryContext = {
    treeNodeCache,
    licenseCache,
    packageStateCache,
  };

  return getParentPackageHistoryTreeImpl({
    label,
    rootContext,
    depth: 0,
  });
}

export async function getParentPackageHistoryTreeImpl({
  label,
  rootContext,
  depth,
}: {
  label: string;
  rootContext: IRootAncestorHistoryContext;
  depth: number;
}): Promise<IPackageAncestorTreeNode> {
  if (rootContext.treeNodeCache.has(label)) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Parent cache hit for ${label}`,
    });
    return rootContext.treeNodeCache.get(label) as IPackageAncestorTreeNode;
  }

  let pkg: IIndexedPackageData | null = null;
  let dataLoader: DataLoader | null = null;

  for (const license of rootContext.licenseCache.elements) {
    const authState = {
      ...(await authManager.authStateOrError()),
      license,
    };

    dataLoader = await getDataLoader(authState);

    for (const packageState of rootContext.packageStateCache.elements) {
      switch (packageState) {
        case PackageState.ACTIVE:
          try {
            pkg = await dataLoader.activePackage(label);
          } catch (e) {}
          break;
        case PackageState.INACTIVE:
          try {
            pkg = await dataLoader.inactivePackage(label);
          } catch (e) {}
          break;
        case PackageState.IN_TRANSIT:
          try {
            pkg = await dataLoader.inTransitPackage(label, { useCache: false });
          } catch (e) {}
          break;
        default:
          throw new Error(`Invalid package state: ${packageState}`);
      }

      if (pkg) {
        rootContext.packageStateCache.touch(pkg.PackageState);
        break;
      }
    }

    if (pkg) {
      rootContext.licenseCache.touch(pkg.LicenseNumber);
      break;
    }
  }

  if (!dataLoader) {
    throw new Error('Data loader not assigned, exiting');
  }

  if (!pkg) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `User does not have access to ${label}, is a terminal parent node`,
    });
    const node: IPackageAncestorTreeNode = {
      type: HistoryTreeNodeType.UNOWNED_PACKAGE,
      relationship: 'PARENT',
      label,
      pkg: { Label: 'STUB_PACKAGE' } as IStrippedIndexedPackage,
      ancestors: [],
    };
    rootContext.treeNodeCache.set(label, node);
    return node;
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Found ${pkg.Label} (${pkg.PackageState})`,
  });

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  const parentPackageLabels = extractParentPackageLabelsFromHistory(history);

  const parents: IPackageAncestorTreeNode[] = [];

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Parents: ${parentPackageLabels.join(',') || 'none'}`,
  });

  if (
    store.state.packageHistory.maxParentLookupDepth === null
    || depth <= store.state.packageHistory.maxParentLookupDepth
  ) {
    for (const parentPackageLabel of parentPackageLabels) {
      if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
        store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
          event: `Status: ${store.state.packageHistory.status}, exiting`,
        });
        break;
      }

      const node = await getParentPackageHistoryTreeImpl({
        label: parentPackageLabel,
        rootContext,
        depth: depth + 1,
      });

      parents.push(node);

      rootContext.treeNodeCache.set(label, node);
    }

    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `${pkg.Label} has ${parents.length} parents`,
    });
  } else {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `${label} is at max lookup depth (${store.state.packageHistory.maxParentLookupDepth})`,
    });
  }

  const node: IPackageAncestorTreeNode = {
    type: HistoryTreeNodeType.OWNED_PACKAGE,
    relationship: 'PARENT',
    label,
    pkg: stripPackage(pkg),
    // history,
    ancestors: parents,
  };

  rootContext.treeNodeCache.set(label, node);

  return node;
}

interface IRootChildPackageHistoryContext {
  treeNodeCache: Map<string, IPackageChildTreeNode>;
  licenseCache: LRU<string>;
  packageStateCache: LRU<PackageState>;
}

export async function getChildPackageHistoryTree({
  label,
}: {
  label: string;
}): Promise<IPackageChildTreeNode> {
  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Fetching child history for ${label}`,
  });

  const treeNodeCache: Map<string, IPackageChildTreeNode> = new Map();
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber,
  );
  const licenseCache: LRU<string> = new LRU(ownedLicenses);
  const packageStateCache: LRU<PackageState> = new LRU([
    PackageState.ACTIVE,
    PackageState.INACTIVE,
    PackageState.IN_TRANSIT,
  ]);
  licenseCache.touch((await authManager.authStateOrError()).license);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `License cache: ${licenseCache.elements.join(',\n')}`,
  });

  const rootContext: IRootChildPackageHistoryContext = {
    treeNodeCache,
    licenseCache,
    packageStateCache,
  };

  return getChildPackageHistoryTreeImpl({
    label,
    rootContext,
    depth: 0,
  });
}

export async function getChildPackageHistoryTreeImpl({
  label,
  rootContext,
  depth,
}: {
  label: string;
  rootContext: IRootChildPackageHistoryContext;
  depth: number;
}): Promise<IPackageChildTreeNode> {
  if (rootContext.treeNodeCache.has(label)) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Child cache hit for ${label}`,
    });
    return rootContext.treeNodeCache.get(label) as IPackageChildTreeNode;
  }

  let pkg: IIndexedPackageData | null = null;
  let dataLoader: DataLoader | null = null;

  for (const license of rootContext.licenseCache.elements) {
    const authState = {
      ...(await authManager.authStateOrError()),
      license,
    };

    dataLoader = await getDataLoader(authState);

    for (const packageState of rootContext.packageStateCache.elements) {
      switch (packageState) {
        case PackageState.ACTIVE:
          try {
            pkg = await dataLoader.activePackage(label);
          } catch (e) {}
          break;
        case PackageState.INACTIVE:
          try {
            pkg = await dataLoader.inactivePackage(label);
          } catch (e) {}
          break;
        case PackageState.IN_TRANSIT:
          try {
            pkg = await dataLoader.inTransitPackage(label, { useCache: false });
          } catch (e) {}
          break;
        default:
          throw new Error(`Invalid package state: ${packageState}`);
      }

      if (pkg) {
        rootContext.packageStateCache.touch(pkg.PackageState);
        break;
      }
    }

    if (pkg) {
      rootContext.licenseCache.touch(pkg.LicenseNumber);
      break;
    }
  }

  if (!dataLoader) {
    throw new Error('Data loader not assigned, exiting');
  }

  if (!pkg) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `User does not have access to ${label}, is a terminal child node`,
    });
    const node: IPackageChildTreeNode = {
      type: HistoryTreeNodeType.UNOWNED_PACKAGE,
      relationship: 'CHILD',
      label,
      pkg: { Label: 'STUB_PACKAGE' } as IStrippedIndexedPackage,
      children: [],
    };
    rootContext.treeNodeCache.set(label, node);
    return node;
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Found ${pkg.Label} (${pkg.PackageState})`,
  });

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  // Must use history for this. Inverting the search for "SourcePackageLabels"
  // won't work because this would require searching N licenses
  const childPackageLabels = extractChildPackageLabelsFromHistory(history);

  const children: IPackageChildTreeNode[] = [];

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Children: ${childPackageLabels.join(',') || 'none'}`,
  });

  if (
    store.state.packageHistory.maxChildLookupDepth === null
    || depth <= store.state.packageHistory.maxChildLookupDepth
  ) {
    for (const childPackageLabel of childPackageLabels) {
      if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
        store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
          event: `Status: ${store.state.packageHistory.status}, exiting`,
        });
        break;
      }

      const node = await getChildPackageHistoryTreeImpl({
        label: childPackageLabel,
        rootContext,
        depth: depth + 1,
      });

      children.push(node);

      rootContext.treeNodeCache.set(label, node);
    }

    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `${pkg.Label} has ${children.length} children`,
    });
  } else {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `${label} is at max lookup depth (${store.state.packageHistory.maxChildLookupDepth})`,
    });
  }

  const node: IPackageChildTreeNode = {
    type: HistoryTreeNodeType.OWNED_PACKAGE,
    relationship: 'CHILD',
    label,
    pkg: stripPackage(pkg),
    children,
  };

  rootContext.treeNodeCache.set(label, node);

  return node;
}

export async function getParentHarvests(label: string): Promise<IPackageSourceHarvestData[]> {
  const pkg = await primaryDataLoader.activePackage(label);

  const harvestHistory: IPackageSourceHarvestData[] = await primaryDataLoader.packageHarvestHistoryByPackageId(pkg.Id);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Retrieved ${harvestHistory.length} source harvests`,
  });

  return harvestHistory;
}

export function stripPackage(pkg: IIndexedPackageData): IStrippedIndexedPackage {
  return {
    PackageState: pkg.PackageState,
    Label: pkg.Label,
    LicenseNumber: pkg.LicenseNumber,
    ProductionBatchNumber: pkg.ProductionBatchNumber,
    Quantity: pkg.Quantity,
    ItemName: pkg.Item.Name,
    PackagedByFacilityLicenseNumber: pkg.PackagedByFacilityLicenseNumber,
    ReceivedFromFacilityLicenseNumber: pkg.ReceivedFromFacilityLicenseNumber || '',
    UnitOfMeasureAbbreviation: pkg.UnitOfMeasureAbbreviation,
    SourcePackageLabels: pkg.SourcePackageLabels,
  };
}
