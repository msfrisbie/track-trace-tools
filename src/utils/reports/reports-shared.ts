import { SheetTitles } from "@/consts";
import {
  IDestinationData, IIndexedDestinationPackageData,
  IIndexedHarvestData,
  IIndexedPlantBatchData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTransferData,
  ILicenseFormFilters, ITransferData,
  ITransporterData
} from "@/interfaces";
import { facilityManager } from "@/modules/facility-manager.module";
import store from "@/store/page-overlay/index";
import { CustomTransformer, ReportsGetters, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportOption
} from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "../date";
import { extractEmployeeAuditData } from "./employee-audit-report";
import { extractHarvestPackagesData } from "./harvest-packages-report";
import { extractImmaturePlantPropertyFromDimension } from "./immature-plants-quickview-report";
import { extractMaturePlantPropertyFromDimension } from "./mature-plants-quickview-report";
import { extractPackagePropertyFromDimension } from "./packages-quickview-report";
import { extractPointInTimeInventoryData } from "./point-in-time-inventory-report";
import { extractSingleTransferData } from "./single-transfer-report";

export function reportCatalogFactory(): IReportOption[] {
  return store.getters[`reports/${ReportsGetters.REPORT_OPTIONS}`];
}

export function shouldGenerateReport({
  reportConfig,
  reportData,
  reportType,
}: {
  reportConfig: IReportConfig;
  reportData: IReportData;
  reportType: ReportType;
}): boolean {
  if (!!reportConfig[reportType] && !reportData[reportType]) {
    console.error(`Failed to load data for ${reportType}`);
  }

  return !!reportConfig[reportType] && !!reportData[reportType];
}

export function extractNestedData({
  reportData,
  reportType,
}: {
  reportData: IReportData;
  reportType: ReportType;
}) {
  switch (reportType) {
    case ReportType.PACKAGES:
      return reportData[reportType]!.packages!;
    case ReportType.TAGS:
      return reportData[reportType]!.tags!;
    case ReportType.HARVESTS:
      return reportData[reportType]!.harvests!;
    case ReportType.IMMATURE_PLANTS:
      return reportData[reportType]!.immaturePlants!;
    case ReportType.MATURE_PLANTS:
      return reportData[reportType]!.maturePlants!;
    case ReportType.INCOMING_TRANSFERS:
      return reportData[reportType]!.incomingTransfers!;
    case ReportType.OUTGOING_TRANSFERS:
      return reportData[reportType]!.outgoingTransfers!;
    case ReportType.INCOMING_TRANSFER_MANIFESTS:
      return reportData[reportType]!.richIncomingTransfers!;
    case ReportType.INCOMING_MANIFEST_INVENTORY:
      return reportData[reportType]!.richIncomingTransfers!;
    case ReportType.OUTGOING_TRANSFER_MANIFESTS:
      return reportData[reportType]!.richOutgoingTransfers!;
    case ReportType.TRANSFER_HUB_TRANSFERS:
      return reportData[reportType]!.transferHubTransfers!;
    case ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS:
      return reportData[reportType]!.richTransferHubTransfers!;
    case ReportType.STRAGGLER_PACKAGES:
      return reportData[reportType]!.stragglerPackages!;
    case ReportType.MATURE_PLANTS_QUICKVIEW:
      return reportData[reportType]!.maturePlants;
    case ReportType.IMMATURE_PLANTS_QUICKVIEW:
      return reportData[reportType]!.plantBatches;
    case ReportType.PACKAGES_QUICKVIEW:
      return reportData[reportType]!.packages;
    default:
      throw new Error(`Bad reportType ${reportType}`);
  }
}

export function applyCustomTransformer(field: IFieldData, untypedRow: any): string {
  const customTransformer = field.customTransformer;

  if (!customTransformer) {
    throw new Error(`Field ${field.readableName} has no custom transformer`);
  }

  let row;

  switch (customTransformer) {
    case CustomTransformer.CURRENT_PERCENT_WET_WEIGHT:
      row = untypedRow as IIndexedHarvestData;
      return `${
        Math.round(((100 * row.CurrentWeight) / row.TotalWetWeight + Number.EPSILON) * 100) / 100
      }%`;
    case CustomTransformer.PACKAGED_PERCENT_WET_WEIGHT:
      row = untypedRow as IIndexedHarvestData;
      return `${
        Math.round(((100 * row.TotalPackagedWeight) / row.TotalWetWeight + Number.EPSILON) * 100) /
        100
      }%`;
    case CustomTransformer.WASTE_PERCENT_WET_WEIGHT:
      row = untypedRow as IIndexedHarvestData;
      return `${
        Math.round(((100 * row.TotalWasteWeight) / row.TotalWetWeight + Number.EPSILON) * 100) / 100
      }%`;
    case CustomTransformer.RESTORED_PERCENT_WET_WEIGHT:
      row = untypedRow as IIndexedHarvestData;
      return `${
        Math.round(((100 * row.TotalRestoredWeight) / row.TotalWetWeight + Number.EPSILON) * 100) /
        100
      }%`;
    case CustomTransformer.TRANSFER_PACKAGE_UNIT_WEIGHT:
      row = untypedRow as { Package: IIndexedDestinationPackageData };
      const match = row.Package.ProductName.match(/(\d+(?:\.\d+)?)(?:\s?)(g|mg)/);

        if (match) {
          return `${match[1]} ${match[2]}`;
        }

        return "";
    default:
      throw new Error('Unmatched custom transformer');
  }
}

