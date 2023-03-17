import {
  IHarvestFilter,
  IIndexedPackageData,
  IIndexedPlantData,
  IIndexedRichTransferData,
  IPackageFilter,
  IPlantBatchData,
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
}

export interface IReportConfig {
  [ReportType.PACKAGES]?: {
    packageFilter: IPackageFilter;
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
  [ReportType.TRANSFER_PACKAGES]?: {
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
  [ReportType.PACKAGES]?: {
    packages: IIndexedPackageData[];
  };
  [ReportType.MATURE_PLANTS]?: {
    maturePlants: IIndexedPlantData[];
  };
  [ReportType.OUTGOING_TRANSFERS]?: {
    outgoingTransfers: IIndexedRichTransferData[];
  };
  [ReportType.TRANSFER_PACKAGES]?: {
    richOutgoingInactiveTransfers?: IIndexedRichTransferData[];
  };
}

export interface IFieldData {
  value: string;
  readableName: string;
  required: boolean;
}
