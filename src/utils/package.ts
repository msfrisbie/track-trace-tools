import { HistoryTreeNodeType, PackageFilterIdentifiers } from "@/consts";
import {
  IHarvestHistoryData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IPackageAncestorTreeNode,
  IPackageChildTreeNode,
  IPackageData,
  IPackageHistoryData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import {
  DataLoader,
  getDataLoader,
  primaryDataLoader,
} from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import {
  PackageHistoryActions,
  PackageHistoryStatus,
} from "@/store/page-overlay/modules/package-history/consts";
import { LRU } from "./cache";
import { downloadFileFromUrl } from "./dom";
import {
  extractChildPackageLabelsFromHistory,
  extractParentPackageLabelsFromHistory,
} from "./history";

export async function getLabTestUrlsFromPackage({
  pkg,
  showZeroResultsError = true,
}: {
  pkg: IPackageData;
  showZeroResultsError?: boolean;
}): Promise<string[]> {
  const authState = await authManager.authStateOrError();

  const testResults = await primaryDataLoader.testResultsByPackageId(pkg.Id);

  let fileIds = new Set<number>();

  for (let testResult of testResults) {
    if (testResult.LabTestResultDocumentFileId) {
      fileIds.add(testResult.LabTestResultDocumentFileId);
    }
  }

  if (fileIds.size == 0 && showZeroResultsError) {
    setTimeout(() => {
      toastManager.openToast(`Metrc did not return any lab PDFs for this package.`, {
        title: "Missing Lab Results",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    }, 500);

    return [];
  }

  return [...fileIds].map(
    (fileId) =>
      `${window.location.origin}/filesystem/${authState.license}/download/labtest/result/document?packageId=${pkg.Id}&labTestResultDocumentFileId=${fileId}`
  );

  // for (let fileId of fileIds) {
  //     const url = ;

  //     console.log(url);

  //     downloadFileFromUrl({ url, filename: `${pkg.Label}.pdf` });
  // }
}

export async function downloadLabTests({ pkg }: { pkg: IPackageData }) {
  const fileUrls = await getLabTestUrlsFromPackage({ pkg });

  for (let url of fileUrls) {
    console.log(url);

    downloadFileFromUrl({ url, filename: `${pkg.Label}.pdf` });
  }

  // const authState = await authManager.authStateOrError();

  // const testResults = await primaryDataLoader.testResultsByPackageId(pkg.Id);

  // let fileIds = new Set<number>();

  // for (let testResult of testResults) {
  //     if (testResult.LabTestResultDocumentFileId) {
  //         fileIds.add(testResult.LabTestResultDocumentFileId);
  //     }
  // }

  // if (fileIds.size == 0) {
  //     setTimeout(() => {
  //         toastManager.openToast(
  //             `Metrc did not return any lab PDFs for this package.`,
  //             {
  //                 title: "Missing Lab Results",
  //                 autoHideDelay: 5000,
  //                 variant: "danger",
  //                 appendToast: true,
  //                 toaster: "ttt-toaster",
  //                 solid: true,
  //             }
  //         );
  //     }, 500);

  //     return;
  // }

  // for (let fileId of fileIds) {
  //     const url = `${window.location.origin}/filesystem/${authState.license}/download/labtest/result/document?packageId=${pkg.Id}&labTestResultDocumentFileId=${fileId}`;

  //     console.log(url);

  //     downloadFileFromUrl({ url, filename: `${pkg.Label}.pdf` });
  // }
}

// Assume a single match, return an array of length 3
//
// 'foo', '
//
// []
function splitSearchResultMatch(queryString: string, text: string): string[] | null {
  return null;
}

export function packageFieldMatch(
  queryString: string,
  pkg: IPackageData,
  packageFilterIdentifier: PackageFilterIdentifiers
): string[] | null {
  return null;
}

export async function getParentPackageHistoryTree({
  label,
}: {
  label: string;
}): Promise<IPackageAncestorTreeNode> {
  const treeNodeCache: Map<string, IPackageAncestorTreeNode> = new Map();
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber
  );
  const licenseCache: LRU<string> = new LRU(ownedLicenses);
  licenseCache.touch((await authManager.authStateOrError()).license);

  return getParentPackageHistoryTreeImpl({
    label,
    treeNodeCache,
    licenseCache,
  });
}

export async function getParentPackageHistoryTreeImpl({
  label,
  treeNodeCache,
  licenseCache,
}: {
  label: string;
  treeNodeCache: Map<string, IPackageAncestorTreeNode>;
  licenseCache: LRU<string>;
}): Promise<IPackageAncestorTreeNode> {
  if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
    throw new Error(`Status: ${store.state.packageHistory.status}, exiting`);
  }

  if (treeNodeCache.has(label)) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Cache hit for ${label}`,
    });
    return treeNodeCache.get(label) as IPackageAncestorTreeNode;
  }

  let pkg: IIndexedPackageData | null = null;
  let dataLoader: DataLoader | null = null;

  for (const license of licenseCache.elements) {
    const authState = {
      ...(await authManager.authStateOrError()),
      license,
    };

    dataLoader = await getDataLoader(authState);

    try {
      pkg = await dataLoader.activePackage(label);
    } catch (e) {}
    if (!pkg) {
      try {
        pkg = await dataLoader.inactivePackage(label);
      } catch (e) {}
    }
    if (!pkg) {
      try {
        pkg = await dataLoader.inTransitPackage(label);
      } catch (e) {}
    }

    if (pkg) {
      licenseCache.touch(pkg.LicenseNumber);
      break;
    }
  }

  if (!dataLoader) {
    throw new Error("Data loader not assigned, exiting");
  }

  if (!pkg) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `User does not have access to ${label}, is a terminal node`,
    });
    const node: IPackageAncestorTreeNode = {
      type: HistoryTreeNodeType.UNOWNED_PACKAGE,
      label,
      pkg: { Label: "STUB_PACKAGE" } as IIndexedPackageData,
      history: [],
      ancestors: [],
    };
    treeNodeCache.set(label, node);
    return node;
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Found ${pkg.Label} (${pkg.PackageState})`,
  });

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  const parentPackageLabels = extractParentPackageLabelsFromHistory(history);

  const parents: IPackageAncestorTreeNode[] = [];

  for (const parentPackageLabel of parentPackageLabels) {
    if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
      throw new Error(`Status: ${store.state.packageHistory.status}, exiting`);
    }

    const node = await getParentPackageHistoryTreeImpl({
      label: parentPackageLabel,
      treeNodeCache,
      licenseCache,
    });

    parents.push(node);

    treeNodeCache.set(label, node);
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `${pkg.Label} has ${parents.length} parents`,
  });

  const node: IPackageAncestorTreeNode = {
    type: HistoryTreeNodeType.OWNED_PACKAGE,
    label,
    pkg,
    history,
    ancestors: parents,
  };

  treeNodeCache.set(label, node);

  return node;
}

