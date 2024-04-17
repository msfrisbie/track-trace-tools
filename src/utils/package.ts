import { METRC_TAG_REGEX, PackageState } from "@/consts";
import {
  ICsvFile,
  IDestinationData,
  IDestinationPackageData,
  IIndexedDestinationPackageData,
  IIndexedPackageData,
  IIndexedTransferData,
  IMetadataSimplePackageData,
  ISimpleCogsPackageData,
  ISimplePackageData,
  ISimpleTransferPackageData,
  ITestResultData,
  IUnionIndexedPackageData,
  PackageMetadata,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import {
  getDataLoaderByLicense,
  primaryDataLoader,
} from "@/modules/data-loader/data-loader.module";
import { toastManager } from "@/modules/toast-manager.module";
import { downloadCsvFile } from "./csv";
import { downloadFileFromUrl } from "./dom";
import { extractParentPackageLabelsFromHistory } from "./history";
import {
  UnitOfMeasureAbbreviation,
  UnitOfMeasureName,
  unitOfMeasureAbbreviationToName,
  unitOfMeasureNameToAbbreviation,
} from "./units";

export function getIdOrError(unionPkg: IUnionIndexedPackageData): number {
  const pkg = unionPkg as any;
  if ("Id" in pkg) {
    return (pkg as IIndexedPackageData).Id;
  }
  if ("PackageId" in pkg) {
    return (pkg as IDestinationPackageData).PackageId;
  }
  throw new Error("Could not extract ID");
}

export function getLabelOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if ("Label" in pkg) {
    return (pkg as IIndexedPackageData).Label;
  }
  if ("PackageLabel" in pkg) {
    return (pkg as IDestinationPackageData).PackageLabel;
  }
  throw new Error("Could not extract Label");
}

export function getQuantityOrError(unionPkg: IUnionIndexedPackageData): number {
  const pkg = unionPkg as any;
  if ("Quantity" in pkg) {
    return (pkg as IIndexedPackageData).Quantity;
  }
  if ("ShippedQuantity" in pkg) {
    return (pkg as IDestinationPackageData).ShippedQuantity;
  }
  throw new Error("Could not extract Quantity");
}

export function getStrainNameOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Item && "StrainName" in pkg.Item) {
    return (pkg as IIndexedPackageData).Item.StrainName ?? "";
  }
  if ("ItemStrainName" in pkg) {
    return (pkg as IDestinationPackageData).ItemStrainName ?? "";
  }
  throw new Error("Could not extract Strain Name");
}

export function getSourceHarvestNamesOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if ("SourceHarvestNames" in pkg) {
    return (pkg as IIndexedPackageData).SourceHarvestNames;
  }
  if ("SourceHarvestNames" in pkg) {
    return (pkg as IDestinationPackageData).SourceHarvestNames;
  }
  throw new Error("Could not extract Harvest Names");
}

export function getSourcePackageTagsOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if ("SourcePackageLabels" in pkg) {
    return (pkg as IIndexedPackageData).SourcePackageLabels;
  }
  if ("SourcePackageLabels" in pkg) {
    return (pkg as IDestinationPackageData).SourcePackageLabels;
  }
  throw new Error("Could not extract Source Pakcage Tags");
}

export function getItemNameOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Item && "Name" in pkg.Item) {
    return (pkg as IIndexedPackageData).Item.Name;
  }
  if ("ProductName" in pkg) {
    return (pkg as IDestinationPackageData).ProductName;
  }
  throw new Error("Could not extract Item Name");
}

export function getItemCategoryOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Item && "ProductCategoryName" in pkg.Item) {
    return (pkg as IIndexedPackageData).Item.ProductCategoryName;
  }
  if ("ProductCategoryName" in pkg) {
    return (pkg as IDestinationPackageData).ProductCategoryName;
  }
  throw new Error("Could not extract Item Category");
}

export function getItemStrainOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if (pkg.Item && "StrainName" in pkg.Item) {
    return (pkg as IIndexedPackageData).Item.StrainName ?? "";
  }
  if ("ItemStrainName" in pkg) {
    return (pkg as IDestinationPackageData).ItemStrainName ?? "";
  }
  throw new Error("Could not extract Item Strain");
}

