import { HistoryTreeNodeType, PackageFilterIdentifiers, PackageState } from "@/consts";
import {
  IChildPackageTree,
  IChildPackageTreeNode,
  IHarvestHistoryData,
  IIndexedPackageData,
  IPackageData,
  IPackageHistoryData,
  IParentPackageTree,
  IParentPackageTreeNode,
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

interface IRootParentHistoryContext {
  tree: IParentPackageTree;
  licenseCache: LRU<string>;
  packageStateCache: LRU<PackageState>;
}

export async function getParentPackageHistoryTree({
  label,
  callback,
}: {
  label: string;
  callback: (node: IParentPackageTree) => void;
}): Promise<IParentPackageTree> {
  const tree: IParentPackageTree = {};
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber
  );
  const licenseCache: LRU<string> = new LRU(ownedLicenses);
  const packageStateCache: LRU<PackageState> = new LRU([
    PackageState.ACTIVE,
    PackageState.INACTIVE,
    PackageState.IN_TRANSIT,
  ]);
  licenseCache.touch((await authManager.authStateOrError()).license);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `License cache: ${licenseCache.elements.join(",\n")}`,
  });

  const rootContext: IRootParentHistoryContext = {
    tree,
    licenseCache,
    packageStateCache,
  };

  const rootNode: IParentPackageTreeNode | null = await getParentPackageTreeNodeOrNull(
    label,
    rootContext
  );

  if (!rootNode) {
    throw new Error("Root node is null");
  }

  const stack: [IParentPackageTreeNode, number][] = [[rootNode, 0]];
  let loopCount = 0;

  while (stack.length > 0) {
    if (loopCount++ > 5000) {
      throw new Error("Detected infinite loop");
    }

    const [currentNode, depth] = stack.shift() as [IParentPackageTreeNode, number];

    if (
      store.state.packageHistory.maxLookupDepth !== null &&
      depth > store.state.packageHistory.maxLookupDepth
    ) {
      store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
        event: `${label} is at max lookup depth (${store.state.packageHistory.maxLookupDepth})`,
      });
      continue;
    }

    for (const parentPackageLabel of currentNode.parentLabels) {
      if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
        store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
          event: `Status: ${store.state.packageHistory.status}, exiting`,
        });
        break;
      }

      if (rootContext.tree.hasOwnProperty(parentPackageLabel)) {
        continue;
      }

      await getParentPackageTreeNodeOrNull(parentPackageLabel, rootContext).then((node) => {
        if (node !== null) {
          stack.push([node, depth + 1]);
        }

        callback(rootContext.tree);
      });
    }
  }

  callback(rootContext.tree);

  return rootContext.tree;
}

export async function getParentPackageTreeNodeOrNull(
  label: string,
  rootContext: IRootParentHistoryContext
): Promise<IParentPackageTreeNode | null> {
  if (rootContext.tree.hasOwnProperty(label)) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Cache hit for ${label}`,
    });
    return rootContext.tree[label] as IParentPackageTreeNode;
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
            pkg = await dataLoader.inTransitPackage(label);
          } catch (e) {}
          break;
        default:
          throw new Error("Invalid package state: " + packageState);
      }

      if (pkg) {
        rootContext.packageStateCache.touch(pkg.PackageState);
      }
    }

    if (pkg) {
      rootContext.licenseCache.touch(pkg.LicenseNumber);
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
    rootContext.tree[label] = null;
    return null;
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Found ${pkg.Label} (${pkg.PackageState})`,
  });

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  const parentLabels = extractParentPackageLabelsFromHistory(history);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `${pkg.Label} has ${parentLabels.length} parents`,
  });

  const node: IParentPackageTreeNode = {
    type: HistoryTreeNodeType.OWNED_PACKAGE,
    label,
    pkg,
    history,
    parentLabels,
  };

  rootContext.tree[label] = node;

  return node;
}

interface IRootChildHistoryContext {
  tree: IChildPackageTree;
  licenseCache: LRU<string>;
  packageStateCache: LRU<PackageState>;
}

