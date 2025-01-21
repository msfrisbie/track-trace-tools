import {
  IAuthState,
  IHarvestFilter,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTagData,
  IPackageFilter,
  IPlantBatchFilter,
  IPlantFilter,
  ISimpleSpreadsheet,
  ISpreadsheet,
  ITagFilter,
  ITransferFilter,
} from "@/interfaces";
import { ImmaturePlantQuickviewDimension } from "@/utils/reports/immature-plants-quickview-report";
import { IIncomingManifestInventoryReportFormFilters } from "@/utils/reports/incoming-manifest-inventory";
import { MaturePlantQuickviewDimension } from "@/utils/reports/mature-plants-quickview-report";
import { PackageQuickviewDimension } from "@/utils/reports/packages-quickview-report";
import {
  IPackageDateMetadata,
  InventoryStrategy,
} from "@/utils/reports/point-in-time-inventory-report";
import { IScanSheetReportFormFilters } from "@/utils/reports/scan-sheet-report";
import { CustomTransformer, IStatusMessage, ReportStatus, ReportType } from "./consts";

export interface IReportsState {
  status: ReportStatus;
  statusMessage: IStatusMessage | null;
  statusMessageHistory: IStatusMessage[];
  generatedSpreadsheet: ISpreadsheet | null;
  generatedSpreadsheetHistory: {
    uuid: string;
    timestamp: string;
    spreadsheet: ISimpleSpreadsheet;
  }[];
  selectedReports: IReportOption[];
  allFields: {
    [key: string]: IFieldData[];
  };
  selectedFields: {
    [key: string]: IFieldData[];
  };
  reportFormFilters: {
    [ReportType.INCOMING_MANIFEST_INVENTORY]: IIncomingManifestInventoryReportFormFilters;
    [ReportType.SCAN_SHEET]: IScanSheetReportFormFilters;
  };
}

// export interface IPackageCostCalculationData {
//   tag: string;
//   sourceCostData: {
//     parentTag: string;
//     costFractionMultiplier: number;
//   }[];
//   errors: string[];
// }

export interface IReportConfig {
  authState: IAuthState;
  exportFormat?: "CSV" | "GOOGLE_SHEETS" | "XLSX";
  fileDeliveryFormat?: "DOWNLOAD" | "EMAIL" | "OPEN_LINK";
  [ReportType.TEST]?: {
    exampleFilter: any;
    fields: IFieldData[];
  };
  [ReportType.COGS]?: {
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
    fields: null;
    mutableArchiveData: ICogsArchive;
  };
  [ReportType.COGS_V2]?: {
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
    licenses: string[];
    fields: null;
  };
  [ReportType.HARVEST_PACKAGES]?: {
    harvestFilter: IHarvestFilter;
    licenses: string[];
    debug: boolean;
    displayChecksum: boolean;
    displayFullTags: boolean;
    addSpacing: boolean;
    removeFloorNugs: boolean;
    harvestMatchFilterList: string;
    enableHarvestMatchFilter: boolean;
    generateDebugLog: boolean;
    fields: null;
  };
  [ReportType.COGS_TRACKER]?: {
    packageFilter: IPackageFilter;
    fields: null;
  };
  [ReportType.EMPLOYEE_SAMPLES]?: {
    packageFilter: IPackageFilter;
    fields: null;
  };
  [ReportType.PACKAGES]?: {
    packageFilter: IPackageFilter;
    onlyProductionBatches: boolean;
    licenses: string[];
    fields: IFieldData[];
  };
  [ReportType.LAB_RESULTS]?: {
    packageFilter: IPackageFilter;
    testTypeQuery: string;
    licenses: string[];
    fields: null;
  };
  [ReportType.POINT_IN_TIME_INVENTORY]?: {
    targetDate: string;
    inventoryStrategy: InventoryStrategy;
    useRestrictedWindowOptimization: boolean;
    restrictedWindowDays: number;
    showDebugColumns: boolean;
    licenses: string[];
    fields: null;
  };
  [ReportType.STRAGGLER_PACKAGES]?: {
    stragglerPackageFilter: IPackageFilter;
    fields: IFieldData[];
  };
  [ReportType.EMPLOYEE_AUDIT]?: {
    activityDateGt: string | null;
    activityDateLt: string | null;
    includePackages: boolean;
    includeTransfers: boolean;
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
    licenses: string[];
    // plantFilter: IPlantFilter;
    // plantBatchFilter: IPlantBatchFilter;
    // harvestFilter: IHarvestFilter;
    employeeQuery: string;
    fields: null;
  };
  [ReportType.SCAN_SHEET]?: {
    incomingTransferFilter: ITransferFilter;
    outgoingTransferFilter: ITransferFilter;
    rejectedTransferFilter: ITransferFilter;
    fields: null;
  };
  [ReportType.SINGLE_TRANSFER]?: {
    manifestNumber: string;
    fields: null;
  };
  [ReportType.PACKAGES_QUICKVIEW]?: {
    packageFilter: IPackageFilter;
    primaryDimension: PackageQuickviewDimension;
    secondaryDimension: PackageQuickviewDimension | null;
    licenses: string[];
    fields: null;
  };
  [ReportType.IMMATURE_PLANTS_QUICKVIEW]?: {
    plantBatchFilter: IPlantBatchFilter;
    primaryDimension: ImmaturePlantQuickviewDimension;
    secondaryDimension: ImmaturePlantQuickviewDimension | null;
    licenses: string[];
    fields: null;
  };
  [ReportType.MATURE_PLANTS_QUICKVIEW]?: {
    plantFilter: IPlantFilter;
    primaryDimension: MaturePlantQuickviewDimension;
    secondaryDimension: MaturePlantQuickviewDimension | null;
    licenses: string[];
    fields: null;
  };
  [ReportType.MATURE_PLANTS]?: {
    plantFilter: IPlantFilter;
    licenses: string[];
    fields: IFieldData[];
  };
  [ReportType.OUTGOING_TRANSFERS]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.INCOMING_MANIFEST_INVENTORY]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.INCOMING_TRANSFER_MANIFESTS]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.TRANSFER_HUB_TRANSFERS]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.INCOMING_TRANSFERS]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.HARVESTS]?: {
    harvestFilter: IHarvestFilter;
    fields: IFieldData[];
  };
  [ReportType.IMMATURE_PLANTS]?: {
    immaturePlantFilter: IPlantBatchFilter;
    licenses: string[];
    fields: IFieldData[];
  };
  [ReportType.TAGS]?: {
    tagFilter: ITagFilter;
    fields: IFieldData[];
  };
}