export function getLabTestingStateOrError(unionPkg: IUnionIndexedPackageData): string {
  const pkg = unionPkg as any;
  if ("LabTestingStateName" in pkg) {
    return (pkg as IIndexedPackageData).LabTestingStateName;
  }
  if ("LabTestingStateName" in pkg) {
    return (pkg as IDestinationPackageData).LabTestingStateName;
  }
  throw new Error("Could not extract Lab Testing State");
}

export function getGrossWeightOrError(unionPkg: IUnionIndexedPackageData): number | null {
  const pkg = unionPkg as any;
  if ("Item" in pkg) {
    return null;
  }
  if ("GrossWeight" in pkg) {
    return (pkg as IDestinationPackageData).GrossWeight;
  }
  throw new Error("Could not extract Gross Weight");
}

export function getWholesalePriceOrError(unionPkg: IUnionIndexedPackageData): number | null {
  const pkg = unionPkg as any;
  if ("Item" in pkg) {
    return null;
  }
  if ("ShipperWholesalePrice" in pkg) {
    return (pkg as IDestinationPackageData).ShipperWholesalePrice;
  }
  throw new Error("Could not extract Wholesale Price");
}

export function getProductionBatchNumberOrError(unionPkg: IUnionIndexedPackageData): string | null {
  const pkg = unionPkg as any;
  if ("Item" in pkg) {
    return (pkg as IIndexedPackageData).ProductionBatchNumber;
  }

  if ("ProductName" in pkg) {
    return (pkg as IDestinationPackageData).ProductionBatchNumber;
  }

  throw new Error("Could not extract ProductionBatchNumber");
}

export function getPackagedByFacilityLicenseNumberOrError(
  unionPkg: IUnionIndexedPackageData
): string | null {
  const pkg = unionPkg as any;
  if ("Item" in pkg) {
    return (pkg as IIndexedPackageData).PackagedByFacilityLicenseNumber;
  }

  if ("ProductName" in pkg) {
    null;
  }

  throw new Error("Could not extract PackagedByFacilityLicenseNumber");
}

export function getReceivedFromFacilityLicenseNumberOrError(
  unionPkg: IUnionIndexedPackageData
): string | null {
  const pkg = unionPkg as any;
  if ("Item" in pkg) {
    return (pkg as IIndexedPackageData).ReceivedFromFacilityLicenseNumber;
  }

  if ("ProductName" in pkg) {
    null;
  }

  throw new Error("Could not extract ReceivedFromFacilityLicenseNumber");
}

export function getItemUnitQuantityAndUnitOrError(unionPkg: IUnionIndexedPackageData): {
  quantity: number;
  unitOfMeasureAbbreviation: string;
} {
  const pkg = unionPkg as any;
  if (pkg.Item && "UnitWeight" in pkg.Item && "UnitWeightUnitOfMeasureAbbreviation" in pkg.Item) {
    return {
      quantity: (pkg as IIndexedPackageData).Item.UnitWeight!,
      unitOfMeasureAbbreviation: (pkg as IIndexedPackageData).Item
        .UnitWeightUnitOfMeasureAbbreviation!,
    };
  }
  if ("ItemUnitWeight" in pkg && "ItemUnitWeightUnitOfMeasureAbbreviation" in pkg) {
    return {
      quantity: (pkg as IDestinationPackageData).ItemUnitWeight!,
      unitOfMeasureAbbreviation: (pkg as IDestinationPackageData)
        .ItemUnitWeightUnitOfMeasureAbbreviation!,
    };
  }
  throw new Error("Could not extract Item Quantity");
}

export function getDelimiterSeparatedValuesOrError(
  joinedValues: string,
  options?: { delimiter?: string; regex?: RegExp }
): string[] {
  const { delimiter, regex } = {
    delimiter: ",",
    ...options,
  };

  const values = joinedValues
    .split(delimiter)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  if (regex) {
    for (const value of values) {
      if (!regex.test(value)) {
        throw new Error(`${value} failed regex`);
      }
    }
  }

  return values;
}

export function getQuantityAndUnitDescription(pkg: IUnionIndexedPackageData): string {
  return `${getQuantityOrError(pkg)} ${getUnitOfMeasureAbbreviationOrError(pkg)}`;
}

