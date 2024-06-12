import { PackageState, PlantBatchState, PlantState } from "@/consts";

export interface ILabelData {
  primaryValue: string;
  secondaryValue: string | null;
  tertiaryValue: string | null;
  count: number;
  licenseNumber: string;
  packageState: PackageState | null;
  plantState: PlantState | null;
  plantBatchState: PlantBatchState | null;
}

export interface ILabelPrintState {
  labelDataList: ILabelData[];
}
