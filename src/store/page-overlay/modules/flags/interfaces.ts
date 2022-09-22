export interface IFlagsState {
  featureFlags: IFeatureFlags;
  mockedFlags: IMockFlags;
}

export interface IFeatureFlags {}

export interface IMockFlags {
  mockPlants: IMockPlants;
  mockPlantBatches: IMockPlantBatches;
  mockHarvests: IMockHarvests;
  mockPackages: IMockPackages;
  mockItems: IMockItems;
  mockLocations: IMockLocations;
  mockStrains: IMockStrains;
  mockTags: IMockTags;
  // mockItemCategories: IMockItemCategories
  mockUnitsOfMeasure: IMockUnitsOfMeasure;
  // mockUnitsOfWeight: IMockUnitsOfWeight
  // mockWasteReasons: IMockWasteReasons
  // mockAdjustPackageReasons: IMockAdjustPackageReasons
  // mockRemediatePackageMethods: IMockRemediatePackageMethods
  mockPlantBatchTypes: IMockPlantBatchTypes;
  mockPlantBatchGrowthPhases: IMockPlantBatchGrowthPhases;
  mockDefaultPhoneNumberForQuestions: IMockDefaultPhoneNumberForQuestions;
  mockFacilityUsesLocationForPackages: IMockFacilityUsesLocationForPackages;
  mockFacilities: IMockFacilities;
  mockDestinationFacilities: IMockDesinationFacilities;
  mockTransporterFacilities: IMockTransporterFacilities;
  mockTransferTypes: IMockTransferTypes;
  mockDrivers: IMockDrivers;
  mockVehicles: IMockVehicles;
}

export interface IMockPlants {
  enabled: boolean;
  behavior: IMockPlantsBehavior;
}

export interface IMockPlantBatches {
  enabled: boolean;
  behavior: IMockPlantBatchesBehavior;
}

export interface IMockHarvests {
  enabled: boolean;
  behavior: IMockHarvestsBehavior;
}

export interface IMockPackages {
  enabled: boolean;
  behavior: IMockPackagesBehavior;
}

export interface IMockItems {
  enabled: boolean;
  behavior: IMockItemsBehavior;
}

export interface IMockLocations {
  enabled: boolean;
  behavior: IMockLocationsBehavior;
}
export interface IMockStrains {
  enabled: boolean;
  behavior: IMockStrainsBehavior;
}
export interface IMockTags {
  enabled: boolean;
  behavior: IMockTagsBehavior;
}

export interface IMockItemCategories {
  enabled: boolean;
  behavior: IMockItemCategoriesBehavior;
}

export interface IMockUnitsOfMeasure {
  enabled: boolean;
  behavior: IMockUnitsOfMeasureBehavior;
}

export interface IMockUnitsOfWeight {
  enabled: boolean;
  behavior: IMockUnitsOfWeightBehavior;
}

export interface IMockWasteReasons {
  enabled: boolean;
  behavior: IMockWasteReasonsBehavior;
}

export interface IMockWasteMethods {
  enabled: boolean;
  behavior: IMockWasteMethodsBehavior;
}

export interface IMockAdjustPackageReasons {
  enabled: boolean;
  behavior: IMockAdjustPackageReasonsBehavior;
}
export interface IMockRemediatePackageMethods {
  enabled: boolean;
  behavior: IMockRemediatePackageMethodsBehavior;
}

export interface IMockPlantBatchTypes {
  enabled: boolean;
  behavior: IMockPlantBatchTypesBehavior;
}

export interface IMockPlantBatchGrowthPhases {
  enabled: boolean;
  behavior: IMockPlantBatchGrowthPhasesBehavior;
}

export interface IMockDefaultPhoneNumberForQuestions {
  enabled: boolean;
  behavior: IMockDefaultPhoneNumberForQuestionsBehavior;
}

export interface IMockFacilityUsesLocationForPackages {
  enabled: boolean;
  behavior: IMockFacilityUsesLocationForPackagesBehavior;
}

export interface IMockFacilities {
  enabled: boolean;
  behavior: IMockFacilitiesBehavior;
}

export interface IMockDesinationFacilities {
  enabled: boolean;
  behavior: IMockDesinationFacilitiesBehavior;
}

export interface IMockTransporterFacilities {
  enabled: boolean;
  behavior: IMockTransporterFacilitiesBehavior;
}

export interface IMockTransferTypes {
  enabled: boolean;
  behavior: IMockTransferTypesBehavior;
}

export interface IMockDrivers {
  enabled: boolean;
  behavior: IMockDriversBehavior;
}

export interface IMockVehicles {
  enabled: boolean;
  behavior: IMockVehiclesBehavior;
}

/* ----- Mock Behaviors ----- */

export interface IAccountUpsertBehavior {}

export interface IBulkPackageUpsertBehavior {}

export interface IListingViewBehavior {}

export interface IMockPlantsBehavior {
  plantCount: number;
}

export interface IMockPlantBatchesBehavior {
  plantBatchCount: number;
}

export interface IMockHarvestsBehavior {}

export interface IMockPackagesBehavior {
  packageCount: number;
}

export interface IMockItemsBehavior {}

export interface IMockLocationsBehavior {}

export interface IMockStrainsBehavior {}

export interface IMockTagsBehavior {}

export interface IMockItemCategoriesBehavior {}

export interface IMockUnitsOfMeasureBehavior {}

export interface IMockUnitsOfWeightBehavior {}

export interface IMockWasteReasonsBehavior {}

export interface IMockWasteMethodsBehavior {}

export interface IMockAdjustPackageReasonsBehavior {}

export interface IMockRemediatePackageMethodsBehavior {}

export interface IMockPlantBatchTypesBehavior {}

export interface IMockPlantBatchGrowthPhasesBehavior {}

export interface IMockDefaultPhoneNumberForQuestionsBehavior {}

export interface IMockFacilityUsesLocationForPackagesBehavior {}

export interface IMockFacilitiesBehavior {}

export interface IMockDesinationFacilitiesBehavior {}

export interface IMockTransporterFacilitiesBehavior {}

export interface IMockTransferTypesBehavior {}

export interface IMockDriversBehavior {}

export interface IMockVehiclesBehavior {}