export function getNormalizedPackageContentsDescription(pkg: IUnionIndexedPackageData): string {
  return `${getQuantityOrError(pkg)} ${getUnitOfMeasureAbbreviationOrError(
    pkg
  )} ${getItemNameOrError(pkg)}`;
}

export async function getSourcePackageTags(target: IUnionIndexedPackageData): Promise<string[]> {
  try {
    return getDelimiterSeparatedValuesOrError(target.SourcePackageLabels, {
      regex: METRC_TAG_REGEX,
    });
  } catch (e) {
    const dataLoader = await getDataLoaderByLicense(target.LicenseNumber);

    await dataLoader.packageHistoryByPackageId(getIdOrError(target)).then((result) => {
      target.history = result;
    });

    // Extract source packages from history and return those instead
    return extractParentPackageLabelsFromHistory(target.history!);
  }
}

export function getUnitOfMeasureAbbreviationOrError(
  unionPkg: IUnionIndexedPackageData
): UnitOfMeasureAbbreviation {
  return unitOfMeasureNameToAbbreviation(getUnitOfMeasureNameOrError(unionPkg));
}

export function getItemUnitOfMeasureAbbreviationOrError(
  unionPkg: IUnionIndexedPackageData
): UnitOfMeasureAbbreviation {
  return unitOfMeasureNameToAbbreviation(getItemUnitOfMeasureNameOrError(unionPkg));
}

export function getUnitOfMeasureNameOrError(unionPkg: IUnionIndexedPackageData): UnitOfMeasureName {
  const pkg = unionPkg as any;
  if ("UnitOfMeasureAbbreviation" in pkg) {
    return unitOfMeasureAbbreviationToName((pkg as IIndexedPackageData).UnitOfMeasureAbbreviation);
  }
  if ("ShippedUnitOfMeasureAbbreviation" in pkg) {
    return unitOfMeasureAbbreviationToName(
      (pkg as IDestinationPackageData).ShippedUnitOfMeasureAbbreviation as UnitOfMeasureAbbreviation
    );
  }
  throw new Error("Could not extract UnitOfMeasureName");
}

export function getItemUnitOfMeasureNameOrError(
  unionPkg: IUnionIndexedPackageData
): UnitOfMeasureName {
  const pkg = unionPkg as any;
  if (pkg.Item && "UnitOfMeasureName" in pkg.Item) {
    return (pkg as IIndexedPackageData).Item.UnitOfMeasureName as UnitOfMeasureName;
  }
  if ("ItemUnitQuantityUnitOfMeasureAbbreviation" in pkg) {
    return unitOfMeasureAbbreviationToName(
      (pkg as IDestinationPackageData)
        .ItemUnitQuantityUnitOfMeasureAbbreviation as UnitOfMeasureAbbreviation
    );
  }
  throw new Error("Could not extract Item UnitOfMeasureName");
}

// Extremely long lists will be truncated with an ellipsis
export async function getParentPackageLabelsDeprecated(pkg: ISimpleCogsPackageData) {
  if (!pkg.SourcePackageLabels.endsWith("...")) {
    return pkg.SourcePackageLabels.split(",").map((x) => x.trim());
  }
  // Source package labels may have been truncated
  if (pkg.parentPackageLabels) {
    return pkg.parentPackageLabels;
  }
  console.warn(`${pkg.Label} falling back to parent label history fetch`);
  const history = await getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
    dataLoader.packageHistoryByPackageId(pkg.Id)
  );

  return extractParentPackageLabelsFromHistory(history);
}

export async function getParentPackageLabels(pkg: ISimpleTransferPackageData | ISimplePackageData) {
  const stringParsedPackageLabels = pkg.SourcePackageLabels.split(",")
    .map((x) => x.trim())
    .filter((label) => label.match(METRC_TAG_REGEX));

  if (pkg.SourcePackageLabels.endsWith("...")) {
    // Source package labels may have been truncated
    if (pkg.parentPackageLabels) {
      return pkg.parentPackageLabels;
    }
    if (pkg.PackageState !== PackageState.TRANSFERRED) {
      const history = await getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
        dataLoader.packageHistoryByPackageId(pkg.Id)
      );

      const historyParsedLabels = extractParentPackageLabelsFromHistory(history);

      if (historyParsedLabels.length > 0) {
        return historyParsedLabels;
      }
    }
  }

  return stringParsedPackageLabels;
}

