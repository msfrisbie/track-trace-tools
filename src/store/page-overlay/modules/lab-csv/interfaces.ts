import { IIndexedPackageData } from "@/interfaces";
import { LabCsvStatus } from "./consts";

export interface ILabCsvState {
  status: LabCsvStatus;
  statusMessages: {
    text: string;
    variant: string;
  }[];
  csvData: string[][];
  files: {
    file: File;
    filename: string;
    metrcFileId: number | null;
  }[];
  packages: IIndexedPackageData[];
  packageResultsCoaSets: {
    labTestResultId: number;
    metrcFileId: number | null;
  }[];
}
