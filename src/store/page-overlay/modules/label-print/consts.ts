export enum LabelPrintMutations {
  LABEL_PRINT_MUTATION = "LABEL_PRINT_MUTATION",
}

export enum LabelPrintGetters {
  LABEL_ENDPOINT_CONFIG_OPTIONS = "LABEL_ENDPOINT_CONFIG_OPTIONS",
  PARSED_TAG_LIST = "PARSED_TAG_LIST",
  TAG_LIST_PARSE_ERRORS = "TAG_LIST_PARSE_ERRORS",
  ENABLE_GENERATION = "ENABLE_GENERATION"
}

export enum LabelPrintActions {
  UPDATE_LAYOUT_OPTIONS = "UPDATE_LAYOUT_OPTIONS",
  GENERATE_LABEL_PDF = "GENERATE_LABEL_PDF",
  DOWNLOAD_PDF = 'DOWNLOAD_PDF'
}

export enum LabelEndpoint {
  RAW_LABEL_GENERATOR = "RAW_LABEL_GENERATOR",
  ACTIVE_PACKAGES = "ACTIVE_PACKAGES",
}
