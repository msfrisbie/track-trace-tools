import { IFieldData } from "./interfaces";

export enum ReportsMutations {
  REPORTS_MUTATION = "REPORTS_MUTATION",
  UPDATE_SELECTED_REPORTS = "UPDATE_SELECTED_REPORTS",
  SET_STATUS = "SET_STATUS",
  SET_GENERATED_REPORT = "SET_GENERATED_REPORT",
  CHECK_ALL = "CHECK_ALL",
  UNCHECK_ALL = "UNCHECK_ALL",
  UPDATE_DYNAMIC_REPORT_DATA = "UPDATE_DYNAMIC_REPORT_DATA",
}

export enum ReportsGetters {
  REPORT_OPTIONS = "REPORT_OPTIONS",
}

export enum ReportsActions {
  RESET = "RESET",
  GENERATE_REPORT = "GENERATE_REPORT",
  RUN_AUX_REPORT_TASK = "RUN_AUX_REPORT_TASK",
  CHECK_ALL = "CHECK_ALL",
  UNCHECK_ALL = "UNCHECK_ALL",
  UPDATE_DYNAMIC_REPORT_DATA = "UPDATE_DYNAMIC_REPORT_DATA",
}

export enum ReportStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export enum ReportCategory {
  QUICKVIEW = "QUICKVIEW",
  CATALOG = "CATALOG",
  PACKAGES = "PACKAGES",
  TRANSFERS = "TRANSFERS",
  ITEMS = "ITEMS",
  EMPLOYEES = "EMPLOYEES",
  CUSTOM = "CUSTOM"
}

export enum ReportType {
  TEST = "TEST",
  COGS = "COGS",
  COGS_V2 = "COGS_V2",
  COGS_TRACKER = "COGS_TRACKER",
  PACKAGES = "PACKAGES",
  INCOMING_TRANSFERS = "INCOMING_TRANSFERS",
  OUTGOING_TRANSFERS = "OUTGOING_TRANSFERS",
  TRANSFER_HUB_TRANSFERS = "TRANSFER_HUB_TRANSFERS",
  INCOMING_MANIFEST_INVENTORY = "INCOMING_MANIFEST_INVENTORY",
  INCOMING_TRANSFER_MANIFESTS = "INCOMING_TRANSFER_MANIFESTS",
  OUTGOING_TRANSFER_MANIFESTS = "OUTGOING_TRANSFER_MANIFESTS",
  TRANSFER_HUB_TRANSFER_MANIFESTS = "TRANSFER_HUB_TRANSFER_MANIFESTS",
  MATURE_PLANTS = "MATURE_PLANTS",
  IMMATURE_PLANTS = "IMMATURE_PLANTS",
  HARVESTS = "HARVESTS",
  HARVEST_PACKAGES = "HARVEST_PACKAGES",
  TAGS = "TAGS",
  STRAGGLER_PACKAGES = "STRAGGLER_PACKAGES",
  PACKAGES_QUICKVIEW = "PACKAGES_QUICKVIEW",
  MATURE_PLANTS_QUICKVIEW = "MATURE_PLANTS_QUICKVIEW",
  IMMATURE_PLANTS_QUICKVIEW = "IMMATURE_PLANTS_QUICKVIEW",
  EMPLOYEE_SAMPLES = "EMPLOYEE_SAMPLES",
  POINT_IN_TIME_INVENTORY = "POINT_IN_TIME_INVENTORY",
  EMPLOYEE_AUDIT = "EMPLOYEE_AUDIT",
  EMPLOYEE_PERMISSIONS = "EMPLOYEE_PERMISSIONS",
  SINGLE_TRANSFER = "SINGLE_TRANSFER",
  SCAN_SHEET = "SCAN_SHEET",
  INVOICE = "INVOICE",
  LAB_RESULTS = "LAB_RESULTS",
  ITEMS_METADATA = "ITEMS_METADATA",
}