export function applyFieldTransformer({
  fields,
  values,
}: {
  fields: IFieldData[];
  values: any[];
}): any[][] {
  return values.map((row) =>
    fields.map((fieldData) => {
      let value = row;

      if (fieldData.customTransformer) {
        value = applyCustomTransformer(fieldData, row);
      } else {
        for (const subProperty of fieldData.value.split(".")) {
          // @ts-ignore
          value = value[subProperty];
        }
      }

      return value;
    })
  );
}

export function extractQuickviewData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  const data: any[][] = [];

  let primaryDimension: string;
  let secondaryDimension: string | null;
  let objects: { [key: string]: any }[];
  let extractor: (...args: any[]) => any;
  let countFn: (object: any) => number = () => 1;

  switch (reportType) {
    case ReportType.IMMATURE_PLANTS_QUICKVIEW:
      primaryDimension = reportConfig[reportType]!.primaryDimension as string;
      secondaryDimension = reportConfig[reportType]!.secondaryDimension as string | null;
      objects = reportData[reportType]!.plantBatches;
      extractor = extractImmaturePlantPropertyFromDimension;
      countFn = (plantBatch: IIndexedPlantBatchData) => plantBatch.UntrackedCount;
      break;
    case ReportType.MATURE_PLANTS_QUICKVIEW:
      primaryDimension = reportConfig[reportType]!.primaryDimension as string;
      secondaryDimension = reportConfig[reportType]!.secondaryDimension as string | null;
      objects = reportData[reportType]!.maturePlants;
      extractor = extractMaturePlantPropertyFromDimension;
      break;
    case ReportType.PACKAGES_QUICKVIEW:
      primaryDimension = reportConfig[reportType]!.primaryDimension as string;
      secondaryDimension = reportConfig[reportType]!.secondaryDimension as string | null;
      objects = reportData[reportType]!.packages;
      extractor = extractPackagePropertyFromDimension;
      break;
    default:
      throw new Error("Bad report type");
  }

  const indexedDimensionCounts: { [key: string]: { [key: string]: number } } = {};

  const primaryKeys = new Set<string>();
  const secondaryKeys = new Set<string>();

  for (const object of objects) {
    const primaryValue = extractor(object, primaryDimension);
    const secondaryValue = secondaryDimension ? extractor(object, secondaryDimension) : "*";

    primaryKeys.add(primaryValue);
    secondaryKeys.add(secondaryValue);

    if (indexedDimensionCounts[primaryValue] === undefined) {
      indexedDimensionCounts[primaryValue] = {};
    }

    if (indexedDimensionCounts[primaryValue][secondaryValue] === undefined) {
      indexedDimensionCounts[primaryValue][secondaryValue] = 0;
    }

    indexedDimensionCounts[primaryValue][secondaryValue] += countFn(object);
  }

  const sortedPrimaryKeys = [...primaryKeys].sort();
  const sortedSecondaryKeys = [...secondaryKeys].sort();

  data.push([
    `${secondaryDimension ?? "*"} / ${primaryDimension}`,
    ...sortedPrimaryKeys,
    "",
    "TOTAL",
  ]);

  const colTotals = Array(sortedPrimaryKeys.length).fill(0);
  let grandTotal: number = 0;

  for (const [i, secondaryKey] of sortedSecondaryKeys.entries()) {
    const row = [secondaryKey];

    let rowTotal = 0;

    for (const [j, primaryKey] of sortedPrimaryKeys.entries()) {
      const cellSum = indexedDimensionCounts[primaryKey][secondaryKey] ?? 0;

      rowTotal += cellSum;
      colTotals[j] += cellSum;
      grandTotal += cellSum;

      row.push(cellSum.toString());
    }

    data.push([...row, "", rowTotal.toString()]);
  }

  data.push([]);
  data.push(["TOTAL", ...colTotals, "", `GRAND TOTAL: ${grandTotal}`]);

  return data;
}

