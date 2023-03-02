import { IIndexedPackageData, IIndexedRichTransferData, IPackageFilter, ISimpleSpreadsheet, ISpreadsheet, ITransferFilter } from "@/interfaces";
import { ReportStatus, ReportType } from "./consts";

export interface IReportsState {
  status: ReportStatus;
  statusMessage: string;
  generatedSpreadsheet: ISpreadsheet | null;
  generatedSheetHistory: {
      uuid: string,
      timestamp: string,
      spreadsheet: ISimpleSpreadsheet
  }[];
}

export interface IReportConfig {
    [ReportType.ACTIVE_PACKAGES]?: {
        packageFilter: IPackageFilter
    },
    [ReportType.TRANSFER_PACKAGES]?: {
        transferFilter: ITransferFilter
    }
}

export interface IReportData {
    [ReportType.ACTIVE_PACKAGES]?: {
        activePackages: IIndexedPackageData[]
    },
    [ReportType.TRANSFER_PACKAGES]?: {
        richOutgoingInactiveTransfers?: IIndexedRichTransferData[]
    }
}