export enum ReportAuxTask {
  UPDATE_MASTER_COST_SHEET = "UPDATE_MASTER_COST_SHEET",
}

const COMMON_FIELD_DATA: IFieldData[] = [
  {
    value: "LicenseNumber",
    readableName: "Current License",
    required: true,
    initiallyChecked: true,
  },
];

const COMMON_TRANSFER_FIELD_DATA: IFieldData[] = [
  {
    value: "Transfer.LicenseNumber",
    readableName: "Current License",
    required: true,
    initiallyChecked: true,
  },
];

export enum CustomTransformer {
  CURRENT_PERCENT_WET_WEIGHT = "CURRENT_PERCENT_WET_WEIGHT",
  PACKAGED_PERCENT_WET_WEIGHT = "PACKAGED_PERCENT_WET_WEIGHT",
  WASTE_PERCENT_WET_WEIGHT = "WASTE_PERCENT_WET_WEIGHT",
  RESTORED_PERCENT_WET_WEIGHT = "RESTORED_PERCENT_WET_WEIGHT",
  TRANSFER_PACKAGE_UNIT_WEIGHT = "TRANSFER_PACKAGE_UNIT_WEIGHT",
  TRANSFER_PACKAGE_UNIT_WEIGHT_UOM = "TRANSFER_PACKAGE_UNIT_WEIGHT_UOM",
  PACKAGE_MANIFEST_INDEX = "PACKAGE_MANIFEST_INDEX",
  TRANSFER_MANIFEST_TOTAL_INCOMING_WHOLESALE_VALUE = "TRANSFER_MANIFEST_TOTAL_INCOMING_WHOLESALE_VALUE",
  TRANSFER_MANIFEST_TOTAL_OUTGOING_WHOLESALE_VALUE = "TRANSFER_MANIFEST_TOTAL_OUTGOING_WHOLESALE_VALUE",
  INCOMING_TRANSFER_JOINED_TRANSPORTERS = "INCOMING_TRANSFER_JOINED_TRANSPORTERS",
  OUTGOING_TRANSFER_JOINED_TRANSPORTER_DETAILS = "OUTGOING_TRANSFER_JOINED_TRANSPORTER_DETAILS",
  OUTGOING_TRANSFER_JOINED_TRANSPORTERS = "OUTGOING_TRANSFER_JOINED_TRANSPORTERS",
}

