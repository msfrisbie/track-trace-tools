import { METRC_TAG_REGEX, PackageFilterIdentifiers, PackageState } from "@/consts";
import {
  IDestinationData,
  IDestinationPackageData,
  IIndexedDestinationPackageData,
  IIndexedPackageData,
  IIndexedTransferData,
  IMetadataSimplePackageData,
  IPackageData,
  ISimpleCogsPackageData,
  ISimplePackageData,
  ISimpleTransferPackageData,
  IUnionIndexedPackageData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import {
  getDataLoaderByLicense,
  primaryDataLoader,
} from "@/modules/data-loader/data-loader.module";
import { toastManager } from "@/modules/toast-manager.module";
import { downloadFileFromUrl } from "./dom";
import { extractParentPackageLabelsFromHistory } from "./history";
import {
  UnitOfMeasureAbbreviation,
  unitOfMeasureAbbreviationToName,
  UnitOfMeasureName,
  unitOfMeasureNameToAbbreviation,
} from "./units";

export function getIdOrError(unionPkg: IUnionIndexedPackageData): number {
  const pkg = unionPkg as any;
  if (pkg.Id) {
    return (pkg as IIndexedPackageData).Id;
  }
  if (pkg.PackageId) {
    return (pkg as IDestinationPackageData).PackageId;
  }
  throw new Error("Could not extract ID");
}

export function getLabelOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Label) {
    return (pkg as IIndexedPackageData).Label;
  }
  if (pkg.PackageLabel) {
    return (pkg as IDestinationPackageData).PackageLabel;
  }
  throw new Error("Could not extract Label");
}

export function getQuantityOrError(unionPkg: IUnionIndexedPackageData): number {
  const pkg = unionPkg as any;
  if (pkg.Item?.Name) {
    return (pkg as IIndexedPackageData).Quantity;
  }
  if (pkg.ProductName) {
    return (pkg as IDestinationPackageData).ShippedQuantity;
  }
  throw new Error("Could not extract Item Name");
}

export function getStrainNameOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Item?.StrainName) {
    return (pkg as IIndexedPackageData).Item.StrainName ?? "";
  }
  if (pkg.ProductName) {
    return (pkg as IDestinationPackageData).ItemStrainName ?? "";
  }
  throw new Error("Could not extract Strain Name");
}

export function getItemNameOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Item?.Name) {
    return (pkg as IIndexedPackageData).Item.Name;
  }
  if (pkg.ProductName) {
    return (pkg as IDestinationPackageData).ProductName;
  }
  throw new Error("Could not extract Item Name");
}

export function getItemUnitOfMeasureAbbreviationOrError(
  unionPkg: IUnionIndexedPackageData
): UnitOfMeasureAbbreviation {
  return unitOfMeasureNameToAbbreviation(getItemUnitOfMeasureNameOrError(unionPkg));
}

export function getItemUnitOfMeasureNameOrError(
  unionPkg: IUnionIndexedPackageData
): UnitOfMeasureName {
  const pkg = unionPkg as any;
  if (pkg.Item?.UnitOfMeasureName) {
    return (pkg as IIndexedPackageData).Item.UnitOfMeasureName as UnitOfMeasureName;
  }
  if (pkg.ProductName) {
    return unitOfMeasureAbbreviationToName(
      (pkg as IDestinationPackageData).ShippedUnitOfMeasureAbbreviation as UnitOfMeasureAbbreviation
    );
  }
  throw new Error("Could not extract Item UnitOfMeasureName");
}

// Extremely long lists will be truncated with an ellipsis
export async function getParentPackageLabelsDeprecated(pkg: ISimpleCogsPackageData) {
  if (!pkg.SourcePackageLabels.endsWith("...")) {
    return pkg.SourcePackageLabels.split(",").map((x) => x.trim());
  } else {
    // Source package labels may have been truncated
    if (pkg.parentPackageLabels) {
      return pkg.parentPackageLabels;
    } else {
      console.warn(`${pkg.Label} falling back to parent label history fetch`);
      const history = await getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(pkg.Id)
      );

      return extractParentPackageLabelsFromHistory(history);
    }
  }
}

export async function getParentPackageLabels(pkg: ISimpleTransferPackageData | ISimplePackageData) {
  const stringParsedPackageLabels = pkg.SourcePackageLabels.split(",")
    .map((x) => x.trim())
    .filter((label) => label.match(METRC_TAG_REGEX));

  if (pkg.SourcePackageLabels.endsWith("...")) {
    // Source package labels may have been truncated
    if (pkg.parentPackageLabels) {
      return pkg.parentPackageLabels;
    } else {
      if (pkg.PackageState !== PackageState.DEPARTED_FACILITY) {
        const history = await getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
          dataLoader.packageHistoryByPackageId(pkg.Id)
        );

        const historyParsedLabels = extractParentPackageLabelsFromHistory(history);

        if (historyParsedLabels.length > 0) {
          return historyParsedLabels;
        }
      }
    }
  }

  return stringParsedPackageLabels;
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

export function simplePackageConverter(pkg: IIndexedPackageData): ISimplePackageData {
  return {
    LicenseNumber: pkg.LicenseNumber,
    Id: getIdOrError(pkg),
    PackageState: pkg.PackageState,
    Label: getLabelOrError(pkg),
    ItemName: getItemNameOrError(pkg),
    SourcePackageLabels: pkg.SourcePackageLabels,
    ProductionBatchNumber: pkg.ProductionBatchNumber,
    parentPackageLabels: null,
    childPackageLabelQuantityPairs: null,
  };
}

export function simpleTransferPackageConverter(
  transfer: IIndexedTransferData,
  destination: IDestinationData,
  pkg: IIndexedDestinationPackageData
): ISimpleTransferPackageData {
  return {
    ETD: destination.EstimatedDepartureDateTime,
    Type: destination.ShipmentTypeName,
    ManifestNumber: transfer.ManifestNumber,
    LicenseNumber: transfer.LicenseNumber,
    Id: getIdOrError(pkg),
    PackageState: pkg.PackageState,
    Label: getLabelOrError(pkg),
    ItemName: getItemNameOrError(pkg),
    Quantity: pkg.ShippedQuantity,
    UnitOfMeasureAbbreviation: pkg.ShippedUnitOfMeasureAbbreviation,
    SourcePackageLabels: pkg.SourcePackageLabels,
    ProductionBatchNumber: pkg.ProductionBatchNumber,
    parentPackageLabels: null,
    childPackageLabelQuantityPairs: null,
  };
}

export function simplePackageNormalizer(
  pkg: ISimplePackageData | ISimpleTransferPackageData | IMetadataSimplePackageData
): IMetadataSimplePackageData {
  return {
    Type: "",
    ETD: "",
    ManifestNumber: "",
    UnitOfMeasureAbbreviation: "",
    Quantity: null,
    fractionalCostMultiplierPairs: undefined,
    ...pkg,
  };
}
