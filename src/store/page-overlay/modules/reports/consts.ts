import { IFieldData } from "./interfaces";

export enum ReportsMutations {
  EXAMPLE_MUTATION = "EXAMPLE_MUTATION",
  SET_STATUS = "SET_STATUS",
  SET_GENERATED_SPREADSHEET = "SET_GENERATED_SPREADSHEET",
}

export enum ReportsGetters {
  EXAMPLE_GETTER = "EXAMPLE_GETTER",
}

export enum ReportsActions {
  EXAMPLE_ACTION = "EXAMPLE_ACTION",
  RESET = "RESET",
  GENERATE_REPORT_SPREADSHEET = "GENERATE_REPORT_SPREADSHEET",
}

export enum ReportStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export enum ReportType {
  PACKAGES = "PACKAGES",
  INCOMING_TRANSFERS = "INCOMING_TRANSFERS",
  OUTGOING_TRANSFERS = "OUTGOING_TRANSFERS",
  OUTGOING_TRANSFER_MANIFESTS = "OUTGOING_TRANSFER_MANIFESTS",
  MATURE_PLANTS = "MATURE_PLANTS",
  IMMATURE_PLANTS = "IMMATURE_PLANTS",
  HARVESTS = "HARVESTS",
  TAGS = "TAGS",
}

export const SHEET_FIELDS: { [key: string]: IFieldData[] } = {
  [ReportType.IMMATURE_PLANTS]: [
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
  ],
  [ReportType.HARVESTS]: [
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
  ],
  [ReportType.TAGS]: [
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
  ],
  [ReportType.MATURE_PLANTS]: [
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
  ],
  [ReportType.PACKAGES]: [
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
      value: "Item.Name",
      readableName: "Package Item",
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
  ],
  // TODO check these:
  [ReportType.INCOMING_TRANSFERS]: [
    {
      value: "Transfer.ManifestNumber",
      readableName: "Manifest #",
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
      value: "Transporter.RecipientFacilityName",
      readableName: "Recipient Name",
      required: false,
    },
    {
      value: "Transporter.RecipientFacilityLicenseNumber",
      readableName: "Recipient License",
      required: false,
    },
    {
      value: "Transporter.EstimatedDepartureDateTime",
      readableName: "ETD",
      required: false,
    },
    {
      value: "Transporter.EstimatedArrivalDateTime",
      readableName: "ETA",
      required: false,
    },
  ],
  [ReportType.OUTGOING_TRANSFERS]: [
    {
      value: "Transfer.ManifestNumber",
      readableName: "Manifest #",
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
  ],
  [ReportType.OUTGOING_TRANSFER_MANIFESTS]: [
    {
      value: "Transfer.ManifestNumber",
      readableName: "Manifest #",
      required: true,
    },
    {
      value: "Destination.ShipmentTypeName",
      readableName: "Transfer Type",
      required: true,
    },
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
      value: "Destination.EstimatedDepartureDateTime",
      readableName: "ETD",
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
  ],
};

export const REPORT_OPTIONS = [
  {
    text: "Packages",
    value: ReportType.PACKAGES,
    premium: false,
    enabled: true,
    description: "Filter by packaged date, active/inactive, and transferred",
  },
  {
    text: "Immature Plants",
    value: ReportType.IMMATURE_PLANTS,
    premium: false,
    enabled: true,
    description: "Filter by planted date",
  },
  {
    text: "Mature Plants",
    value: ReportType.MATURE_PLANTS,
    premium: false,
    enabled: true,
    description: "Filter by growth phase and planted date",
  },
  {
    text: "Incoming Transfers",
    value: ReportType.INCOMING_TRANSFERS,
    premium: true,
    enabled: true,
    description: "Filter by wholesale and estimated time of arrival",
  },
  {
    text: "Outgoing Transfers",
    value: ReportType.OUTGOING_TRANSFERS,
    premium: false,
    enabled: true,
    description: "Filter by wholesale and estimated time of departure",
  },
  {
    text: "Tags",
    value: ReportType.TAGS,
    premium: true,
    enabled: true,
    description: "Filter by tag type and status",
  },
  {
    text: "Harvests",
    value: ReportType.HARVESTS,
    premium: false,
    enabled: true,
    description: "Filter by harvest date",
  },
  {
    text: "Outgoing Transfer Manifests",
    value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
    premium: true,
    enabled: true,
    description: "Full transfer and package data for all outgoing transfers",
  },
  {
    text: "Straggler Inventory",
    value: null,
    premium: true,
    enabled: false,
    description: "Find straggler inventory so it can be cleared out",
  },
  {
    text: "Package Quickview",
    value: null,
    premium: true,
    enabled: false,
    description: "Grouped summary of packages by item, remaining quantity, and testing status",
  },
  {
    text: "Immature Plant Quickview",
    value: null,
    premium: true,
    enabled: false,
    description: "Grouped summary of mature plants by strain, location, and dates",
  },
  {
    text: "Mature Plant Quickview",
    value: null,
    premium: true,
    enabled: false,
    description: "Grouped summary of mature plants by growth phase, strain, location, and dates",
  },
  {
    text: "Transfer Quickview",
    value: null,
    premium: true,
    enabled: false,
    description: "Summary of incoming, outgoing, and rejected packages",
  },
  {
    text: "Incoming Inventory",
    value: null,
    premium: true,
    enabled: false,
    description: "See packages not yet recieved",
  },
  {
    text: "Harvested Plants",
    value: null,
    premium: true,
    enabled: false,
    description: "All plants and associated harvest data within this license",
  },
];
