import { LabelEndpoint } from "./consts";

export interface ILabelTemplateLayoutOption {
  id: string;
  description: string;
}

export interface ILabelContentLayoutOption {
  id: string;
  description: string;
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
  selectedTemplateLayout: ILabelTemplateLayoutOption | null;
  selectedContentLayout: ILabelContentLayoutOption | null;
  rawTagList: string;
  labelsPerTag: number;
  selectedLabelEndpoint: LabelEndpoint;
  errorText: string | null;
}