export async function getLabTestResultsFromPackage({
  pkg,
}: {
  pkg: IUnionIndexedPackageData;
}): Promise<ITestResultData[]> {
  return primaryDataLoader.testResultsByPackageId(getIdOrError(pkg));
}

export async function getLabTestFileIdsFromPackage({
  pkg,
}: {
  pkg: IUnionIndexedPackageData;
}): Promise<number[]> {
  const testResults = await getLabTestResultsFromPackage({ pkg });

  const fileIds = new Set<number>();

  for (const testResult of testResults) {
    if (testResult.LabTestResultDocumentFileId) {
      fileIds.add(testResult.LabTestResultDocumentFileId);
    }
  }

  return [...fileIds];
}

export async function generatePackageMetadata({
  pkg,
}: {
  pkg: IUnionIndexedPackageData;
}): Promise<PackageMetadata> {
  const authState = await authManager.authStateOrError();

  const packageMetadata: PackageMetadata = {
    testResults: [],
    testResultPdfUrls: [],
  };

  if (!pkg.testResults) {
    pkg.testResults = await getLabTestResultsFromPackage({ pkg });
  }

  packageMetadata.testResults = pkg.testResults;

  const fileIds = new Set<number>();

  for (const testResult of pkg.testResults) {
    if (testResult.LabTestResultDocumentFileId) {
      fileIds.add(testResult.LabTestResultDocumentFileId);
    }
  }

  packageMetadata.testResultPdfUrls = [...fileIds].map(
    (fileId) =>
      `${window.location.origin}/filesystem/${
        authState.license
      }/download/labtest/result/document?packageId=${getIdOrError(
        pkg
      )}&labTestResultDocumentFileId=${fileId}`
  );

  return packageMetadata;
}

export async function getLabTestPdfUrlsFromPackage({
  pkg,
  showZeroResultsError = true,
}: {
  pkg: IUnionIndexedPackageData;
  showZeroResultsError?: boolean;
}): Promise<string[]> {
  const authState = await authManager.authStateOrError();

  const fileIds = await getLabTestFileIdsFromPackage({ pkg });

  if (fileIds.length === 0 && showZeroResultsError) {
    setTimeout(() => {
      toastManager.openToast("Metrc did not return any lab PDFs for this package.", {
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

  return fileIds.map(
    (fileId) =>
      `${window.location.origin}/filesystem/${
        authState.license
      }/download/labtest/result/document?packageId=${getIdOrError(
        pkg
      )}&labTestResultDocumentFileId=${fileId}`
  );
}

export async function downloadLabTestPdfs({ pkg }: { pkg: IUnionIndexedPackageData }) {
  const testResultData = await generatePackageMetadata({ pkg });

  for (const url of testResultData.testResultPdfUrls) {
    downloadFileFromUrl({ url, filename: `${getLabelOrError(pkg)}.pdf` });
  }
}

export async function downloadLabTestCsv({ pkg }: { pkg: IUnionIndexedPackageData }) {
  const testResultData = await generatePackageMetadata({ pkg });

  const matrix: any[][] = [
    [
      "Test Date",
      "Test Name",
      "Overall Passed?",
      "Result",
      "Notes",
      "Released Date",
      "Sample Package",
      "Item",
      "Category",
      "Lab Facility License Number",
      "Lab Facility Name",
    ],
  ];

  for (const testResult of testResultData.testResults) {
    matrix.push([
      testResult.TestPerformedDate,
      testResult.TestTypeName,
      testResult.OverallPassed,
      testResult.TestResultLevel,
      testResult.TestComment,
      testResult.ResultReleaseDateTime,
      testResult.SourcePackageLabel,
      testResult.ProductName,
      testResult.ProductCategoryName,
      testResult.LabFacilityLicenseNumber,
      testResult.LabFacilityName,
    ]);
  }

  const csvFile: ICsvFile = {
    filename: `lab-results-${getLabelOrError(pkg)}.csv`,
    data: matrix,
  };

  await downloadCsvFile({ csvFile, delay: 500 });
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
