import { IFieldData } from './interfaces';

export enum ReportsMutations {
  SET_STATUS = 'SET_STATUS',
  SET_GENERATED_SPREADSHEET = 'SET_GENERATED_SPREADSHEET',
}

export enum ReportsGetters {}

export enum ReportsActions {
  RESET = 'RESET',
  GENERATE_REPORT = 'GENERATE_REPORT',
  RUN_AUX_REPORT_TASK = 'RUN_AUX_REPORT_TASK',
}

export enum ReportStatus {
  INITIAL = 'INITIAL',
  INFLIGHT = 'INFLIGHT',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum ReportType {
  TEST = 'TEST',
  COGS = 'COGS',
  COGS_V2 = 'COGS_V2',
  COGS_TRACKER = 'COGS_TRACKER',
  PACKAGES = 'PACKAGES',
  INCOMING_TRANSFERS = 'INCOMING_TRANSFERS',
  OUTGOING_TRANSFERS = 'OUTGOING_TRANSFERS',
  TRANSFER_HUB_TRANSFERS = 'TRANSFER_HUB_TRANSFERS',
  OUTGOING_TRANSFER_MANIFESTS = 'OUTGOING_TRANSFER_MANIFESTS',
  TRANSFER_HUB_TRANSFER_MANIFESTS = 'TRANSFER_HUB_TRANSFER_MANIFESTS',
  MATURE_PLANTS = 'MATURE_PLANTS',
  IMMATURE_PLANTS = 'IMMATURE_PLANTS',
  HARVESTS = 'HARVESTS',
  HARVEST_PACKAGES = 'HARVEST_PACKAGES',
  TAGS = 'TAGS',
  STRAGGLER_PACKAGES = 'STRAGGLER_PACKAGES',
  PACKAGES_QUICKVIEW = 'PACKAGES_QUICKVIEW',
  MATURE_PLANTS_QUICKVIEW = 'MATURE_PLANTS_QUICKVIEW',
  IMMATURE_PLANTS_QUICKVIEW = 'IMMATURE_PLANTS_QUICKVIEW',
  // TRANSFER_QUICKVIEW = 'TRANSFER_QUICKVIEW',
  EMPLOYEE_SAMPLES = 'EMPLOYEE_SAMPLES',
  POINT_IN_TIME_INVENTORY = 'POINT_IN_TIME_INVENTORY',
  EMPLOYEE_AUDIT = 'EMPLOYEE_AUDIT',
  SINGLE_TRANSFER = 'SINGLE_TRANSFER',
}

export enum ReportAuxTask {
  UPDATE_MASTER_COST_SHEET = 'UPDATE_MASTER_COST_SHEET',
}

export const ALL_ELIGIBLE_REPORT_TYPES: ReportType[] = [
  ReportType.PACKAGES,
  ReportType.STRAGGLER_PACKAGES,
  ReportType.TAGS,
  ReportType.HARVESTS,
  ReportType.HARVEST_PACKAGES,
  ReportType.IMMATURE_PLANTS,
  ReportType.MATURE_PLANTS,
  ReportType.PACKAGES_QUICKVIEW,
  ReportType.IMMATURE_PLANTS_QUICKVIEW,
  ReportType.MATURE_PLANTS_QUICKVIEW,
  ReportType.INCOMING_TRANSFERS,
  ReportType.OUTGOING_TRANSFERS,
  ReportType.TRANSFER_HUB_TRANSFERS,
  ReportType.OUTGOING_TRANSFER_MANIFESTS,
  ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS,
  ReportType.POINT_IN_TIME_INVENTORY,
  ReportType.EMPLOYEE_AUDIT,
  ReportType.SINGLE_TRANSFER
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
  ReportType.PACKAGES_QUICKVIEW,
  ReportType.IMMATURE_PLANTS_QUICKVIEW,
  ReportType.MATURE_PLANTS_QUICKVIEW,
];
export const RAW_REPORT_TYPES: ReportType[] = [
  ReportType.EMPLOYEE_AUDIT,
  ReportType.HARVEST_PACKAGES,
];
export const CUSTOM_REPORT_TYPES: ReportType[] = [
  ReportType.COGS,
  ReportType.COGS_TRACKER,
  ReportType.COGS_V2,
  ReportType.HARVEST_PACKAGES,
  ReportType.EMPLOYEE_SAMPLES,
];

const COMMON_PACKAGE_FIELD_DATA: IFieldData[] = [
  {
    value: 'Label',
    readableName: 'Package Tag',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'LicenseNumber',
    readableName: 'Current License',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'PackageState',
    readableName: 'Is Active?',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'SourcePackageLabels',
    readableName: 'Source Package Labels',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Item.Name',
    readableName: 'Item',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Item.ProductCategoryName',
    readableName: 'Item Category',
    required: false,
    initiallyChecked: false,
  },
  {
    value: 'Item.ProductCategoryTypeName',
    readableName: 'Item Category Type',
    required: false,
    initiallyChecked: false,
  },
  {
    value: 'Item.UnitWeight',
    readableName: 'Unit Weight',
    required: false,
    initiallyChecked: false,
  },
  {
    value: 'Item.UnitWeightUnitOfMeasureAbbreviation',
    readableName: 'Unit Weight Unit of Measure',
    required: false,
    initiallyChecked: false,
  },
  {
    value: 'Quantity',
    readableName: 'Current Quantity',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'UnitOfMeasureAbbreviation',
    readableName: 'Unit of Measure',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'PackagedDate',
    readableName: 'Packaged On',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'LocationName',
    readableName: 'Location',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'PackagedByFacilityLicenseNumber',
    readableName: 'Packaged By',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'LabTestingStateName',
    readableName: 'Testing Status',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'ProductionBatchNumber',
    readableName: 'Production Batch',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'SourceProductionBatchNumbers',
    readableName: 'Source Production Batch Numbers',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Note',
    readableName: 'Note',
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_PLANT_FIELD_DATA: IFieldData[] = [
  {
    value: 'Label',
    readableName: 'Plant Tag',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'LicenseNumber',
    readableName: 'Current License',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'PlantState',
    readableName: 'Growth Phase',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'PlantedDate',
    readableName: 'Planted Date',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'VegetativeDate',
    readableName: 'Vegetative Date',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'FloweringDate',
    readableName: 'Flowering Date',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'DestroyedDate',
    readableName: 'Destroyed Date',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'StrainName',
    readableName: 'Strain',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'LocationName',
    readableName: 'Location',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'PlantBatchName',
    readableName: 'Source Plant Batch',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'HarvestCount',
    readableName: 'Harvest Count',
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_PLANT_BATCH_FIELD_DATA: IFieldData[] = [
  {
    value: 'Name',
    readableName: 'Plant Tag/Name',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'LicenseNumber',
    readableName: 'Current License',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'StrainName',
    readableName: 'Strain',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'LocationName',
    readableName: 'Location',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'UntrackedCount',
    readableName: '# Plants',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'TrackedCount',
    readableName: '# Tracked',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'PackagedCount',
    readableName: '# Packaged',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'HarvestedCount',
    readableName: '# Harvested',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'DestroyedCount',
    readableName: '# Destroyed',
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_INCOMING_TRANSFER_FIELD_DATA: IFieldData[] = [
  {
    value: 'Transfer.ManifestNumber',
    readableName: 'Manifest #',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.TransferState',
    readableName: 'Transfer Status',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.ShipmentTypeName',
    readableName: 'Transfer Type',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.DeliveryPackageCount',
    readableName: 'Package Count',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.ShipperFacilityName',
    readableName: 'Shipper Name',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.ShipperFacilityLicenseNumber',
    readableName: 'Shipper License',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.RecipientFacilityName',
    readableName: 'Recipient Name',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.RecipientFacilityLicenseNumber',
    readableName: 'Recipient License',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.EstimatedDepartureDateTime',
    readableName: 'ETD',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.EstimatedArrivalDateTime',
    readableName: 'ETA',
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_OUTGOING_TRANSFER_FIELD_DATA: IFieldData[] = [
  {
    value: 'Transfer.ManifestNumber',
    readableName: 'Manifest #',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.TransferState',
    readableName: 'Transfer Status',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Destination.ShipmentTypeName',
    readableName: 'Transfer Type',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Destination.DeliveryPackageCount',
    readableName: 'Package Count',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.ShipperFacilityName',
    readableName: 'Shipper Name',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Transfer.ShipperFacilityLicenseNumber',
    readableName: 'Shipper License',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Destination.RecipientFacilityName',
    readableName: 'Recipient Name',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Destination.RecipientFacilityLicenseNumber',
    readableName: 'Recipient License',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Destination.EstimatedDepartureDateTime',
    readableName: 'ETD',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Destination.EstimatedArrivalDateTime',
    readableName: 'ETA',
    required: false,
    initiallyChecked: true,
  },
];
const COMMON_TAG_FIELD_DATA: IFieldData[] = [
  {
    value: 'Label',
    readableName: 'Tag',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'LicenseNumber',
    readableName: 'Current License',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'TagTypeName',
    readableName: 'Tag Type',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'StatusName',
    readableName: 'Status',
    required: true,
    initiallyChecked: true,
  },
];
const COMMON_HARVEST_FIELD_DATA: IFieldData[] = [
  {
    value: 'Name',
    readableName: 'Harvest Batch',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'LicenseNumber',
    readableName: 'Current License',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'HarvestState',
    readableName: 'Harvest Status',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'CurrentWeight',
    readableName: 'Current Weight',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'HarvestStartDate',
    readableName: 'Harvest Date',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'HarvestType',
    readableName: 'Harvest Type',
    required: false,
    initiallyChecked: true,
  },
];

const COMMON_OUTGOING_TRANSFER_PACKAGE_DATA: IFieldData[] = [
  {
    value: 'Package.PackageLabel',
    readableName: 'Package Tag',
    required: true,
    initiallyChecked: true,
  },
  {
    value: 'Package.ProductName',
    readableName: 'Item',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Package.ShippedQuantity',
    readableName: 'Quantity',
    required: false,
    initiallyChecked: true,
  },
  {
    value: 'Package.ShippedUnitOfMeasureAbbreviation',
    readableName: 'Unit of Measure',
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
  [ReportType.PACKAGES]: [...COMMON_PACKAGE_FIELD_DATA,
    {
      value: 'initialQuantity',
      readableName: 'Initial Quantity',
      required: false,
      initiallyChecked: false,
      checkedMessage: 'This column requires additional data to load, report generation may be slower',
    },
    {
      value: 'initialQuantityUnitOfMeasure',
      readableName: 'Initial Quantity Unit of Measure',
      required: false,
      initiallyChecked: false,
      checkedMessage: 'This column requires additional data to load, report generation may be slower',
    },
    {
      value: 'totalInputQuantity',
      readableName: 'Total Input Quantity',
      required: false,
      initiallyChecked: false,
      checkedMessage: 'This column requires additional data to load, report generation may be slower',
    },
    {
      value: 'totalInputQuantityUnitOfMeasure',
      readableName: 'Total Input Quantity Unit of Measure',
      required: false,
      initiallyChecked: false,
      checkedMessage: 'This column requires additional data to load, report generation may be slower',
    },
  ],
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
  level: 'success' | 'warning' | 'error';
}
