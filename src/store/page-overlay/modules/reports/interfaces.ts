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
import { ReportStatus, ReportType } from "./consts";

export interface IReportsState {
  status: ReportStatus;
  statusMessage: string;
  statusMessageHistory: string[];
  generatedSpreadsheet: ISpreadsheet | null;
  generatedSpreadsheetHistory: {
    uuid: string;
    timestamp: string;
    spreadsheet: ISimpleSpreadsheet;
  }[];
  formFilters: {
    [ReportType.PACKAGES]: IPackageReportFormFilters
  }
}

export interface IReportConfig {
  authState: IAuthState;
  [ReportType.COGS]?: {
    packageFilter: IPackageFilter;
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
  [ReportType.PACKAGES]?: {
    packageFilter: IPackageFilter;
    fields: IFieldData[];
  };
  [ReportType.STRAGGLER_PACKAGES]?: {
    stragglerPackageFilter: IPackageFilter;
    fields: IFieldData[];
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
    packages: IIndexedPackageData[];
    richOutgoingTransfers?: IIndexedRichOutgoingTransferData[];
  };
  [ReportType.PACKAGES]?: {
    packages: IIndexedPackageData[];
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
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]?: {
    richOutgoingTransfers?: IIndexedRichOutgoingTransferData[];
  };
}

export interface IFieldData {
  value: string;
  readableName: string;
  required: boolean;
}

export interface IPackageReportFormFilters {
  packagedDateGt: string;
  packagedDateLt: string;
  shouldFilterPackagedDateGt: boolean;
  shouldFilterPackagedDateLt: boolean;
  includeActive: boolean;
  includeIntransit: boolean;
  includeInactive: boolean;
}