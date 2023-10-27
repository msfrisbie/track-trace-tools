import { IFieldData } from "./interfaces";

export enum ReportsMutations {
  SET_STATUS = "SET_STATUS",
  SET_GENERATED_SPREADSHEET = "SET_GENERATED_SPREADSHEET",
}

export enum ReportsGetters {}

export enum ReportsActions {
  RESET = "RESET",
  GENERATE_REPORT = "GENERATE_REPORT",
  RUN_AUX_REPORT_TASK = "RUN_AUX_REPORT_TASK",
}

export enum ReportStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
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
  OUTGOING_TRANSFER_MANIFESTS = "OUTGOING_TRANSFER_MANIFESTS",
  TRANSFER_HUB_TRANSFER_MANIFESTS = "TRANSFER_HUB_TRANSFER_MANIFESTS",
  MATURE_PLANTS = "MATURE_PLANTS",
  IMMATURE_PLANTS = "IMMATURE_PLANTS",
  HARVESTS = "HARVESTS",
  HARVEST_PACKAGES = "HARVEST_PACKAGES",
  TAGS = "TAGS",
  STRAGGLER_PACKAGES = "STRAGGLER_PACKAGES",
  MATURE_PLANTS_QUICKVIEW = "MATURE_PLANTS_QUICKVIEW",
  IMMATURE_PLANTS_QUICKVIEW = "IMMATURE_PLANTS_QUICKVIEW",
  EMPLOYEE_SAMPLES = "EMPLOYEE_SAMPLES",
  POINT_IN_TIME_INVENTORY = "POINT_IN_TIME_INVENTORY",
  EMPLOYEE_AUDIT = "EMPLOYEE_AUDIT",
}

export enum ReportAuxTask {
  UPDATE_MASTER_COST_SHEET = "UPDATE_MASTER_COST_SHEET",
}

export const ALL_ELIGIBLE_REPORT_TYPES: ReportType[] = [
  ReportType.PACKAGES,
  ReportType.STRAGGLER_PACKAGES,
  ReportType.TAGS,
  ReportType.HARVESTS,
  ReportType.HARVEST_PACKAGES,
  ReportType.IMMATURE_PLANTS,
  ReportType.MATURE_PLANTS,
  ReportType.IMMATURE_PLANTS_QUICKVIEW,
  ReportType.MATURE_PLANTS_QUICKVIEW,
  ReportType.INCOMING_TRANSFERS,
  ReportType.OUTGOING_TRANSFERS,
  ReportType.TRANSFER_HUB_TRANSFERS,
  ReportType.OUTGOING_TRANSFER_MANIFESTS,
  ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS,
  ReportType.POINT_IN_TIME_INVENTORY,
  ReportType.EMPLOYEE_AUDIT,
];

export const FIELD_TRANSFORMER_REPORT_TYPES: ReportType[] = [
  ReportType.PACKAGES,
  ReportType.STRAGGLER_PACKAGES,
  ReportType.TAGS,
  ReportType.HARVESTS,
  ReportType.IMMATURE_PLANTS,
  ReportType.MATURE_PLANTS,
  ReportType.INCOMING_TRANSFERS,
  ReportType.OUTGOING_TRANSFERS,
  ReportType.TRANSFER_HUB_TRANSFERS,
  ReportType.OUTGOING_TRANSFER_MANIFESTS,
  ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS,
];
export const QUICKVIEW_REPORT_TYPES: ReportType[] = [
  ReportType.IMMATURE_PLANTS_QUICKVIEW,
  ReportType.MATURE_PLANTS_QUICKVIEW,
];
export const RAW_REPORT_TYPES: ReportType[] = [
  ReportType.EMPLOYEE_AUDIT,
  ReportType.HARVEST_PACKAGES,
];