export function extractFlattenedData({
  flattenedCache,
  reportType,
  reportData,
  reportConfig,
}: {
  flattenedCache: Map<ReportType, any[]>;
  reportType: ReportType;
  reportData: IReportData;
  reportConfig: IReportConfig;
}): any[] {
  if (flattenedCache.has(reportType)) {
    return flattenedCache.get(reportType) as any[];
  }

  let values = (() => {
    switch (reportType) {
      case ReportType.PACKAGES:
      case ReportType.STRAGGLER_PACKAGES:
      case ReportType.MATURE_PLANTS:
      case ReportType.IMMATURE_PLANTS:
      case ReportType.HARVESTS:
      case ReportType.TAGS:
        return extractNestedData({ reportType, reportData });
      case ReportType.INCOMING_TRANSFERS:
        const flattenedIncomingTransfers: {
          Transporter: ITransporterData;
          Transfer: IIndexedTransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichIncomingTransferData[]) {
          for (const transporter of transfer?.incomingTransporters ?? []) {
            flattenedIncomingTransfers.push({
              Transporter: transporter,
              Transfer: transfer,
            });
          }
        }

        return flattenedIncomingTransfers;
      case ReportType.OUTGOING_TRANSFERS:
        const flattenedOutgoingTransfers: {
          Destination: IDestinationData;
          Transfer: ITransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichOutgoingTransferData[]) {
          for (const destination of transfer?.outgoingDestinations ?? []) {
            flattenedOutgoingTransfers.push({
              Destination: destination,
              Transfer: transfer,
            });
          }
        }

        return flattenedOutgoingTransfers;
      case ReportType.TRANSFER_HUB_TRANSFERS:
        const flattenedTransferHubTransfers: {
          Destination: IDestinationData;
          Transfer: ITransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichOutgoingTransferData[]) {
          for (const destination of transfer?.outgoingDestinations ?? []) {
            flattenedTransferHubTransfers.push({
              Destination: destination,
              Transfer: transfer,
            });
          }
        }

        return flattenedTransferHubTransfers;
      case ReportType.INCOMING_TRANSFER_MANIFESTS:
      case ReportType.INCOMING_MANIFEST_INVENTORY:
        const flattenedIncomingPackages: {
          Package: IIndexedDestinationPackageData;
          Transfer: ITransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichIncomingTransferData[]) {
          for (const pkg of transfer.incomingPackages ?? []) {
            flattenedIncomingPackages.push({
              Package: pkg,
              Transfer: transfer,
            });
          }
        }
        return flattenedIncomingPackages;
      case ReportType.OUTGOING_TRANSFER_MANIFESTS:
        const flattenedOutgoingPackages: {
          Package: IIndexedDestinationPackageData;
          Destination: IDestinationData;
          Transfer: ITransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichOutgoingTransferData[]) {
          for (const destination of transfer?.outgoingDestinations ?? []) {
            for (const pkg of destination.packages ?? []) {
              flattenedOutgoingPackages.push({
                Package: pkg,
                Destination: destination,
                Transfer: transfer,
              });
            }
          }
        }
        return flattenedOutgoingPackages;
      case ReportType.EMPLOYEE_AUDIT:
        return extractEmployeeAuditData({
          reportType,
          reportConfig,
          reportData,
        });
      case ReportType.HARVEST_PACKAGES:
        return extractHarvestPackagesData({
          reportType,
          reportConfig,
          reportData,
        });
      case ReportType.POINT_IN_TIME_INVENTORY:
        return extractPointInTimeInventoryData({
          reportType,
          reportConfig,
          reportData,
        });
      case ReportType.SINGLE_TRANSFER:
        return extractSingleTransferData({
          reportType,
          reportConfig,
          reportData,
        });
      case ReportType.PACKAGES_QUICKVIEW:
      case ReportType.IMMATURE_PLANTS_QUICKVIEW:
      case ReportType.MATURE_PLANTS_QUICKVIEW:
        return extractQuickviewData({
          reportType,
          reportConfig,
          reportData,
        });
      default:
        throw new Error(`Bad reportType ${reportType}`);
    }
  })();

  if (reportCatalogFactory().find((x) => x.value === reportType)!.usesFieldTransformer) {
    // @ts-ignore
    values = applyFieldTransformer({ fields: reportConfig[reportType]!.fields, values });
  }

  flattenedCache.set(reportType, values);

  return values;
}

export function getCsvFilename({
  reportType,
  license,
  reportConfig,
}: {
  reportType: ReportType;
  license: string;
  reportConfig: IReportConfig;
}): string {
  const sheetTitle = getSheetTitle({ reportType, reportConfig });

  const date = todayIsodate();

  return `${sheetTitle} [Generated ${date}]`;
}