export async function getChildPackageHistoryTree({
  label,
}: {
  label: string;
}): Promise<IPackageChildTreeNode> {
  const treeNodeCache: Map<string, IPackageChildTreeNode> = new Map();
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber
  );
  const licenseCache: LRU<string> = new LRU(ownedLicenses);
  licenseCache.touch((await authManager.authStateOrError()).license);

  return getChildPackageHistoryTreeImpl({
    label,
    treeNodeCache,
    licenseCache,
  });
}

export async function getChildPackageHistoryTreeImpl({
  label,
  treeNodeCache,
  licenseCache,
}: {
  label: string;
  treeNodeCache: Map<string, IPackageChildTreeNode>;
  licenseCache: LRU<string>;
}): Promise<IPackageChildTreeNode> {
  if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
    throw new Error(`Status: ${store.state.packageHistory.status}, exiting`);
  }

  if (treeNodeCache.has(label)) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Cache hit for ${label}`,
    });
    return treeNodeCache.get(label) as IPackageChildTreeNode;
  }

  let pkg: IIndexedPackageData | null = null;
  let dataLoader: DataLoader | null = null;

  for (const license of licenseCache.elements) {
    const authState = {
      ...(await authManager.authStateOrError()),
      license,
    };

    dataLoader = await getDataLoader(authState);

    try {
      pkg = await dataLoader.activePackage(label);
    } catch (e) {}
    if (!pkg) {
      try {
        pkg = await dataLoader.inactivePackage(label);
      } catch (e) {}
    }
    if (!pkg) {
      try {
        pkg = await dataLoader.inTransitPackage(label);
      } catch (e) {}
    }

    if (pkg) {
      licenseCache.touch(pkg.LicenseNumber);
      break;
    }
  }

  if (!dataLoader) {
    throw new Error("Data loader not assigned, exiting");
  }

  if (!pkg) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `User does not have access to ${label}, is a terminal node`,
    });
    const node: IPackageChildTreeNode = {
      type: HistoryTreeNodeType.UNOWNED_PACKAGE,
      label,
      pkg: { Label: "STUB_PACKAGE" } as IIndexedPackageData,
      history: [],
      children: [],
    };
    treeNodeCache.set(label, node);
    return node;
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Found ${pkg.Label} (${pkg.PackageState})`,
  });

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  const childPackageLabels = extractChildPackageLabelsFromHistory(history);

  const children: IPackageChildTreeNode[] = [];

  for (const childPackageLabel of childPackageLabels) {
    if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
      throw new Error(`Status: ${store.state.packageHistory.status}, exiting`);
    }

    const node = await getChildPackageHistoryTreeImpl({
      label: childPackageLabel,
      treeNodeCache,
      licenseCache
    });

    children.push();

    treeNodeCache.set(label, node);
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `${pkg.Label} has ${children.length} children`,
  });

  return {
    type: HistoryTreeNodeType.OWNED_PACKAGE,
    label,
    pkg,
    history,
    children,
  };
}

