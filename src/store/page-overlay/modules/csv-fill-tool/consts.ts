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

export const FORM_RENDER_DELAY_MS = 300;

export const DELAY_SECTION_GROUP_NAMES: string[] = [
  "line.ProductPhotos",
  "line.LabelPhotos",
  "line.PackagingPhotos"
];

export const ZERO_INITIAL_LINES_SECTION_GROUP_NAMES: string[] = [
  "line.ItemIngredients",
  "line.ProductPhotos",
  "line.LabelPhotos",
  "line.PackagingPhotos"
];

export const HIDDEN_ROW_ATTRIBUTES: {
  ngClickPartial: string,
  ngModel: string
  requiresRenderDelay: boolean
}[] = [
  { ngClickPartial: "ProductPhotos", ngModel: "ProductPhotos", requiresRenderDelay: true },
  { ngClickPartial: "LabelPhotos", ngModel: "LabelPhotos", requiresRenderDelay: true },
  { ngClickPartial: "PackagingPhotos", ngModel: "PackagingPhotos", requiresRenderDelay: true },
  { ngClickPartial: "ItemIngredients", ngModel: "itemIngredient.Ingredient", requiresRenderDelay: false },
];
