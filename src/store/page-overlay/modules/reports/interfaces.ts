import {
  IIndexedPackageData,
  IIndexedRichTransferData,
  IPackageFilter,
  ISimpleSpreadsheet,
  ISpreadsheet,
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
  [ReportType.ACTIVE_PACKAGES]?: {
    packageFilter: IPackageFilter;
    fields: IFieldData[];
  };
  [ReportType.TRANSFER_PACKAGES]?: {
    transferFilter: ITransferFilter;
    fields: IFieldData[];
  };
}

export interface IReportData {
  [ReportType.ACTIVE_PACKAGES]?: {
    activePackages: IIndexedPackageData[];
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
