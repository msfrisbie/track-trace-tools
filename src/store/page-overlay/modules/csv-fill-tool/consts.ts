export enum CsvFillToolMutations {
  CSV_FILL_TOOL_MUTATION = "CSV_FILL_TOOL_MUTATION",
}

export enum CsvFillToolGetters {
  CSV_FILL_TOOL_GETTER = "CSV_FILL_TOOL_GETTER",
}

export enum CsvFillToolActions {
  FILL_CSV_INTO_MODAL_FORM = "FILL_CSV_INTO_MODAL_FORM",
  DOWNLOAD_TEMPLATE = "DOWNLOAD_TEMPLATE",
  DUMP_FORM = "DUMP_FORM",
}

export const FORM_RENDER_DELAY_MS = 500;

export const HIDDEN_ROW_MODELS = [
  "ProductPhotos",
  "LabelPhotos",
  "PackagingPhotos",
  "ItemIngredients",
];
