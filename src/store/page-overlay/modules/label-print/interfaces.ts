import { LabelEndpoint } from "./consts";

export interface ILabelTemplateLayoutOption {
  id: string;
  description: string;
  printerTypes: string[];
}

export interface ILabelContentLayoutOption {
  id: string;
  description: string;
  aspectRatio: number;
}

export interface ILabelEndpointConfig {
  id: LabelEndpoint;
  description: string;
}

export interface ILabelPrintState {
  labelPdfBlobUrl: string | null;
  labelPdfFilename: string | null;
  labelTemplateLayoutOptions: ILabelTemplateLayoutOption[];
  labelContentLayoutOptions: ILabelContentLayoutOption[];
  selectedTemplateLayoutId: string | null;
  selectedContentLayoutId: string | null;
  rawTagList: string;
  labelsPerTag: number;
  barcodeBarThickness: number;
  labelMarginThickness: number;
  debug: boolean;
  selectedLabelEndpoint: LabelEndpoint;
  errorText: string | null;
}