export function getSpreadsheetName({ reportConfig }: { reportConfig: IReportConfig }): string {
  const date = todayIsodate();

  const fileExtension: string = reportConfig.exportFormat === 'XLSX' ? '.xlsx' : '';

  return `T3 Metrc Report [Generated ${date}]${fileExtension}`;
}

export function getSheetTitle({
  reportType,
  reportConfig,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
}): string {
  let title: string;

  switch (reportType) {
    case ReportType.PACKAGES:
      title = SheetTitles.PACKAGES;
      break;
    case ReportType.STRAGGLER_PACKAGES:
      title = SheetTitles.STRAGGLER_PACKAGES;
      break;
    case ReportType.HARVESTS:
      title = SheetTitles.HARVESTS;
      break;
    case ReportType.HARVEST_PACKAGES:
      title = SheetTitles.HARVEST_PACKAGES;
      break;
    case ReportType.TAGS:
      title = SheetTitles.TAGS;
      break;
    case ReportType.IMMATURE_PLANTS:
      title = SheetTitles.IMMATURE_PLANTS;
      break;
    case ReportType.PACKAGES_QUICKVIEW:
      title = SheetTitles.PACKAGES_QUICKVIEW;
      break;
    case ReportType.MATURE_PLANTS_QUICKVIEW:
      title = SheetTitles.MATURE_PLANTS_QUICKVIEW;
      break;
    case ReportType.IMMATURE_PLANTS_QUICKVIEW:
      title = SheetTitles.IMMATURE_PLANTS_QUICKVIEW;
      break;
    case ReportType.MATURE_PLANTS:
      title = SheetTitles.MATURE_PLANTS;
      break;
    case ReportType.INCOMING_TRANSFERS:
      title = SheetTitles.INCOMING_TRANSFERS;
      break;
    case ReportType.OUTGOING_TRANSFERS:
      title = SheetTitles.OUTGOING_TRANSFERS;
      break;
    case ReportType.INCOMING_TRANSFER_MANIFESTS:
      title = SheetTitles.INCOMING_TRANSFER_MANIFESTS;
      break;
    case ReportType.INCOMING_MANIFEST_INVENTORY:
      title = SheetTitles.INCOMING_MANIFEST_INVENTORY;
      break;
    case ReportType.OUTGOING_TRANSFER_MANIFESTS:
      title = SheetTitles.OUTGOING_TRANSFER_MANIFESTS;
      break;
    case ReportType.TRANSFER_HUB_TRANSFERS:
      title = SheetTitles.TRANSFER_HUB_TRANSFERS;
      break;
    case ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS:
      title = SheetTitles.TRANSFER_HUB_TRANSFER_MANIFESTS;
      break;
    case ReportType.EMPLOYEE_AUDIT:
      title = SheetTitles.EMPLOYEE_AUDIT;
      break;
    case ReportType.SINGLE_TRANSFER:
      title = SheetTitles.SINGLE_TRANSFER;
      break;
    case ReportType.POINT_IN_TIME_INVENTORY:
      title = `${SheetTitles.POINT_IN_TIME_INVENTORY} ${
        reportConfig[ReportType.POINT_IN_TIME_INVENTORY]!.targetDate
      }`;
      break;
    default:
      throw new Error(`Bad reportType ${reportType}`);
  }

  const NO_LICENSE_TYPES = [
    ReportType.COGS_V2,
    ReportType.HARVEST_PACKAGES,
    ReportType.EMPLOYEE_SAMPLES,
  ];

  if (!NO_LICENSE_TYPES.includes(reportType) && "licenses" in reportConfig[reportType]!) {
    // @ts-ignore
    title += ` (${reportConfig[reportType]!.licenses.join(",")})`;
  }

  return title;
}

export function licenseFilterFactory(
  initial: "all" | "current" | "none" = "current"
): ILicenseFormFilters {
  let licenses: string[] = [];
  const currentLicense: string | null = facilityManager.cachedActiveFacility?.licenseNumber ?? null;
  const allLicenses: string[] = facilityManager.cachedFacilities.map((x) => x.licenseNumber);

  switch (initial) {
    case "none":
      break;
    case "current":
      licenses = currentLicense ? [currentLicense] : [];
      break;
    case "all":
      licenses = allLicenses;
      break;
  }

  return {
    licenseOptions: allLicenses,
    licenses,
  };
}

export function extractLicenseFields(formFilters: ILicenseFormFilters): { licenses: string[] } {
  return {
    licenses: formFilters.licenses,
  };
}
