import { PackageFilterIdentifiers } from "@/consts";
import { IPackageData, IUnionIndexedPackageData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import {
  getDataLoaderByLicense,
  primaryDataLoader,
} from "@/modules/data-loader/data-loader.module";
import { toastManager } from "@/modules/toast-manager.module";
import { downloadFileFromUrl } from "./dom";
import { extractParentPackageLabelsFromHistory } from "./history";

export function getId(unionPkg: IUnionIndexedPackageData): number {
  const pkg = unionPkg as any;
  if (pkg.Id) {
    return pkg.Id;
  }
  if (pkg.PackageId) {
    return pkg.PackageId;
  }
  throw new Error("Could not extract ID");
}

export function getLabel(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Label) {
    return pkg.Label;
  }
  if (pkg.PackageLabel) {
    return pkg.PackageLabel;
  }
  throw new Error("Could not extract Label");
}

// Extremely long lists will be truncated with an ellipsis
export async function getParentPackageLabels(pkg: IUnionIndexedPackageData) {
  if (pkg.SourcePackageLabels.length < 500) {
    return pkg.SourcePackageLabels.split(",").map((x) => x.trim());
  } else {
    // Source package labels may have been truncated
    if (pkg.history) {
      return extractParentPackageLabelsFromHistory(pkg.history);
    } else {
      const history = await getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(getId(pkg))
      );

      return extractParentPackageLabelsFromHistory(history);
    }
  }
}

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
