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
  ACTIVE_PACKAGES = "ACTIVE_PACKAGES",
  OUTGOING_TRANSFERS = "OUTGOING_TRANSFERS",
  TRANSFER_PACKAGES = "TRANSFER_PACKAGES",
  MATURE_PLANTS = "MATURE_PLANTS",
}

export const SHEET_FIELDS: { [key: string]: IFieldData[] } = {
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
  [ReportType.ACTIVE_PACKAGES]: [
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
  [ReportType.TRANSFER_PACKAGES]: [
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
  ],
};
