import { LabelEndpoint, LabelPrintStatus } from "./consts";

export interface ILabelTemplateLayoutOption {
  labelTemplateLayoutId: string;
  description: string;
  labelTemplateLayoutConfig: {
    printerTypes: string[];
  };
}

export interface ILabelContentLayoutOption {
  labelContentLayoutId: string;
  description: string;
  labelContentLayoutConfig: {
    aspectRatio: number;
  };
}

export interface ILabelEndpointConfig {
  id: LabelEndpoint;
  description: string;
}

export interface ILabelPrintState {
  status: LabelPrintStatus;
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
  reversePrintOrder: boolean;
  generateMetadata: boolean;
  forcePromo: boolean;
  selectedLabelEndpoint: LabelEndpoint;
  errorText: string | null;
  rawCsvMatrix: string[][] | null;
}
