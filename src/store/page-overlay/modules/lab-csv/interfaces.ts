import { IIndexedPackageData } from "@/interfaces";
import { LabCsvStatus } from "./consts";

export interface ILabCsvState {
  status: LabCsvStatus;
  statusMessages: {
    text: string;
    variant: string;
  }[];
  csvData: string[][];
  files: ILabFileData[];
  packages: IIndexedPackageData[];
}

export interface ILabFileData {
  file: File;
  filename: string;
  metrcFileId: string | null;
}

export interface IRichPackageLabData {
  packageLabel: string;
  pkg: IIndexedPackageData | null;
  filename: string;
  file: ILabFileData | null;
}
