import { SheetTitles } from '@/consts';
import {
  IDestinationData,
  IIndexedDestinationPackageData,
  IIndexedPlantBatchData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTransferData,
  ITransferData,
  ITransporterData
} from '@/interfaces';
import store from "@/store/page-overlay/index";
import {
  FIELD_TRANSFORMER_REPORT_TYPES,
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
      for (const subProperty of fieldData.value.split('.')) {
        // @ts-ignore
        value = value[subProperty];
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

  if (FIELD_TRANSFORMER_REPORT_TYPES.includes(reportType)) {
    // @ts-ignore
    values = applyFieldTransformer({ fields: reportConfig[reportType]!.fields, values });
  }

  flattenedCache.set(reportType, values);

  return values;
}

// This is only for adding license and date boilerplate
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

  switch (reportType) {
    case ReportType.COGS_V2:
    case ReportType.HARVEST_PACKAGES:
    case ReportType.EMPLOYEE_SAMPLES:
      return `${sheetTitle} [Generated ${date}]`;
    default:
      return `${sheetTitle} - ${license} [Generated ${date}]`;
  }
}

export function getGoogleSheetName({
  license,
  reportConfig,
}: {
  license: string;
  reportConfig: IReportConfig;
}): string {
  const date = todayIsodate();

  return `${license} Metrc Report [Generated ${date}]`;
}

// This is for adding specific info like date ranges
export function getSheetTitle({
  reportType,
  reportConfig,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
}): string {
  switch (reportType) {
    case ReportType.PACKAGES:
      return SheetTitles.PACKAGES;
    case ReportType.STRAGGLER_PACKAGES:
      return SheetTitles.STRAGGLER_PACKAGES;
    case ReportType.HARVESTS:
      return SheetTitles.HARVESTS;
    case ReportType.HARVEST_PACKAGES:
      return SheetTitles.HARVEST_PACKAGES;
    case ReportType.TAGS:
      return SheetTitles.TAGS;
    case ReportType.IMMATURE_PLANTS:
      return SheetTitles.IMMATURE_PLANTS;
    case ReportType.PACKAGES_QUICKVIEW:
      return SheetTitles.PACKAGES_QUICKVIEW;
    case ReportType.MATURE_PLANTS_QUICKVIEW:
      return SheetTitles.MATURE_PLANTS_QUICKVIEW;
    case ReportType.IMMATURE_PLANTS_QUICKVIEW:
      return SheetTitles.IMMATURE_PLANTS_QUICKVIEW;
    case ReportType.MATURE_PLANTS:
      return SheetTitles.MATURE_PLANTS;
    case ReportType.INCOMING_TRANSFERS:
      return SheetTitles.INCOMING_TRANSFERS;
    case ReportType.OUTGOING_TRANSFERS:
      return SheetTitles.OUTGOING_TRANSFERS;
    case ReportType.OUTGOING_TRANSFER_MANIFESTS:
      return SheetTitles.OUTGOING_TRANSFER_MANIFESTS;
    case ReportType.TRANSFER_HUB_TRANSFERS:
      return SheetTitles.TRANSFER_HUB_TRANSFERS;
    case ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS:
      return SheetTitles.TRANSFER_HUB_TRANSFER_MANIFESTS;
    case ReportType.EMPLOYEE_AUDIT:
      return SheetTitles.EMPLOYEE_AUDIT;
    case ReportType.SINGLE_TRANSFER:
      return `${SheetTitles.SINGLE_TRANSFER} ${
        reportConfig[ReportType.SINGLE_TRANSFER]!.manifestNumber
      }`;
    case ReportType.POINT_IN_TIME_INVENTORY:
      return `${SheetTitles.POINT_IN_TIME_INVENTORY} ${
        reportConfig[ReportType.POINT_IN_TIME_INVENTORY]!.targetDate
      }`;
    default:
      throw new Error(`Bad reportType ${reportType}`);
  }
}