export async function getChildPackageHistoryTree({
  label,
  callback,
}: {
  label: string;
  callback: (node: IChildPackageTree) => void;
}): Promise<IChildPackageTree> {
  const tree: IChildPackageTree = {};
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber
  );
  const licenseCache: LRU<string> = new LRU(ownedLicenses);
  const packageStateCache: LRU<PackageState> = new LRU([
    PackageState.ACTIVE,
    PackageState.INACTIVE,
    PackageState.IN_TRANSIT,
  ]);
  licenseCache.touch((await authManager.authStateOrError()).license);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `License cache: ${licenseCache.elements.join(",\n")}`,
  });

  const rootContext: IRootChildHistoryContext = {
    tree,
    licenseCache,
    packageStateCache,
  };

  const rootNode: IChildPackageTreeNode | null = await getChildPackageTreeNodeOrNull(
    label,
    rootContext
  );

  if (!rootNode) {
    throw new Error("Root node is null");
  }

  const stack: [IChildPackageTreeNode, number][] = [[rootNode, 0]];
  let loopCount = 0;

  while (stack.length > 0) {
    if (loopCount++ > 5000) {
      throw new Error("Detected infinite loop");
    }

    const [currentNode, depth] = stack.shift() as [IChildPackageTreeNode, number];

    if (
      store.state.packageHistory.maxLookupDepth !== null &&
      depth > store.state.packageHistory.maxLookupDepth
    ) {
      store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
        event: `${label} is at max lookup depth (${store.state.packageHistory.maxLookupDepth})`,
      });
      continue;
    }

    for (const childPackageLabel of currentNode.childLabels) {
      if (store.state.packageHistory.status !== PackageHistoryStatus.INFLIGHT) {
        store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
          event: `Status: ${store.state.packageHistory.status}, exiting`,
        });
        break;
      }

      if (rootContext.tree.hasOwnProperty(childPackageLabel)) {
        continue;
      }

      await getChildPackageTreeNodeOrNull(childPackageLabel, rootContext).then((node) => {
        if (node !== null) {
          stack.push([node, depth + 1]);
        }

        callback(rootContext.tree);
      });
    }
  }

  callback(rootContext.tree);

  return rootContext.tree;
}

export async function getChildPackageTreeNodeOrNull(
  label: string,
  rootContext: IRootChildHistoryContext
): Promise<IChildPackageTreeNode | null> {
  if (rootContext.tree.hasOwnProperty(label)) {
    store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
      event: `Cache hit for ${label}`,
    });
    return rootContext.tree[label] as IChildPackageTreeNode;
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
            pkg = await dataLoader.inTransitPackage(label);
          } catch (e) {}
          break;
        default:
          throw new Error("Invalid package state: " + packageState);
      }

      if (pkg) {
        rootContext.packageStateCache.touch(pkg.PackageState);
      }
    }

    if (pkg) {
      rootContext.licenseCache.touch(pkg.LicenseNumber);
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
    rootContext.tree[label] = null;
    return null;
  }

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `Found ${pkg.Label} (${pkg.PackageState})`,
  });

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  const childLabels = extractChildPackageLabelsFromHistory(history);

  store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
    event: `${pkg.Label} has ${childLabels.length} children`,
  });

  const node: IChildPackageTreeNode = {
    type: HistoryTreeNodeType.OWNED_PACKAGE,
    label,
    pkg,
    history,
    childLabels,
  };

  rootContext.tree[label] = node;

  return node;
}

export async function getParentHarvests(label: string): Promise<IHarvestHistoryData[]> {
  let pkg: IIndexedPackageData | null = null;
  try {
    pkg = await primaryDataLoader.activePackage(label);
  } catch {}
  try {
    pkg = await primaryDataLoader.inactivePackage(label);
  } catch {}
  try {
    pkg = await primaryDataLoader.inTransitPackage(label);
  } catch {}

  if (!pkg) {
    throw new Error("Package not found");
  }

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

// export async function getParentHarvestsDeprecated(
//   pkg: IPackageData
// ): Promise<IIndexedHarvestData[]> {
//   store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
//     event: `Finding parent harvests for ${pkg.Label}`,
//   });

//   const parentHarvestNames = pkg.SourceHarvestNames.split(",")
//     .map((x) => x.trim())
//     .filter((x) => !!x);

//   const matches: IIndexedHarvestData[] = [];

//   if (!parentHarvestNames) {
//     store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
//       event: `${pkg.Label} has no parent harvests`,
//     });
//   } else {
//     store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
//       event: `Source harvest names: ${parentHarvestNames.join(",")}`,
//     });

//     for (const harvestName of parentHarvestNames) {
//       try {
//         matches.push(await primaryDataLoader.activeHarvestByName(harvestName));
//       } catch (e) {}
//       try {
//         matches.push(await primaryDataLoader.inactiveHarvestByName(harvestName));
//       } catch (e) {}
//     }
//   }

//   store.dispatch(`packageHistory/${PackageHistoryActions.LOG_EVENT}`, {
//     event: `Matched ${matches.length} parent harvests`,
//   });

//   return matches;
// }

// export async function getChildPackagesDeprecated(
//   pkg: IPackageData
// ): Promise<IIndexedPackageData[]> {
//   const matches = [];

//   for (const x of await primaryDataLoader.onDemandActivePackageSearch({ queryString: pkg.Label })) {
//     matches.push(x);
//   }
//   for (const x of await primaryDataLoader.onDemandInactivePackageSearch({
//     queryString: pkg.Label,
//   })) {
//     matches.push(x);
//   }
//   for (const x of await primaryDataLoader.onDemandInTransitPackageSearch({
//     queryString: pkg.Label,
//   })) {
//     matches.push(x);
//   }

//   return matches.filter((x) => pkg.SourcePackageLabels.includes(pkg.Label));
// }