export async function getParentHarvests(label: string): Promise<IHarvestHistoryData[]> {
  // TODO search every available facility
  // TODO search active, inactive
  const pkg = await primaryDataLoader.activePackage(label);

  const history: IHarvestHistoryData[] = await primaryDataLoader.packageHarvestHistoryByPackageId(
    pkg.Id
  );

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Retrieved ${history.length} source harvests`,
  });

  return history;
}

export async function getParentPackagesDeprecated(
  pkg: IPackageData
): Promise<IIndexedPackageData[]> {
  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Finding parent packages for ${pkg.Label}`,
  });

  const parentPackageLabels = pkg.SourcePackageLabels.split(",")
    .map((x) => x.trim())
    .filter((x) => !!x);

  const matches: IIndexedPackageData[] = [];

  if (!parentPackageLabels) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `${pkg.Label} has no parent packages`,
    });
  } else {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Source package labels: ${parentPackageLabels.join(",")}`,
    });

    for (const label of parentPackageLabels) {
      try {
        matches.push(await primaryDataLoader.activePackage(label));
      } catch (e) {}
      try {
        matches.push(await primaryDataLoader.inactivePackage(label));
      } catch (e) {}
      try {
        matches.push(await primaryDataLoader.inTransitPackage(label));
      } catch (e) {}
    }
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Matched ${matches.length} parent packages`,
  });

  return matches;
}

export async function getParentHarvestsDeprecated(
  pkg: IPackageData
): Promise<IIndexedHarvestData[]> {
  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Finding parent harvests for ${pkg.Label}`,
  });

  const parentHarvestNames = pkg.SourceHarvestNames.split(",")
    .map((x) => x.trim())
    .filter((x) => !!x);

  const matches: IIndexedHarvestData[] = [];

  if (!parentHarvestNames) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `${pkg.Label} has no parent harvests`,
    });
  } else {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Source harvest names: ${parentHarvestNames.join(",")}`,
    });

    for (const harvestName of parentHarvestNames) {
      try {
        matches.push(await primaryDataLoader.activeHarvestByName(harvestName));
      } catch (e) {}
      try {
        matches.push(await primaryDataLoader.inactiveHarvestByName(harvestName));
      } catch (e) {}
    }
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Matched ${matches.length} parent harvests`,
  });

  return matches;
}

export async function getChildPackagesDeprecated(
  pkg: IPackageData
): Promise<IIndexedPackageData[]> {
  const matches = [];

  for (const x of await primaryDataLoader.onDemandActivePackageSearch({ queryString: pkg.Label })) {
    matches.push(x);
  }
  for (const x of await primaryDataLoader.onDemandInactivePackageSearch({
    queryString: pkg.Label,
  })) {
    matches.push(x);
  }
  for (const x of await primaryDataLoader.onDemandInTransitPackageSearch({
    queryString: pkg.Label,
  })) {
    matches.push(x);
  }

  return matches.filter((x) => pkg.SourcePackageLabels.includes(pkg.Label));
}