export function reportOptionsImpl(): IReportOption[] {
  const reportOptions: IReportOption[] = [
    {
      text: "Packages",
      value: ReportType.PACKAGES,
      t3plus: true,
      enabled: true,
      description: "All packages. Filter by type and date.",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Point-in-time inventory",
      value: ReportType.POINT_IN_TIME_INVENTORY,
      t3plus: true,
      enabled: true,
      description: "All active packages on a certain date.",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Plant Batches",
      value: ReportType.IMMATURE_PLANTS,
      t3plus: true,
      enabled: true,
      description: "All plant batches. Filter by planted date.",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Mature Plants",
      value: ReportType.MATURE_PLANTS,
      t3plus: true,
      enabled: true,
      description: "All mature plants. Filter by growth phase and planted date",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Incoming Transfers",
      value: ReportType.INCOMING_TRANSFERS,
      t3plus: true,
      enabled: true,
      description: "All incoming transfers. Filter by wholesale and ETA",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Outgoing Transfers",
      value: ReportType.OUTGOING_TRANSFERS,
      t3plus: true,
      enabled: true,
      description: "All outgoing transfers. Filter by wholesale and ETD",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    // Disabled - Destinations returns 0, more like incoming?
    // {
    //   text: "Hub Transfers",
    //   value: ReportType.TRANSFER_HUB_TRANSFERS,
    //   t3plus: false,
    //   enabled: true,
    //   description: "Filter by estimated time of departure",
    //   isCustom: false,
    // },
    {
      text: "Tags",
      value: ReportType.TAGS,
      t3plus: true,
      enabled: true,
      description: "All tags. Filter by status and tag type.",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Harvests",
      value: ReportType.HARVESTS,
      t3plus: true,
      enabled: true,
      description: "All harvests. Filter by status and harvest date.",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Outgoing Transfer Manifests",
      value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
      t3plus: true,
      enabled: true,
      description: "Full transfer and package data for all outgoing transfers.",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Straggler Inventory",
      value: ReportType.STRAGGLER_PACKAGES,
      t3plus: true,
      enabled: true,
      description: "Find old and empty inventory",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Employee Activity",
      value: ReportType.EMPLOYEE_AUDIT,
      t3plus: true,
      enabled: true,
      description: "View all employee activity in Metrc",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "COGS",
      value: ReportType.COGS_V2,
      t3plus: false,
      enabled: !!store.state.client.values.ENABLE_COGS,
      hidden: !store.state.client.values.ENABLE_COGS,
      description: "Generate COGS calculator",
      isCustom: false,
      isCsvEligible: false,
      isSingleton: true,
    },
    {
      text: "COGS Tracker",
      value: ReportType.COGS_TRACKER,
      t3plus: false,
      enabled: !!store.state.client.values.ENABLE_COGS_TRACKER,
      hidden: !store.state.client.values.ENABLE_COGS_TRACKER,
      description: "Generate COGS Tracker sheets",
      isCustom: false,
      isCsvEligible: false,
      isSingleton: true,
    },
    {
      text: "Employee Samples",
      value: ReportType.EMPLOYEE_SAMPLES,
      t3plus: false,
      enabled: !!store.state.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
      hidden: !store.state.client.values.ENABLE_EMPLOYEE_SAMPLE_TOOL,
      description: "Generate summary of employee samples",
      isCustom: false,
      isCsvEligible: false,
      isSingleton: true,
    },
    {
      text: "Harvest Packages",
      value: ReportType.HARVEST_PACKAGES,
      t3plus: false,
      enabled: !!store.state.client.values.ENABLE_HARVEST_PACKAGES,
      hidden: !store.state.client.values.ENABLE_HARVEST_PACKAGES,
      description: "Generate summary of harvest packages",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: true,
    },
    {
      text: "Packages Quickview",
      value: ReportType.PACKAGES_QUICKVIEW,
      t3plus: true,
      enabled: true,
      description: "Grouped summary of packages by item, location, and dates",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Plant Batch Quickview",
      value: ReportType.IMMATURE_PLANTS_QUICKVIEW,
      t3plus: true,
      enabled: true,
      description: "Grouped summary of plant batches by strain, location, and dates",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    {
      text: "Mature Plants Quickview",
      value: ReportType.MATURE_PLANTS_QUICKVIEW,
      t3plus: true,
      enabled: true,
      description:
        "Grouped summary of mature plants by growth phase, strain, location, and dates",
      isCustom: false,
      isCsvEligible: true,
      isSingleton: false,
    },
    // TODO
    // {
    //   text: "Transfer Quickview",
    //   value: ReportType.TRANSFER_QUICKVIEW,
    //   t3plus: true,
    //   enabled: false,
    //   description: "Summary of incoming, outgoing, and rejected packages",
    //   isCustom: false,
    //   isCsvEligible: true,
    //   isSingleton: false,
    // },
    // {
    //   text: "Incoming Inventory",
    //   value: null,
    //   t3plus: true,
    //   enabled: false,
    //   description: "See packages not yet recieved",
    //   isCustom: false,
    // },
    // {
    //   text: "Harvested Plants",
    //   value: null,
    //   t3plus: true,
    //   enabled: false,
    //   description: "All plants and associated harvest data within this license",
    //   isCustom: false,
    // },
  ];

  return reportOptions.filter((x) => !x.hidden);
}
