import { SheetTitles } from '@/consts';
import {
  IDestinationData,
  IIndexedDestinationPackageData,
  IIndexedPlantBatchData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTransferData,
  ILicenseFormFilters, ITransferData,
  ITransporterData
} from '@/interfaces';
import { facilityManager } from '@/modules/facility-manager.module';
import store from "@/store/page-overlay/index";
import {
  ReportType
} from '@/store/page-overlay/modules/reports/consts';
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportOption
} from '@/store/page-overlay/modules/reports/interfaces';
import { todayIsodate } from '../date';
import { extractEmployeeAuditData } from './employee-audit-report';
import { extractHarvestPackagesData } from './harvest-packages-report';
import { extractImmaturePlantPropertyFromDimension } from './immature-plants-quickview-report';
import { extractMaturePlantPropertyFromDimension } from './mature-plants-quickview-report';
import { extractPackagePropertyFromDimension } from './packages-quickview-report';
import { extractPointInTimeInventoryData } from './point-in-time-inventory-report';
import { extractSingleTransferData } from './single-transfer-report';

export function reportCatalogFactory(): IReportOption[] {
  const hasPlus: boolean = store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus;

  const reportOptions: IReportOption[] = [
    {
      text: "Test",
      value: ReportType.TEST,
      enabled: hasPlus,
      visible: false,
      description: "Test report",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Packages",
      value: ReportType.PACKAGES,
      enabled: hasPlus,
      visible: true,
      description: "All packages. Filter by type and date.",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Point-in-time inventory",
      value: ReportType.POINT_IN_TIME_INVENTORY,
      enabled: hasPlus,
      visible: true,
      description: "All active packages on a certain date.",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: true,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Plant Batches",
      value: ReportType.IMMATURE_PLANTS,
      enabled: hasPlus,
      visible: true,
      description: "All plant batches. Filter by planted date.",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Mature Plants",
      value: ReportType.MATURE_PLANTS,
      enabled: hasPlus,
      visible: true,
      description: "All mature plants. Filter by growth phase and planted date",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Incoming Transfers",
      value: ReportType.INCOMING_TRANSFERS,
      enabled: hasPlus,
      visible: true,
      description: "All incoming transfers. Filter by wholesale and ETA",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Outgoing Transfers",
      value: ReportType.OUTGOING_TRANSFERS,
      enabled: hasPlus,
      visible: true,
      description: "All outgoing transfers. Filter by wholesale and ETD",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    // Disabled - Destinations returns 0, more like incoming?
    // {
    //   text: "Hub Transfers",
    //   value: ReportType.TRANSFER_HUB_TRANSFERS,
    //
    //   enabled: hasPlus,
    //   description: "Filter by estimated time of departure",
    //   isCustom: false,
    // },
    {
      text: "Tags",
      value: ReportType.TAGS,
      enabled: hasPlus,
      visible: true,
      description: "All tags. Filter by status and tag type.",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Harvests",
      value: ReportType.HARVESTS,
      enabled: hasPlus,
      visible: true,
      description: "All harvests. Filter by status and harvest date.",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: false,
      isCatalog: true,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Outgoing Transfer Manifests",
      value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
      enabled: hasPlus,
      visible: true,
      description: "Full transfer and package data for all outgoing transfers.",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: true,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Straggler Inventory",
      value: ReportType.STRAGGLER_PACKAGES,
      enabled: hasPlus,
      visible: true,
      description: "Find old and empty inventory",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: true,
      isSpecialty: true,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Employee Activity",
      value: ReportType.EMPLOYEE_AUDIT,
      enabled: hasPlus,
      visible: true,
      description: "View all employee activity in Metrc",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: true,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "COGS",
      value: ReportType.COGS_V2,
      enabled: !!store.state.client.values.ENABLE_COGS,
      visible: !!store.state.client.values.ENABLE_COGS,
      description: "Generate COGS calculator",
      isCustom: true,
      usesFormulas: true,
      isMultiSheet: true,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "COGS Tracker",
      value: ReportType.COGS_TRACKER,
      enabled: !!store.state.client.values.ENABLE_COGS_TRACKER,
      visible: !!store.state.client.values.ENABLE_COGS_TRACKER,
      description: "Generate COGS Tracker sheets",
      isCustom: true,
      usesFormulas: true,
      isMultiSheet: true,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Employee Samples",
      value: ReportType.EMPLOYEE_SAMPLES,
      enabled: !!store.state.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
      visible: !!store.state.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
      description: "Generate summary of employee samples",
      isCustom: true,
      usesFormulas: true,
      isMultiSheet: true,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Harvest Packages",
      value: ReportType.HARVEST_PACKAGES,
      enabled: !!store.state.client.values.ENABLE_HARVEST_PACKAGES,
      visible: !!store.state.client.values.ENABLE_HARVEST_PACKAGES,
      description: "Generate summary of harvest packages",
      usesFieldTransformer: false,
      usesFormulas: false,
      isMultiSheet: false,
      isCustom: true,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
    {
      text: "Packages Quickview",
      value: ReportType.PACKAGES_QUICKVIEW,
      enabled: hasPlus,
      visible: true,
      description: "Grouped summary of packages by item, location, and dates",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: true,
      isHeadless: false
    },
    {
      text: "Plant Batch Quickview",
      value: ReportType.IMMATURE_PLANTS_QUICKVIEW,
      enabled: hasPlus,
      visible: true,
      description: "Grouped summary of plant batches by strain, location, and dates",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: true,
      isHeadless: false
    },
    {
      text: "Mature Plants Quickview",
      value: ReportType.MATURE_PLANTS_QUICKVIEW,
      enabled: hasPlus,
      visible: true,
      description:
        "Grouped summary of mature plants by growth phase, strain, location, and dates",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: true,
      isHeadless: false
    },
    {
      text: "Transfer Quickview",
      value: null,
      enabled: false,
      visible: true,
      description: "Summary of incoming, outgoing, and rejected packages",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: true,
      isHeadless: false
    },
    // {
    //   text: "Incoming Inventory",
    //   value: null,
    //
    //   enabled: false,
    //   description: "See packages not yet recieved",
    //   isCustom: false,
    // },
    // {
    //   text: "Harvested Plants",
    //   value: null,
    //
    //   enabled: false,
    //   description: "All plants and associated harvest data within this license",
    //   isCustom: false,
    // },
    {
      text: "Single Transfer",
      value: ReportType.SINGLE_TRANSFER,
      enabled: hasPlus,
      visible: false,
      description: "Single transfer",
      isCustom: false,
      usesFormulas: false,
      isMultiSheet: false,
      usesFieldTransformer: false,
      isSpecialty: false,
      isCatalog: false,
      isQuickview: false,
      isHeadless: false
    },
  ];

  return reportOptions;
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
        value = fieldData.customTransformer(row);
      } else {
        for (const subProperty of fieldData.value.split('.')) {
          // @ts-ignore
          value = value[subProperty];
        }
      }

      return value;
    }));
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
      throw new Error('Bad report type');
  }

  const indexedDimensionCounts: { [key: string]: { [key: string]: number } } = {};

  const primaryKeys = new Set<string>();
  const secondaryKeys = new Set<string>();

  for (const object of objects) {
    const primaryValue = extractor(object, primaryDimension);
    const secondaryValue = secondaryDimension ? extractor(object, secondaryDimension) : '*';

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
    `${secondaryDimension ?? '*'} / ${primaryDimension}`,
    ...sortedPrimaryKeys,
    '',
    'TOTAL',
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

    data.push([...row, '', rowTotal.toString()]);
  }

  data.push([]);
  data.push(['TOTAL', ...colTotals, '', `GRAND TOTAL: ${grandTotal}`]);

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

export function getGoogleSheetName({
  license,
  reportConfig,
}: {
  license: string;
  reportConfig: IReportConfig;
}): string {
  const date = todayIsodate();

  return `T3 Metrc Report [Generated ${date}]`;
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

  if (!NO_LICENSE_TYPES.includes(reportType) && 'licenses' in reportConfig[reportType]!) {
    // @ts-ignore
    title += ` (${reportConfig[reportType]!.licenses.join(',')})`;
  }

  return title;
}

export function licenseFilterFactory(initial: 'all' | 'current' | 'none' = 'current'): ILicenseFormFilters {
  let licenses: string[] = [];
  const currentLicense: string | null = facilityManager.cachedActiveFacility?.licenseNumber ?? null;
  const allLicenses: string[] = facilityManager.cachedFacilities.map((x) => x.licenseNumber);

  switch (initial) {
    case 'none':
      break;
    case 'current':
      licenses = currentLicense ? [currentLicense] : [];
      break;
    case 'all':
      licenses = allLicenses;
      break;
  }

  return {
    licenseOptions: allLicenses,
    licenses,
  };
}

export function extractLicenseFields(formFilters: ILicenseFormFilters): {licenses: string[]} {
  return {
    licenses: formFilters.licenses
  };
}