const COMMON_PACKAGE_FIELD_DATA: IFieldData[] = [
  ...COMMON_FIELD_DATA,
  {
    value: "Label",
    readableName: "Package Tag",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "PackageState",
    readableName: "Is Active?",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "SourcePackageLabels",
    readableName: "Source Package Labels",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Item.Name",
    readableName: "Item",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Item.ProductCategoryName",
    readableName: "Item Category",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "Item.ProductCategoryTypeName",
    readableName: "Item Category Type",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "Item.UnitWeight",
    readableName: "Unit Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "Item.UnitWeightUnitOfMeasureAbbreviation",
    readableName: "Unit Weight Unit of Measure",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "Quantity",
    readableName: "Current Quantity",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "UnitOfMeasureAbbreviation",
    readableName: "Unit of Measure",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "PackagedDate",
    readableName: "Packaged On",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "LocationName",
    readableName: "Location",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "PackagedByFacilityLicenseNumber",
    readableName: "Packaged By",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "LabTestingStateName",
    readableName: "Testing Status",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "ProductionBatchNumber",
    readableName: "Production Batch",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "SourceProductionBatchNumbers",
    readableName: "Source Production Batch Numbers",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Note",
    readableName: "Note",
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_PLANT_FIELD_DATA: IFieldData[] = [
  ...COMMON_FIELD_DATA,
  {
    value: "Label",
    readableName: "Plant Tag",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "PlantState",
    readableName: "Growth Phase",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "PlantedDate",
    readableName: "Planted Date",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "VegetativeDate",
    readableName: "Vegetative Date",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "FloweringDate",
    readableName: "Flowering Date",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "DestroyedDate",
    readableName: "Destroyed Date",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "StrainName",
    readableName: "Strain",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "LocationName",
    readableName: "Location",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "PlantBatchName",
    readableName: "Source Plant Batch",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "HarvestCount",
    readableName: "Harvest Count",
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_PLANT_BATCH_FIELD_DATA: IFieldData[] = [
  ...COMMON_FIELD_DATA,
  {
    value: "Name",
    readableName: "Plant Tag/Name",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "StrainName",
    readableName: "Strain",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "LocationName",
    readableName: "Location",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "UntrackedCount",
    readableName: "# Plants",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "TrackedCount",
    readableName: "# Tracked",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "PackagedCount",
    readableName: "# Packaged",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "HarvestedCount",
    readableName: "# Harvested",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "DestroyedCount",
    readableName: "# Destroyed",
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_INCOMING_TRANSFER_FIELD_DATA: IFieldData[] = [
  ...COMMON_TRANSFER_FIELD_DATA,
  {
    value: "Transfer.ManifestNumber",
    readableName: "Manifest #",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Transfer.TransferState",
    readableName: "Transfer Status",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Transfer.ShipmentTypeName",
    readableName: "Transfer Type",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Transfer.DeliveryPackageCount",
    readableName: "Package Count",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Transfer.ShipperFacilityName",
    readableName: "Shipper Name",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.ShipperFacilityLicenseNumber",
    readableName: "Shipper License",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.RecipientFacilityName",
    readableName: "Recipient Name",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.RecipientFacilityLicenseNumber",
    readableName: "Recipient License",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.EstimatedDepartureDateTime",
    readableName: "ETD",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.EstimatedArrivalDateTime",
    readableName: "ETA",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.IsVoided",
    readableName: "Is Voided?",
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_OUTGOING_TRANSFER_FIELD_DATA: IFieldData[] = [
  ...COMMON_TRANSFER_FIELD_DATA,
  {
    value: "Transfer.ManifestNumber",
    readableName: "Manifest #",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Transfer.TransferState",
    readableName: "Transfer Status",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Destination.ShipmentTypeName",
    readableName: "Transfer Type",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Destination.DeliveryPackageCount",
    readableName: "Package Count",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Transfer.ShipperFacilityName",
    readableName: "Shipper Name",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Transfer.ShipperFacilityLicenseNumber",
    readableName: "Shipper License",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Destination.RecipientFacilityName",
    readableName: "Recipient Name",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Destination.RecipientFacilityLicenseNumber",
    readableName: "Recipient License",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Destination.EstimatedDepartureDateTime",
    readableName: "ETD",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Destination.EstimatedArrivalDateTime",
    readableName: "ETA",
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_TAG_FIELD_DATA: IFieldData[] = [
  ...COMMON_FIELD_DATA,
  {
    value: "Label",
    readableName: "Tag",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "TagTypeName",
    readableName: "Tag Type",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "StatusName",
    readableName: "Status",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Used Datetime",
    readableName: "UsedDateTime",
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_HARVEST_FIELD_DATA: IFieldData[] = [
  ...COMMON_FIELD_DATA,
  {
    value: "Name",
    readableName: "Harvest Batch",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "HarvestState",
    readableName: "Harvest Status",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "SourceStrainNames",
    readableName: "Strain Names",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "TotalWetWeight",
    readableName: "Wet Weight",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "CurrentWeight",
    readableName: "Current Weight",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "UnitOfWeightAbbreviation",
    readableName: "Unit of Weight",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "UnitOfWeightAbbreviation",
    readableName: "Unit of Measure",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "CurrentWeightPercent",
    readableName: "Current % Wet Weight",
    required: false,
    initiallyChecked: true,
    customTransformer: CustomTransformer.CURRENT_PERCENT_WET_WEIGHT,
  },
  {
    value: "TotalPackagedWeight",
    readableName: "Packaged Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "PackagedWeightPercent",
    readableName: "Packaged % Wet Weight",
    required: false,
    initiallyChecked: false,
    customTransformer: CustomTransformer.PACKAGED_PERCENT_WET_WEIGHT,
  },
  {
    value: "TotalWasteWeight",
    readableName: "Waste Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "WasteWeightPercent",
    readableName: "Waste % Wet Weight",
    required: false,
    initiallyChecked: false,
    customTransformer: CustomTransformer.WASTE_PERCENT_WET_WEIGHT,
  },
  {
    value: "TotalRestoredWeight",
    readableName: "Restored Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "RestoredWeightPercent",
    readableName: "Restored % Wet Weight",
    required: false,
    initiallyChecked: false,
    customTransformer: CustomTransformer.RESTORED_PERCENT_WET_WEIGHT,
  },
  {
    value: "HarvestStartDate",
    readableName: "Harvest Date",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "HarvestType",
    readableName: "Harvest Type",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "PlantCount",
    readableName: "Plant Count",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "TotalPackagedWeight",
    readableName: "Total Packaged Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "TotalRestoredWeight",
    readableName: "Total Restored Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "TotalWasteWeight",
    readableName: "Total Waste Weight",
    required: false,
    initiallyChecked: false,
  },
  {
    value: "TotalWetWeight",
    readableName: "Total Wet Weight",
    required: false,
    initiallyChecked: false,
  },
];

const COMMON_TRANSFER_PACKAGE_DATA: IFieldData[] = [
  ...COMMON_FIELD_DATA,
  {
    value: "Package.PackageLabel",
    readableName: "Package Tag",
    required: true,
    initiallyChecked: true,
  },
  {
    value: "Package.ProductName",
    readableName: "Item",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Package.SourcePackageLabels",
    readableName: "Source Packages",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Package.ProductionBatchNumber",
    readableName: "Production Batch Number",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Package.ShippedQuantity",
    readableName: "Quantity",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Package.ShippedUnitOfMeasureAbbreviation",
    readableName: "Unit of Measure",
    required: false,
    initiallyChecked: true,
  },
  {
    value: "Package.ShipperWholesalePrice",
    readableName: "Wholesale Price",
    required: false,
    initiallyChecked: true,
  },
];

// Used to unpack arrays of objects and auto-generate column headers
export const SHEET_FIELDS: { [key: string]: IFieldData[] } = {
  [ReportType.IMMATURE_PLANTS]: [...COMMON_PLANT_BATCH_FIELD_DATA],
  [ReportType.HARVESTS]: [...COMMON_HARVEST_FIELD_DATA],
  [ReportType.TAGS]: [...COMMON_TAG_FIELD_DATA],
  [ReportType.MATURE_PLANTS]: [...COMMON_PLANT_FIELD_DATA],
  [ReportType.PACKAGES]: [
    ...COMMON_PACKAGE_FIELD_DATA,
    {
      value: "initialQuantity",
      readableName: "Initial Quantity",
      required: false,
      initiallyChecked: false,
      checkedMessage:
        "This column requires additional data to load, report generation may be slower",
    },
    {
      value: "initialQuantityUnitOfMeasure",
      readableName: "Initial Quantity Unit of Measure",
      required: false,
      initiallyChecked: false,
      checkedMessage:
        "This column requires additional data to load, report generation may be slower",
    },
    {
      value: "totalInputQuantity",
      readableName: "Total Input Quantity",
      required: false,
      initiallyChecked: false,
      checkedMessage:
        "This column requires additional data to load, report generation may be slower",
    },
    {
      value: "totalInputQuantityUnitOfMeasure",
      readableName: "Total Input Quantity Unit of Measure",
      required: false,
      initiallyChecked: false,
      checkedMessage:
        "This column requires additional data to load, report generation may be slower",
    },
  ],
  [ReportType.STRAGGLER_PACKAGES]: [...COMMON_PACKAGE_FIELD_DATA],
  [ReportType.INCOMING_TRANSFERS]: [...COMMON_INCOMING_TRANSFER_FIELD_DATA],
  [ReportType.OUTGOING_TRANSFERS]: [...COMMON_OUTGOING_TRANSFER_FIELD_DATA],
  [ReportType.TRANSFER_HUB_TRANSFERS]: [...COMMON_OUTGOING_TRANSFER_FIELD_DATA],
  [ReportType.INCOMING_TRANSFER_MANIFESTS]: [
    ...COMMON_INCOMING_TRANSFER_FIELD_DATA,
    {
      value: "IncomingTransferJoinedTransporters",
      readableName: "Incoming Transfer Transporter",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.INCOMING_TRANSFER_JOINED_TRANSPORTERS,
    },
    ...COMMON_TRANSFER_PACKAGE_DATA,
    {
      value: "ManifestTotalIncomingWholesaleValue",
      readableName: "Manifest Total Incoming Wholesale Value",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.TRANSFER_MANIFEST_TOTAL_INCOMING_WHOLESALE_VALUE,
    },
  ],
  [ReportType.INCOMING_MANIFEST_INVENTORY]: [
    {
      value: "Transfer.ManifestNumber",
      readableName: "Manifest #",
      required: true,
      initiallyChecked: true,
    },
    {
      value: "Package.ManifestIndex",
      readableName: "Package Manifest Index",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.PACKAGE_MANIFEST_INDEX,
    },
    {
      value: "Package.PackageLabel",
      readableName: "Package",
      required: true,
      initiallyChecked: true,
    },
    {
      value: "Package.SourceHarvestNames",
      readableName: "Source Harvest(s)",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.SourcePackageLabels",
      readableName: "Source Package(s)",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ProductName",
      readableName: "Item",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ProductCategoryName",
      readableName: "Category",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ItemStrainName",
      readableName: "Item Strain",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.LabTestingStateName",
      readableName: "Transfer Lab Testing State",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ShippedQuantity",
      readableName: "Shipped Quantity",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.GrossWeight",
      readableName: "Gross Weight",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ShipperWholesalePrice",
      readableName: "Shipper Wholesale Price",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ReceivedQuantity",
      readableName: "Received Quantity",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ReceiverWholesalePrice",
      readableName: "Receiver Wholesale Price",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "Package.ShipmentPackageState",
      readableName: "Status",
      required: false,
      initiallyChecked: true,
    },
    {
      value: "UnitWeight",
      readableName: "Unit Weight",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.TRANSFER_PACKAGE_UNIT_WEIGHT,
    },
    {
      value: "UnitWeightUOM",
      readableName: "Unit Weight UOM",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.TRANSFER_PACKAGE_UNIT_WEIGHT_UOM,
    },
  ],
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]: [
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(0, 5),
    ...COMMON_TRANSFER_PACKAGE_DATA.slice(1),

    {
      value: "OutgoingTransferJoinedTransporters",
      readableName: "Outgoing Transfer Transporters",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.OUTGOING_TRANSFER_JOINED_TRANSPORTERS,
    },

    {
      value: "OutgoingTransferJoinedTransporterDetails",
      readableName: "Outgoing Transfer Transporter Details",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.OUTGOING_TRANSFER_JOINED_TRANSPORTER_DETAILS,
    },
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(5),
    {
      value: "ManifestTotalOutgoingWholesaleValue",
      readableName: "Manifest Total Outgoing Wholesale Value",
      required: false,
      initiallyChecked: true,
      customTransformer: CustomTransformer.TRANSFER_MANIFEST_TOTAL_OUTGOING_WHOLESALE_VALUE,
    },
  ],
  [ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS]: [
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(0, 5),
    ...COMMON_TRANSFER_PACKAGE_DATA.slice(1),
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(5),
  ],
};

export interface IStatusMessage {
  text: string;
  level: "success" | "warning" | "error";
}

export const PRODUCT_UNIT_WEIGHT_REGEX = /(\d*\.?\d+)\s*(g|mg)/;