export interface IReportData {
  [ReportType.TEST]?: {
    exampleData: any[];
  };
  [ReportType.COGS]?: {
    auditData: { [key: string]: any };
    worksheetMatrix: any[][];
    cogsMatrix: any[][];
  };
  [ReportType.COGS_V2]?: {
    auditData: { [key: string]: any };
    worksheetMatrix: any[][];
    cogsMatrix: any[][];
  };
  [ReportType.COGS_TRACKER]?: {
    bulkInfusedMatrix: any[][];
    distRexCogsMatrix: any[][];
    packagedGoodsCogsMatrix: any[][];
  };
  [ReportType.HARVEST_PACKAGES]?: {
    harvestPackageMatrix: any[][];
  };
  [ReportType.EMPLOYEE_AUDIT]?: {
    employeeAuditMatrix: any[][];
  };
  [ReportType.PACKAGES]?: {
    packages: IIndexedPackageData[];
  };
  [ReportType.POINT_IN_TIME_INVENTORY]?: {
    packageMetadataPairs: [string, IPackageDateMetadata][];
  };
  [ReportType.EMPLOYEE_SAMPLES]?: {
    employeeSamplesMatrix: any[][];
    receivedSamplesMatrix: any[][];
  };
  [ReportType.STRAGGLER_PACKAGES]?: {
    stragglerPackages: IIndexedPackageData[];
  };
  [ReportType.IMMATURE_PLANTS]?: {
    immaturePlants: IIndexedPlantBatchData[];
  };
  [ReportType.MATURE_PLANTS]?: {
    maturePlants: IIndexedPlantData[];
  };
  [ReportType.PACKAGES_QUICKVIEW]?: {
    packages: IIndexedPackageData[];
  };
  [ReportType.IMMATURE_PLANTS_QUICKVIEW]?: {
    plantBatches: IIndexedPlantBatchData[];
  };
  [ReportType.MATURE_PLANTS_QUICKVIEW]?: {
    maturePlants: IIndexedPlantData[];
  };
  [ReportType.TAGS]?: {
    tags: IIndexedTagData[];
  };
  [ReportType.HARVESTS]?: {
    harvests: IIndexedHarvestData[];
  };
  [ReportType.INCOMING_TRANSFERS]?: {
    incomingTransfers: IIndexedRichIncomingTransferData[];
  };
  [ReportType.OUTGOING_TRANSFERS]?: {
    outgoingTransfers: IIndexedRichOutgoingTransferData[];
  };
  [ReportType.TRANSFER_HUB_TRANSFERS]?: {
    transferHubTransfers: IIndexedRichOutgoingTransferData[];
  };
  [ReportType.INCOMING_TRANSFER_MANIFESTS]?: {
    richIncomingTransfers?: IIndexedRichIncomingTransferData[];
  };
  [ReportType.SCAN_SHEET]?: {
    richIncomingTransfers?: IIndexedRichIncomingTransferData[];
    richOutgoingTransfers?: IIndexedRichOutgoingTransferData[];
    richRejectedTransfers?: IIndexedRichIncomingTransferData[];
  };
  [ReportType.LAB_RESULTS]?: {
    packages: IIndexedPackageData[];
  };
  [ReportType.INCOMING_MANIFEST_INVENTORY]?: {
    extraHtml?: string;
    richIncomingTransfers?: IIndexedRichIncomingTransferData[];
  };
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]?: {
    richOutgoingTransfers?: IIndexedRichOutgoingTransferData[];
  };
  [ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS]?: {
    richTransferHubTransfers?: IIndexedRichOutgoingTransferData[];
  };
  [ReportType.SINGLE_TRANSFER]?: {
    singleTransferMatrix: any[][];
  };
}

export interface IFieldData {
  value: string;
  readableName: string;
  required: boolean;
  initiallyChecked: boolean;
  checkedMessage?: string;
  // customTransformer?: (row: any) => any;
  customTransformer?: CustomTransformer;
}

export interface ICogsArchive {
  licenses: string[];
  packages: any[];
  packagesKeys: string[];
  transfers: any[];
  transfersKeys: string[];
  transfersPackages: any[];
  transfersPackagesKeys: string[];
}

export interface IReportOption {
  text: string;
  value: ReportType | null;
  enabled: boolean;
  visible: boolean;
  description: string;
  usesFieldTransformer: boolean;
  usesSpreadsheetFormulas: boolean;
  requiresGoogleSheets: boolean;
  isCustom: boolean;
  isSpecialty: boolean;
  isCatalog: boolean;
  isQuickview: boolean;
  isHeadless: boolean;
}