const COMMON_PACKAGE_FIELD_DATA: IFieldData[] = [
  {
    value: "Label",
    readableName: "Package Tag",
    required: true,
  },
  {
    value: "LicenseNumber",
    readableName: "Current License",
    required: true,
  },
  {
    value: "PackageState",
    readableName: "Is Active?",
    required: true,
  },
  {
    value: "SourcePackageLabels",
    readableName: "Source Package Labels",
    required: false,
  },
  {
    value: "Item.Name",
    readableName: "Item",
    required: false,
  },
  {
    value: "Item.ProductCategoryName",
    readableName: "Item Category",
    required: false,
  },
  {
    value: "Item.ProductCategoryTypeName",
    readableName: "Item Category Type",
    required: false,
  },
  {
    value: "Quantity",
    readableName: "Package Quantity",
    required: false,
  },
  {
    value: "UnitOfMeasureAbbreviation",
    readableName: "Unit of Measure",
    required: false,
  },
  {
    value: "PackagedDate",
    readableName: "Packaged On",
    required: false,
  },
  {
    value: "LocationName",
    readableName: "Location",
    required: false,
  },
  {
    value: "PackagedByFacilityLicenseNumber",
    readableName: "Packaged By",
    required: false,
  },
  {
    value: "LabTestingStateName",
    readableName: "Testing Status",
    required: false,
  },
  {
    value: "ProductionBatchNumber",
    readableName: "Production Batch",
    required: false,
  },
  {
    value: "SourceProductionBatchNumbers",
    readableName: "Source Production Batch Numbers",
    required: false,
  },
];
const COMMON_PLANT_FIELD_DATA: IFieldData[] = [
  {
    value: "Label",
    readableName: "Plant Tag",
    required: true,
  },
  {
    value: "LicenseNumber",
    readableName: "Current License",
    required: true,
  },
  {
    value: "PlantState",
    readableName: "Growth Phase",
    required: true,
  },
  {
    value: "PlantedDate",
    readableName: "Planted Date",
    required: false,
  },
  {
    value: "VegetativeDate",
    readableName: "Vegetative Date",
    required: false,
  },
  {
    value: "FloweringDate",
    readableName: "Flowering Date",
    required: false,
  },
  {
    value: "DestroyedDate",
    readableName: "Destroyed Date",
    required: false,
  },
  {
    value: "StrainName",
    readableName: "Strain",
    required: false,
  },
  {
    value: "LocationName",
    readableName: "Location",
    required: false,
  },
  {
    value: "PlantBatchName",
    readableName: "Source Plant Batch",
    required: false,
  },
  {
    value: "HarvestCount",
    readableName: "Harvest Count",
    required: false,
  },
];
const COMMON_PLANT_BATCH_FIELD_DATA: IFieldData[] = [
  {
    value: "Name",
    readableName: "Plant Tag/Name",
    required: true,
  },
  {
    value: "LicenseNumber",
    readableName: "Current License",
    required: true,
  },
  {
    value: "StrainName",
    readableName: "Strain",
    required: false,
  },
  {
    value: "LocationName",
    readableName: "Location",
    required: false,
  },
  {
    value: "UntrackedCount",
    readableName: "# Plants",
    required: true,
  },
  {
    value: "TrackedCount",
    readableName: "# Tracked",
    required: false,
  },
  {
    value: "PackagedCount",
    readableName: "# Packaged",
    required: false,
  },
  {
    value: "HarvestedCount",
    readableName: "# Harvested",
    required: false,
  },
  {
    value: "DestroyedCount",
    readableName: "# Destroyed",
    required: false,
  },
];
const COMMON_INCOMING_TRANSFER_FIELD_DATA: IFieldData[] = [
  {
    value: "Transfer.ManifestNumber",
    readableName: "Manifest #",
    required: true,
  },
  {
    value: "Transfer.TransferState",
    readableName: "Transfer Status",
    required: true,
  },
  {
    value: "Transfer.ShipmentTypeName",
    readableName: "Transfer Type",
    required: true,
  },
  {
    value: "Transfer.DeliveryPackageCount",
    readableName: "Package Count",
    required: true,
  },
  {
    value: "Transfer.ShipperFacilityName",
    readableName: "Shipper Name",
    required: false,
  },
  {
    value: "Transfer.ShipperFacilityLicenseNumber",
    readableName: "Shipper License",
    required: false,
  },
  {
    value: "Transfer.RecipientFacilityName",
    readableName: "Recipient Name",
    required: false,
  },
  {
    value: "Transfer.RecipientFacilityLicenseNumber",
    readableName: "Recipient License",
    required: false,
  },
  {
    value: "Transfer.EstimatedDepartureDateTime",
    readableName: "ETD",
    required: false,
  },
  {
    value: "Transfer.EstimatedArrivalDateTime",
    readableName: "ETA",
    required: false,
  },
];
const COMMON_OUTGOING_TRANSFER_FIELD_DATA: IFieldData[] = [
  {
    value: "Transfer.ManifestNumber",
    readableName: "Manifest #",
    required: true,
  },
  {
    value: "Transfer.TransferState",
    readableName: "Transfer Status",
    required: true,
  },
  {
    value: "Destination.ShipmentTypeName",
    readableName: "Transfer Type",
    required: true,
  },
  {
    value: "Destination.DeliveryPackageCount",
    readableName: "Package Count",
    required: true,
  },
  {
    value: "Transfer.ShipperFacilityName",
    readableName: "Shipper Name",
    required: false,
  },
  {
    value: "Transfer.ShipperFacilityLicenseNumber",
    readableName: "Shipper License",
    required: false,
  },
  {
    value: "Destination.RecipientFacilityName",
    readableName: "Recipient Name",
    required: false,
  },
  {
    value: "Destination.RecipientFacilityLicenseNumber",
    readableName: "Recipient License",
    required: false,
  },
  {
    value: "Destination.EstimatedDepartureDateTime",
    readableName: "ETD",
    required: false,
  },
  {
    value: "Destination.EstimatedArrivalDateTime",
    readableName: "ETA",
    required: false,
  },
];
const COMMON_TAG_FIELD_DATA: IFieldData[] = [
  {
    value: "Label",
    readableName: "Tag",
    required: true,
  },
  {
    value: "LicenseNumber",
    readableName: "Current License",
    required: true,
  },
  {
    value: "TagTypeName",
    readableName: "Tag Type",
    required: true,
  },
  {
    value: "StatusName",
    readableName: "Status",
    required: true,
  },
];
const COMMON_HARVEST_FIELD_DATA: IFieldData[] = [
  {
    value: "Name",
    readableName: "Harvest Batch",
    required: true,
  },
  {
    value: "LicenseNumber",
    readableName: "Current License",
    required: true,
  },
  {
    value: "HarvestState",
    readableName: "Harvest Status",
    required: true,
  },
  {
    value: "CurrentWeight",
    readableName: "Current Weight",
    required: true,
  },
  {
    value: "HarvestStartDate",
    readableName: "Harvest Date",
    required: false,
  },
  {
    value: "HarvestType",
    readableName: "Harvest Type",
    required: false,
  },
];

