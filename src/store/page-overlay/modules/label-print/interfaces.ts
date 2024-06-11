export interface ILabelData {
  primaryValue: string;
  secondaryValue: string | null;
  tertiaryValue: string | null;
  count: number;
}

export interface ILabelPrintState {
  labelDataList: ILabelData[];
}
