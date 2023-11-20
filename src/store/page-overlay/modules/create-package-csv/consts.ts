export enum CreatePackageCsvColumns {
  NEW_PACKAGE_TAG = 'New Package Tag',
  LOCATION_NAME = 'Location Name',
  ITEM_NAME = 'Item Name',
  NEW_PACKAGE_QUANTITY = 'New Package Quantity',
  NEW_PACKAGE_UNIT = 'New Package Unit',
  PACKAGED_DATE = 'Packaged Date',
  NOTE = 'Note',
  PRODUCTION_BATCH_NUMBER = 'Production Batch Number',
  IS_DONATION = 'Is Donation?',
  IS_TRADE_SAMPLE = 'Is Trade Sample?',
  SOURCE_PACKAGE_TAG_PREFIX = 'Source Package Tag',
  SOURCE_PACKAGE_QUANTITY_PREFIX = 'Source Package Quantity',
  EXPIRATION_DATE = 'Expiration Date',
}

export enum CreatePackageCsvMutations {
  CREATE_PACKAGE_CSV_MUTATION = 'CREATE_PACKAGE_CSV_MUTATION',
}

export enum CreatePackageCsvGetters {
  CREATE_PACKAGE_CSV_GETTER = 'CREATE_PACKAGE_CSV_GETTER',
}

export enum CreatePackageCsvActions {
  GENERATE_CSV_TEMPLATE = 'GENERATE_CSV_TEMPLATE',
  IMPORT_CSV = 'IMPORT_CSV',
  RESET = 'RESET',
}

export enum PackageCsvStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  PARSED = "PARSED",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS"
}

export const CREATE_PACKAGE_CSV_COLUMNS: {value: CreatePackageCsvColumns, required: boolean, defaultDescription: string}[] = [
  {
    value: CreatePackageCsvColumns.NEW_PACKAGE_TAG,
    required: true,
    defaultDescription: "",
  },
  {
    value: CreatePackageCsvColumns.LOCATION_NAME,
    required: false,
    defaultDescription: "Same location as 1st parent package",
  },
  {
    value: CreatePackageCsvColumns.ITEM_NAME,
    required: false,
    defaultDescription: "Same item as 1st parent package",
  },
  {
    value: CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY,
    required: false,
    defaultDescription: "Sum of parent quantities",
  },
  {
    value: CreatePackageCsvColumns.NEW_PACKAGE_UNIT,
    required: false,
    defaultDescription: "Same unit as parent package",
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