const COMMON_OUTGOING_TRANSFER_PACKAGE_DATA: IFieldData[] = [
  {
    value: "Package.PackageLabel",
    readableName: "Package Tag",
    required: true,
  },
  {
    value: "Package.ProductName",
    readableName: "Item",
    required: false,
  },
  {
    value: "Package.ShippedQuantity",
    readableName: "Quantity",
    required: false,
  },
  {
    value: "Package.ShippedUnitOfMeasureAbbreviation",
    readableName: "Unit of Measure",
    required: false,
  },
];

// Used to unpack arrays of objects and auto-generate column headers
export const SHEET_FIELDS: { [key: string]: IFieldData[] } = {
  [ReportType.IMMATURE_PLANTS]: [...COMMON_PLANT_BATCH_FIELD_DATA],
  [ReportType.HARVESTS]: [...COMMON_HARVEST_FIELD_DATA],
  [ReportType.TAGS]: [...COMMON_TAG_FIELD_DATA],
  [ReportType.MATURE_PLANTS]: [...COMMON_PLANT_FIELD_DATA],
  [ReportType.PACKAGES]: [...COMMON_PACKAGE_FIELD_DATA],
  [ReportType.STRAGGLER_PACKAGES]: [...COMMON_PACKAGE_FIELD_DATA],
  [ReportType.INCOMING_TRANSFERS]: [...COMMON_INCOMING_TRANSFER_FIELD_DATA],
  [ReportType.OUTGOING_TRANSFERS]: [...COMMON_OUTGOING_TRANSFER_FIELD_DATA],
  [ReportType.TRANSFER_HUB_TRANSFERS]: [...COMMON_OUTGOING_TRANSFER_FIELD_DATA],
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]: [
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(0, 4),
    ...COMMON_OUTGOING_TRANSFER_PACKAGE_DATA,
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(4),
  ],
  [ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS]: [
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(0, 4),
    ...COMMON_OUTGOING_TRANSFER_PACKAGE_DATA,
    ...COMMON_OUTGOING_TRANSFER_FIELD_DATA.slice(4),
  ],
};

export interface IStatusMessage {
  text: string;
  level: "success" | "warning" | "error";
}
