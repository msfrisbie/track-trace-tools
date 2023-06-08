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
import { IStatusMessage, ReportStatus, ReportType } from "./consts";

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
  [ReportType.COGS]?: {
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
    fields: null;
    mutableArchiveData: ICogsArchive;
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
    fields: IFieldData[];
  };
  [ReportType.STRAGGLER_PACKAGES]?: {
    stragglerPackageFilter: IPackageFilter;
    fields: IFieldData[];
  };
  [ReportType.MATURE_PLANTS_QUICKVIEW]?: {
    plantFilter: IPlantFilter;
    primaryDimension: string;
    secondaryDimension: string | null;
    fields: null;
  };
  [ReportType.MATURE_PLANTS]?: {
    plantFilter: IPlantFilter;
    fields: IFieldData[];
  };
  [ReportType.OUTGOING_TRANSFERS]?: {
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
    fields: IFieldData[];
  };
  [ReportType.TAGS]?: {
    tagFilter: ITagFilter;
    fields: IFieldData[];
  };
}

export interface IReportData {
  [ReportType.COGS]?: {
    auditData: { [key: string]: any };
    worksheetMatrix: any[][];
    cogsMatrix: any[][];
  };
  [ReportType.COGS_TRACKER]?: {
    bulkInfusedMatrix: any[][];
    distRexCogsMatrix: any[][];
    packagedGoodsCogsMatrix: any[][];
  };
  [ReportType.PACKAGES]?: {
    packages: IIndexedPackageData[];
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
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]?: {
    richOutgoingTransfers?: IIndexedRichOutgoingTransferData[];
  };
  [ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS]?: {
    richTransferHubTransfers?: IIndexedRichOutgoingTransferData[];
  };
}

export interface IFieldData {
  value: string;
  readableName: string;
  required: boolean;
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
