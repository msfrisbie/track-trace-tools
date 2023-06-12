export enum CreatePackageCsvColumns {
  NEW_PACKAGE_TAG = "New Package Tag",
  LOCATION_NAME = "Location Name",
  ITEM_NAME = "Item Name",
  NEW_PACKAGE_QUANTITY = "New Package Quantity",
  NEW_PACKAGE_UNIT = "New Package Unit",
  PACKAGED_DATE = "Packaged Date",
  NOTE = "Note",
  PRODUCTION_BATCH_NUMBER = "Production Batch Number",
  IS_DONATION = "Is Donation?",
  IS_TRADE_SAMPLE = "Is Trade Sample?",
  SOURCE_PACKAGE_TAG_PREFIX = "Source Package Tag",
  SOURCE_PACKAGE_QUANTITY_PREFIX = "Source Package Quantity",
}

export enum CreatePackageCsvMutations {
  CREATE_PACKAGE_CSV_MUTATION = "CREATE_PACKAGE_CSV_MUTATION",
}

export enum CreatePackageCsvGetters {
  CREATE_PACKAGE_CSV_GETTER = "CREATE_PACKAGE_CSV_GETTER",
}

export enum CreatePackageCsvActions {
  GENERATE_CSV_TEMPLATE = "GENERATE_CSV_TEMPLATE",
}
