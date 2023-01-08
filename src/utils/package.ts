import { PackageFilterIdentifiers } from "@/consts";
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
import { PackageHistoryActions } from "@/store/page-overlay/modules/package-history/consts";
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
  license,
}: {
  label: string;
  license: string;
}): Promise<IPackageAncestorTreeNode> {
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber
  );
  console.log(ownedLicenses, license);

  if (!ownedLicenses.includes(license)) {
    // This license is not owned by the current user, exit with terminal node
    return {
      label,
      license,
      ancestors: [],
    };
  }

  const authState = { ...(await authManager.authStateOrError()), license };

  let dataLoader: DataLoader = await getDataLoader(authState);

  // TODO search every available facility
  // TODO search active, inactive
  let pkg: IIndexedPackageData | null = null;
  try {
    pkg = await dataLoader.activePackage(label);
  } catch (e) {}
  try {
    pkg = await dataLoader.inactivePackage(label);
  } catch (e) {}
  try {
    pkg = await dataLoader.inTransitPackage(label);
  } catch (e) {}

  if (!pkg) {
    throw new Error("Could not find package");
  }

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  // TODO: this license may not be correct
  // and must update when a transfer occurs
  const ancestors = await Promise.all(
    extractParentPackageLabelsFromHistory(history).map((parentLabel) =>
      getParentPackageHistoryTree({ label: parentLabel, license })
    )
  );

  return {
    label,
    license,
    pkg,
    history,
    ancestors,
  };
}

export async function getChildPackageHistoryTree({
  label,
  license,
}: {
  label: string;
  license: string;
}): Promise<IPackageChildTreeNode> {
  const ownedLicenses: string[] = (await facilityManager.ownedFacilitiesOrError()).map(
    (facility) => facility.licenseNumber
  );
  console.log(ownedLicenses, license);

  if (!ownedLicenses.includes(license)) {
    // This license is not owned by the current user, exit with terminal node
    return {
      label,
      license,
      children: [],
    };
  }

  const authState = { ...(await authManager.authStateOrError()), license };

  let dataLoader: DataLoader = await getDataLoader(authState);

  // TODO search every available facility
  // TODO search active, inactive
  let pkg: IIndexedPackageData | null = null;
  try {
    pkg = await dataLoader.activePackage(label);
  } catch (e) {}
  try {
    pkg = await dataLoader.inactivePackage(label);
  } catch (e) {}
  try {
    pkg = await dataLoader.inTransitPackage(label);
  } catch (e) {}

  if (!pkg) {
    throw new Error("Could not find package");
  }

  const history: IPackageHistoryData[] = await dataLoader.packageHistoryByPackageId(pkg.Id);

  // TODO: this license may not be correct
  // and must update when a transfer occurs
  const children = await Promise.all(
    extractChildPackageLabelsFromHistory(history).map((childLabel) =>
      getChildPackageHistoryTree({ label: childLabel, license })
    )
  );

  return {
    label,
    license,
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
