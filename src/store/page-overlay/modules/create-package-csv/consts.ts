export enum CreatePackageCsvColumns {
  NEW_PACKAGE_TAG = "New Package Tag",
  SOURCE_PACKAGE_TAG = "Source Package Tag",
  SOURCE_PACKAGE_QUANTITY_USED = "Source Package Quantity Used",
  SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE = "Source Package Quantity Unit of Measure",
  LOCATION_NAME = "Location Name",
  ITEM_NAME = "Item Name",
  NEW_PACKAGE_QUANTITY = "New Package Quantity",
  NEW_PACKAGE_UNIT_OF_MEASURE = "New Package Unit",
  PACKAGED_DATE = "Packaged Date",
  NOTE = "Note",
  PRODUCTION_BATCH_NUMBER = "Production Batch Number",
  IS_DONATION = "Is Donation?",
  IS_TRADE_SAMPLE = "Is Trade Sample?",
  EXPIRATION_DATE = "Expiration Date",
}

export enum CreatePackageCsvMutations {
  CREATE_PACKAGE_CSV_MUTATION = "CREATE_PACKAGE_CSV_MUTATION",
}

export enum CreatePackageCsvGetters {
  ELIGIBLE_FOR_SUBMIT = "ELIGIBLE_FOR_SUBMIT",
  TOTAL_ERROR_COUNT = "TOTAL_ERROR_COUNT",
}

export enum CreatePackageCsvActions {
  GENERATE_CSV_TEMPLATE = "GENERATE_CSV_TEMPLATE",
  IMPORT_CSV = "IMPORT_CSV",
  PARSE_CSV_DATA = "PARSE_CSV_DATA",
  RESET = "RESET",
}

export enum PackageCsvStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  PARSED = "PARSED",
  ERROR = "ERROR",
}

export const CREATE_PACKAGE_CSV_COLUMNS: {
  value: CreatePackageCsvColumns;
  required: boolean;
  defaultDescription: string;
}[] = [
  {
    value: CreatePackageCsvColumns.SOURCE_PACKAGE_TAG,
    required: true,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED,
    required: true,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE,
    required: false,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.NEW_PACKAGE_TAG,
    required: true,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.LOCATION_NAME,
    required: false,
    defaultDescription: "Same location as 1st source package",
  },
  {
    value: CreatePackageCsvColumns.ITEM_NAME,
    required: false,
    defaultDescription: "Same item as 1st source package",
  },
  {
    value: CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY,
    required: false,
    defaultDescription: "Sum of source quantities",
  },
  {
    value: CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE,
    required: false,
    defaultDescription: "Same unit as source package",
  },
  {
    value: CreatePackageCsvColumns.PACKAGED_DATE,
    required: false,
    defaultDescription: "Today",
  },
  {
    value: CreatePackageCsvColumns.NOTE,
    required: false,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER,
    required: false,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.IS_DONATION,
    required: false,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.IS_TRADE_SAMPLE,
    required: false,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.EXPIRATION_DATE,
    required: false,
    defaultDescription: "Same as parent package",
  },
];
