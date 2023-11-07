import { HarvestState, PackageState, TagState } from '@/consts';
import {
  IAtomicService,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedTagData,
  IItemData,
  ILocationData,
  IMetrcDriverData,
  IMetrcFacilityData,
  IMetrcTransferType,
  IMetrcVehicleData,
  IPlantBatchData,
  IPlantBatchGrowthPhase,
  IPlantBatchOptions,
  IPlantBatchType,
  IPlantData,
  IPlantOptions,
  IStrainData,
  IUnitOfMeasure,
} from '@/interfaces';
import store from '@/store/page-overlay/index';
import { evenIntegerDistribution } from '@/utils/math';
import { generateTagRangeOrError, getTagFromOffset } from '@/utils/tags';
import { sum } from 'lodash-es';
/**
 *
 * Mock principles
 *
 * - Always return at least one result
 * - Always return only what is being filtered for
 */

const OLD_DATE = '2021-01-01';
const OLD_DATETIME = `${OLD_DATE}T00:00:00+00:00`;

const TODAY_DATETIME = new Date().toISOString();
const TODAY_DATE = TODAY_DATETIME.split('T')[0];

const DO_SI_DOS_STRAIN: IStrainData = {
  CbdLevel: null,
  Id: 70000001,
  IndicaPercentage: 100,
  IsArchived: false,
  IsUsed: true,
  Name: 'Do-si-Dos',
  SativaPercentage: 0,
  TestingStatus: 'None',
  ThcLevel: null,
};
const ICE_CREAM_CAKE_STRAIN: IStrainData = {
  CbdLevel: null,
  Id: 70000002,
  IndicaPercentage: 100,
  IsArchived: false,
  IsUsed: true,
  Name: 'Ice Cream Cake',
  SativaPercentage: 0,
  TestingStatus: 'None',
  ThcLevel: null,
};

const VAPE_CARTRIDGE_ITEM: IItemData = {
  AdministrationMethod: '',
  ExpirationDateConfiguration: 'Off',
  UseByDateConfiguration: 'Off',
  SellByDateConfiguration: 'Off',
  ApprovalStatusDateTime: OLD_DATETIME,
  ApprovalStatusName: 'Approved',
  DefaultLabTestingStateName: 'NotSubmitted',
  Description: '',
  FacilityLicenseNumber: null,
  FacilityName: null,
  Id: 50000003,
  IsArchived: false,
  IsUsed: false,
  ItemBrandId: 0,
  ItemBrandName: null,
  LabelImages: [],
  Name: 'Vape Cartridge (10ct)',
  NumberOfDoses: null,
  PackagingImages: [],
  ProductCategoryName: 'Vape Cartridge (volume - each)',
  ProductCategoryTypeName: 'Concentrate',
  ProductImages: [],
  PublicIngredients: '',
  QuantityTypeName: 'CountBased',
  ServingSize: '',
  StrainName: null,
  SupplyDurationDays: null,
  UnitCbdContent: null,
  UnitCbdContentDose: null,
  UnitCbdContentDoseUnitOfMeasureAbbreviation: null,
  UnitCbdContentUnitOfMeasureAbbreviation: null,
  UnitCbdPercent: null,
  UnitOfMeasureId: 1,
  UnitOfMeasureName: 'Each',
  UnitQuantity: null,
  UnitQuantityUnitOfMeasureAbbreviation: null,
  UnitThcContent: null,
  UnitThcContentDose: null,
  UnitThcContentDoseUnitOfMeasureAbbreviation: null,
  UnitThcContentUnitOfMeasureAbbreviation: null,
  UnitThcPercent: null,
  UnitVolume: 1,
  UnitVolumeUnitOfMeasureAbbreviation: 'ml',
  UnitWeight: null,
  UnitWeightUnitOfMeasureAbbreviation: null,
  UnitWeightUnitOfMeasureId: null,
};

const HARVESTED_FLOWER_ITEM: IItemData = {
  AdministrationMethod: '',
  ExpirationDateConfiguration: 'Off',
  UseByDateConfiguration: 'Off',
  SellByDateConfiguration: 'Off',
  ApprovalStatusDateTime: OLD_DATETIME,
  ApprovalStatusName: 'Approved',
  DefaultLabTestingStateName: 'NotSubmitted',
  Description: '',
  FacilityLicenseNumber: null,
  FacilityName: null,
  Id: 50000001,
  IsArchived: false,
  IsUsed: true,
  ItemBrandId: 0,
  ItemBrandName: null,
  LabelImages: [],
  Name: 'Do Si Dos Flower',
  NumberOfDoses: null,
  PackagingImages: [],
  ProductCategoryName: 'Fresh Cannabis Plant',
  ProductCategoryTypeName: 'Plants',
  ProductImages: [],
  PublicIngredients: '',
  QuantityTypeName: 'WeightBased',
  ServingSize: '',
  StrainName: 'Do-si-Dos',
  SupplyDurationDays: null,
  UnitCbdContent: null,
  UnitCbdContentDose: null,
  UnitCbdContentDoseUnitOfMeasureAbbreviation: null,
  UnitCbdContentUnitOfMeasureAbbreviation: null,
  UnitCbdPercent: null,
  UnitOfMeasureId: 3,
  UnitOfMeasureName: 'Pounds',
  UnitQuantity: null,
  UnitQuantityUnitOfMeasureAbbreviation: null,
  UnitThcContent: null,
  UnitThcContentDose: null,
  UnitThcContentDoseUnitOfMeasureAbbreviation: null,
  UnitThcContentUnitOfMeasureAbbreviation: null,
  UnitThcPercent: null,
  UnitVolume: null,
  UnitVolumeUnitOfMeasureAbbreviation: null,
  UnitWeight: null,
  UnitWeightUnitOfMeasureAbbreviation: null,
  UnitWeightUnitOfMeasureId: null,
};

const CLONE_ITEM: IItemData = {
  AdministrationMethod: '',
  ExpirationDateConfiguration: 'Off',
  UseByDateConfiguration: 'Off',
  SellByDateConfiguration: 'Off',
  ApprovalStatusDateTime: OLD_DATETIME,
  ApprovalStatusName: 'Approved',
  DefaultLabTestingStateName: 'NotRequired',
  Description: '',
  FacilityLicenseNumber: null,
  FacilityName: null,
  Id: 2358934,
  IsArchived: false,
  IsUsed: false,
  ItemBrandId: 0,
  ItemBrandName: null,
  LabelImages: [],
  Name: 'Clones',
  NumberOfDoses: null,
  PackagingImages: [],
  ProductCategoryName: 'Clone - Cutting',
  ProductCategoryTypeName: 'Plants',
  ProductImages: [],
  PublicIngredients: '',
  QuantityTypeName: 'CountBased',
  ServingSize: '',
  StrainName: null,
  SupplyDurationDays: null,
  UnitCbdContent: null,
  UnitCbdContentDose: null,
  UnitCbdContentDoseUnitOfMeasureAbbreviation: null,
  UnitCbdContentUnitOfMeasureAbbreviation: null,
  UnitCbdPercent: null,
  UnitOfMeasureId: 1,
  UnitOfMeasureName: 'Each',
  UnitQuantity: null,
  UnitQuantityUnitOfMeasureAbbreviation: null,
  UnitThcContent: null,
  UnitThcContentDose: null,
  UnitThcContentDoseUnitOfMeasureAbbreviation: null,
  UnitThcContentUnitOfMeasureAbbreviation: null,
  UnitThcPercent: null,
  UnitVolume: null,
  UnitVolumeUnitOfMeasureAbbreviation: null,
  UnitWeight: null,
  UnitWeightUnitOfMeasureAbbreviation: null,
  UnitWeightUnitOfMeasureId: null,
};

const TEMPLATE_ITEMS: IItemData[] = [
  {
    AdministrationMethod: '',
    ExpirationDateConfiguration: 'Off',
    UseByDateConfiguration: 'Off',
    SellByDateConfiguration: 'Off',
    ApprovalStatusDateTime: OLD_DATETIME,
    ApprovalStatusName: 'Approved',
    DefaultLabTestingStateName: 'NotRequired',
    Description: '',
    FacilityLicenseNumber: null,
    FacilityName: null,
    Id: 50000005,
    IsArchived: false,
    IsUsed: false,
    ItemBrandId: 0,
    ItemBrandName: null,
    LabelImages: [],
    Name: 'Live Rosin Vape Cart - DOS',
    NumberOfDoses: null,
    PackagingImages: [],
    ProductCategoryName: '',
    ProductCategoryTypeName: '',
    ProductImages: [],
    PublicIngredients: '',
    QuantityTypeName: 'WeightBased',
    ServingSize: '',
    StrainName: null,
    SupplyDurationDays: null,
    UnitCbdContent: null,
    UnitCbdContentDose: null,
    UnitCbdContentDoseUnitOfMeasureAbbreviation: null,
    UnitCbdContentUnitOfMeasureAbbreviation: null,
    UnitCbdPercent: null,
    UnitOfMeasureId: 5004,
    UnitOfMeasureName: 'Grams',
    UnitQuantity: null,
    UnitQuantityUnitOfMeasureAbbreviation: null,
    UnitThcContent: null,
    UnitThcContentDose: null,
    UnitThcContentDoseUnitOfMeasureAbbreviation: null,
    UnitThcContentUnitOfMeasureAbbreviation: null,
    UnitThcPercent: null,
    UnitVolume: null,
    UnitVolumeUnitOfMeasureAbbreviation: null,
    UnitWeight: null,
    UnitWeightUnitOfMeasureAbbreviation: null,
    UnitWeightUnitOfMeasureId: null,
  },
  {
    AdministrationMethod: '',
    ExpirationDateConfiguration: 'Off',
    UseByDateConfiguration: 'Off',
    SellByDateConfiguration: 'Off',
    ApprovalStatusDateTime: OLD_DATETIME,
    ApprovalStatusName: 'Approved',
    DefaultLabTestingStateName: 'NotRequired',
    Description: '',
    FacilityLicenseNumber: null,
    FacilityName: null,
    Id: 50000004,
    IsArchived: false,
    IsUsed: false,
    ItemBrandId: 0,
    ItemBrandName: null,
    LabelImages: [],
    Name: 'Cold Cured Live Rosin - DOS',
    NumberOfDoses: null,
    PackagingImages: [],
    ProductCategoryName: '',
    ProductCategoryTypeName: '',
    ProductImages: [],
    PublicIngredients: '',
    QuantityTypeName: 'CountBased',
    ServingSize: '',
    StrainName: null,
    SupplyDurationDays: null,
    UnitCbdContent: null,
    UnitCbdContentDose: null,
    UnitCbdContentDoseUnitOfMeasureAbbreviation: null,
    UnitCbdContentUnitOfMeasureAbbreviation: null,
    UnitCbdPercent: null,
    UnitOfMeasureId: 5001,
    UnitOfMeasureName: 'Each',
    UnitQuantity: null,
    UnitQuantityUnitOfMeasureAbbreviation: null,
    UnitThcContent: null,
    UnitThcContentDose: null,
    UnitThcContentDoseUnitOfMeasureAbbreviation: null,
    UnitThcContentUnitOfMeasureAbbreviation: null,
    UnitThcPercent: null,
    UnitVolume: null,
    UnitVolumeUnitOfMeasureAbbreviation: null,
    UnitWeight: null,
    UnitWeightUnitOfMeasureAbbreviation: null,
    UnitWeightUnitOfMeasureId: null,
  },
];

const ROW_01_LOCATION: ILocationData = {
  ForHarvests: true,
  ForPackages: true,
  ForPlantBatches: true,
  ForPlants: true,
  Id: 60000001,
  IsArchived: false,
  LocationTypeId: 1,
  LocationTypeName: 'Default Location Type',
  Name: 'Row 01',
};
const FROZEN_STORAGE_LOCATION: ILocationData = {
  ForHarvests: true,
  ForPackages: true,
  ForPlantBatches: true,
  ForPlants: true,
  Id: 60000001,
  IsArchived: false,
  LocationTypeId: 1,
  LocationTypeName: 'Default Location Type',
  Name: 'Frozen Storage',
};

const NEW_HARVEST: IIndexedHarvestData = {
  HarvestState: HarvestState.ACTIVE,
  TagMatcher: '',
  LicenseNumber: '',
  ArchivedDate: null,
  CurrentWeight: 0,
  DryingLocationName: 'Frozen Storage',
  DryingLocationTypeName: 'Default Location Type',
  FacilityLicenseNumber: null,
  FacilityName: null,
  FinishedDate: null,
  HarvestStartDate: TODAY_DATE,
  HarvestType: 'WholePlant',
  HarvestTypeName: 'Harvest Batch',
  Id: 30000001,
  IsArchived: false,
  IsFinished: true,
  IsOnHold: false,
  LabTestingStateDate: null,
  LabTestingStateName: 'NotSubmitted',
  LastModified: TODAY_DATETIME,
  MultiStrain: false,
  Name: 'New Harvest',
  PackageCount: 1,
  PatientLicenseNumber: '',
  PlantCount: 100,
  SourceStrainCount: 1,
  SourceStrainNames: 'Production Clone',
  TotalPackagedWeight: 120.5,
  TotalRestoredWeight: 0,
  TotalWasteWeight: 0,
  TotalWetWeight: 120.5,
  UnitOfWeightAbbreviation: 'lb',
  UnitOfWeightId: 3,
};

const OLD_HARVEST: IIndexedHarvestData = {
  HarvestState: HarvestState.ACTIVE,
  TagMatcher: '',
  LicenseNumber: '',
  ArchivedDate: null,
  CurrentWeight: 0,
  DryingLocationName: 'Frozen Storage',
  DryingLocationTypeName: 'Default Location Type',
  FacilityLicenseNumber: null,
  FacilityName: null,
  FinishedDate: OLD_DATE,
  HarvestStartDate: OLD_DATE,
  HarvestType: 'WholePlant',
  HarvestTypeName: 'Harvest Batch',
  Id: 30000002,
  IsArchived: false,
  IsFinished: true,
  IsOnHold: false,
  LabTestingStateDate: null,
  LabTestingStateName: 'NotSubmitted',
  LastModified: OLD_DATETIME,
  MultiStrain: false,
  Name: 'Old Harvest',
  PackageCount: 1,
  PatientLicenseNumber: '',
  PlantCount: 100,
  SourceStrainCount: 1,
  SourceStrainNames: 'Production Clone',
  TotalPackagedWeight: 120.5,
  TotalRestoredWeight: 0,
  TotalWasteWeight: 0,
  TotalWetWeight: 120.5,
  UnitOfWeightAbbreviation: 'lb',
  UnitOfWeightId: 3,
};

const NEW_MANICURE: IIndexedHarvestData = {
  ...NEW_HARVEST,
  HarvestType: 'Manicure',
  Name: 'New Manicure',
  Id: 30000003,
};

const OLD_MANICURE: IIndexedHarvestData = {
  ...OLD_HARVEST,
  HarvestType: 'Manicure',
  Name: 'Old Manicure',
  Id: 30000004,
};

class MockDataManager implements IAtomicService {
  // Plants and plant batches are generated on demand based on server side filters
  // These are only for cached values
  private _mockLocations: ILocationData[] = [];

  private _mockStrains: IStrainData[] = [];

  private _mockItems: IItemData[] = [];

  private _mockHarvests: IIndexedHarvestData[] = [];

  private _mockPackages: IIndexedPackageData[] = [];

  private _mockTags: IIndexedTagData[] = [];

  async init() {}

  mockPlants(options: IPlantOptions): IPlantData[] {
    const mockPlants: IPlantData[] = [];
    const plantCount: number = store.state.flags?.mockedFlags.mockPlants.behavior.plantCount!;

    const firstTag = 'A00000000000000000000001';
    const lastTag = getTagFromOffset(firstTag, plantCount - 1);

    const labels = options.filter?.label
      ? [options.filter.label]
      : generateTagRangeOrError(firstTag, lastTag);

    for (const [i, label] of labels.entries()) {
      mockPlants.push({
        DestroyedByUserName: null,
        DestroyedDate: null,
        DestroyedNote: null,
        FloweringDate: TODAY_DATE,
        GrowthPhaseName: 'Flowering',
        HarvestCount: 0,
        Id: i + 10000,
        IsOnHold: false,
        Label: label,
        LastModified: '',
        LocationName: options.filter?.locationName || ROW_01_LOCATION.Name,
        LocationTypeName: '',
        PatientLicenseNumber: '',
        PlantBatchName: '',
        PlantBatchTypeName: 'Clone',
        PlantedDate: OLD_DATE,
        StateName: '',
        StrainName: options.filter?.strainName || DO_SI_DOS_STRAIN.Name,
        VegetativeDate: null,
      });
    }

    return mockPlants;
  }

  mockPlantBatches(options: IPlantBatchOptions): IPlantBatchData[] {
    const mockPlantBatches: IPlantBatchData[] = [];
    const plantBatchCount = store.state.flags?.mockedFlags.mockPlantBatches.behavior.plantBatchCount!;

    const firstTag = 'AB0000000000000000000001';
    const lastTag = getTagFromOffset(firstTag, plantBatchCount - 1);

    const labels = generateTagRangeOrError(firstTag, lastTag);

    for (const [i, label] of labels.entries()) {
      mockPlantBatches.push({
        DestroyedCount: 0,
        HarvestedCount: 0,
        Id: i + 20000,
        LastModified: '',
        LocationName: options.filter?.locationName || ROW_01_LOCATION.Name,
        LocationTypeName: '',
        Name: label,
        PackagedCount: 0,
        PatientLicenseNumber: '',
        PlantedDate: '',
        SourcePackageLabel: '',
        SourcePlantBatchName: null,
        SourcePlantLabel: null,
        StrainName: options.filter?.strainName || DO_SI_DOS_STRAIN.Name,
        TrackedCount: 0,
        TypeName: '',
        UntrackedCount: 72,
      });
    }

    return mockPlantBatches;
  }

  // These are filtered post-load, so generate a few of each kind every time
  mockHarvests(): IIndexedHarvestData[] {
    if (this._mockHarvests.length > 0) {
      return this._mockHarvests;
    }

    this._mockHarvests.push(OLD_HARVEST);
    this._mockHarvests.push(NEW_HARVEST);
    this._mockHarvests.push(OLD_MANICURE);
    this._mockHarvests.push(NEW_MANICURE);

    return this._mockHarvests;
  }

  // These are filtered post-load, so generate a few of each kind every time
  mockPackages(): IIndexedPackageData[] {
    const packageSum: number = sum(
      Object.values(store.state.flags?.mockedFlags.mockPackages.behavior!).map(Number)
    );
    const packageDistribution: number[] = evenIntegerDistribution(packageSum, 4);

    if (this._mockPackages.length > 0) {
      return this._mockPackages;
    }

    const firstTag = 'ACAE00000000000000000001';
    const lastTag = getTagFromOffset(firstTag, packageSum - 1);

    const labels = generateTagRangeOrError(firstTag, lastTag);

    // Harvested flower
    for (const [i, label] of labels.entries()) {
      if (i < packageDistribution[0]) {
        this._mockPackages.push({
          PackageState: PackageState.ACTIVE,
          LicenseNumber: 'XYZ-00001',
          TagMatcher: '',
          ArchivedDate: null,
          ContainsRemediatedProduct: false,
          DonationFacilityLicenseNumber: null,
          DonationFacilityName: null,
          FacilityLicenseNumber: null,
          FacilityName: null,
          FinishedDate: null,
          Id: 80000000 + i,
          InitialLabTestingState: 'NotSubmitted',
          IsArchived: false,
          IsDonation: false,
          IsDonationPersistent: false,
          IsFinished: false,
          IsInTransit: false,
          IsOnHold: false,
          IsProcessValidationTestingSample: false,
          IsProductionBatch: true,
          IsTestingSample: false,
          IsTradeSample: false,
          IsTradeSamplePersistent: false,
          Item: HARVESTED_FLOWER_ITEM,
          ItemFromFacilityLicenseNumber: '',
          ItemFromFacilityName: '',
          LabTestingStateDate: OLD_DATE,
          LabTestingStateName: 'NotSubmitted',
          Label: label,
          LastModified: OLD_DATETIME,
          LocationName: i % 2 ? ROW_01_LOCATION.Name : FROZEN_STORAGE_LOCATION.Name,
          LocationTypeName: 'Default Location Type',
          MultiHarvest: true,
          MultiPackage: true,
          MultiProductionBatch: false,
          Note: '',
          PackageType: 'Product',
          PackagedByFacilityLicenseNumber: '',
          PackagedByFacilityName: '',
          PackagedDate: OLD_DATE,
          PatientLicenseNumber: '',
          ProductRequiresRemediation: false,
          ProductionBatchNumber: '',
          Quantity: 245.43,
          ReceivedDateTime: null,
          ReceivedFromFacilityLicenseNumber: null,
          ReceivedFromFacilityName: null,
          ReceivedFromManifestNumber: null,
          RemediationDate: null,
          SourceHarvestNames: '',
          SourcePackageIsDonation: false,
          SourcePackageIsTradeSample: false,
          SourcePackageLabels: '',
          SourceProductionBatchNumbers: '',
          TradeSampleFacilityLicenseNumber: null,
          TradeSampleFacilityName: null,
          TransferManifestNumber: '',
          TransferPackageStateName: null,
          UnitOfMeasureAbbreviation: 'lb',
          UnitOfMeasureId: 3,
          UnitOfMeasureQuantityType: 'WeightBased',
          SourceHarvestCount: 1,
          SourcePackageCount: 1,
          SourceProcessingJobCount: 1,
          SourceProcessingJobNumbers: '',
          SourceProcessingJobNames: '',
          MultiProcessingJob: false,
          ExpirationDate: null,
          SellByDate: null,
          UseByDate: null,
          LabTestResultDocumentFileId: null,
          IsOnTrip: false,
          IsOnRetailerDelivery: false,
          PackageForProductDestruction: null,
          Trip: null,
          HasPartial: false,
          IsPartial: false,
        });
        continue;
      }

      // Plant batch packages
      if (i < packageDistribution[1]) {
        this._mockPackages.push({
          PackageState: PackageState.ACTIVE,
          LicenseNumber: 'XYZ-00001',
          TagMatcher: '',
          ArchivedDate: null,
          ContainsRemediatedProduct: false,
          DonationFacilityLicenseNumber: null,
          DonationFacilityName: null,
          FacilityLicenseNumber: null,
          FacilityName: null,
          FinishedDate: null,
          Id: 80000000 + i,
          InitialLabTestingState: 'NotRequired',
          IsArchived: false,
          IsDonation: false,
          IsDonationPersistent: false,
          IsFinished: false,
          IsInTransit: false,
          IsOnHold: false,
          IsProcessValidationTestingSample: false,
          IsProductionBatch: false,
          IsTestingSample: false,
          IsTradeSample: false,
          IsTradeSamplePersistent: false,
          Item: CLONE_ITEM,
          ItemFromFacilityLicenseNumber: '',
          ItemFromFacilityName: '',
          LabTestingStateDate: OLD_DATE,
          LabTestingStateName: 'NotRequired',
          Label: label,
          LastModified: OLD_DATETIME,
          LocationName: i % 2 ? ROW_01_LOCATION.Name : FROZEN_STORAGE_LOCATION.Name,
          LocationTypeName: 'Default Location Type',
          MultiHarvest: false,
          MultiPackage: false,
          MultiProductionBatch: false,
          Note: '',
          PackageType: 'ImmaturePlant',
          PackagedByFacilityLicenseNumber: '',
          PackagedByFacilityName: '',
          PackagedDate: OLD_DATE,
          PatientLicenseNumber: '',
          ProductRequiresRemediation: false,
          ProductionBatchNumber: '',
          Quantity: 70,
          ReceivedDateTime: OLD_DATETIME,
          ReceivedFromFacilityLicenseNumber: '',
          ReceivedFromFacilityName: '',
          ReceivedFromManifestNumber: '0000000001',
          RemediationDate: null,
          SourceHarvestNames: '',
          SourcePackageIsDonation: false,
          SourcePackageIsTradeSample: false,
          SourcePackageLabels: '',
          SourceProductionBatchNumbers: '',
          TradeSampleFacilityLicenseNumber: null,
          TradeSampleFacilityName: null,
          TransferManifestNumber: '',
          TransferPackageStateName: null,
          UnitOfMeasureAbbreviation: 'ea',
          UnitOfMeasureId: 1,
          UnitOfMeasureQuantityType: 'CountBased',
          SourceHarvestCount: 1,
          SourcePackageCount: 1,
          SourceProcessingJobCount: 1,
          SourceProcessingJobNumbers: '',
          SourceProcessingJobNames: '',
          MultiProcessingJob: false,
          ExpirationDate: null,
          SellByDate: null,
          UseByDate: null,
          LabTestResultDocumentFileId: null,
          IsOnTrip: false,
          IsOnRetailerDelivery: false,
          PackageForProductDestruction: null,
          Trip: null,
          HasPartial: false,
          IsPartial: false,
        });
        continue;
      }

      // Processed packages
      if (i < packageDistribution[2]) {
        this._mockPackages.push({
          PackageState: PackageState.ACTIVE,
          LicenseNumber: 'XYZ-00001',
          TagMatcher: '',
          ArchivedDate: null,
          ContainsRemediatedProduct: false,
          DonationFacilityLicenseNumber: null,
          DonationFacilityName: null,
          FacilityLicenseNumber: null,
          FacilityName: null,
          FinishedDate: null,
          Id: 80000000 + i,
          InitialLabTestingState: 'TestPassed',
          IsArchived: false,
          IsDonation: false,
          IsDonationPersistent: false,
          IsFinished: false,
          IsInTransit: false,
          IsOnHold: false,
          IsProcessValidationTestingSample: false,
          IsProductionBatch: false,
          IsTestingSample: false,
          IsTradeSample: false,
          IsTradeSamplePersistent: false,
          Item: VAPE_CARTRIDGE_ITEM,
          ItemFromFacilityLicenseNumber: '',
          ItemFromFacilityName: 'HERBL, INC.',
          LabTestingStateDate: OLD_DATE,
          LabTestingStateName: 'TestPassed',
          Label: label,
          LastModified: OLD_DATETIME,
          LocationName: i % 2 ? ROW_01_LOCATION.Name : FROZEN_STORAGE_LOCATION.Name,
          LocationTypeName: 'Default Location Type',
          MultiHarvest: true,
          MultiPackage: false,
          MultiProductionBatch: false,
          Note: '',
          PackageType: 'Product',
          PackagedByFacilityLicenseNumber: '',
          PackagedByFacilityName: '',
          PackagedDate: OLD_DATE,
          PatientLicenseNumber: '',
          ProductRequiresRemediation: false,
          ProductionBatchNumber: '',
          Quantity: 60,
          ReceivedDateTime: OLD_DATETIME,
          ReceivedFromFacilityLicenseNumber: '',
          ReceivedFromFacilityName: '',
          ReceivedFromManifestNumber: '0000000001',
          RemediationDate: null,
          SourceHarvestNames: '',
          SourcePackageIsDonation: false,
          SourcePackageIsTradeSample: false,
          SourcePackageLabels: '',
          SourceProductionBatchNumbers: '',
          TradeSampleFacilityLicenseNumber: null,
          TradeSampleFacilityName: null,
          TransferManifestNumber: '',
          TransferPackageStateName: null,
          UnitOfMeasureAbbreviation: 'ea',
          UnitOfMeasureId: 1,
          UnitOfMeasureQuantityType: 'CountBased',
          SourceHarvestCount: 1,
          SourcePackageCount: 1,
          SourceProcessingJobCount: 1,
          SourceProcessingJobNumbers: '',
          SourceProcessingJobNames: '',
          MultiProcessingJob: false,
          ExpirationDate: null,
          SellByDate: null,
          UseByDate: null,
          LabTestResultDocumentFileId: null,
          IsOnTrip: false,
          IsOnRetailerDelivery: false,
          PackageForProductDestruction: null,
          Trip: null,
          HasPartial: false,
          IsPartial: false,
        });
        continue;
      }

      // Empty packages
      if (i < packageDistribution[3]) {
        this._mockPackages.push({
          PackageState: PackageState.ACTIVE,
          LicenseNumber: 'XYZ-00001',
          TagMatcher: '',
          ArchivedDate: null,
          ContainsRemediatedProduct: false,
          DonationFacilityLicenseNumber: null,
          DonationFacilityName: null,
          FacilityLicenseNumber: null,
          FacilityName: null,
          FinishedDate: null,
          Id: 80000000 + i,
          InitialLabTestingState: 'NotSubmitted',
          IsArchived: false,
          IsDonation: false,
          IsDonationPersistent: false,
          IsFinished: false,
          IsInTransit: false,
          IsOnHold: false,
          IsProcessValidationTestingSample: false,
          IsProductionBatch: true,
          IsTestingSample: false,
          IsTradeSample: false,
          IsTradeSamplePersistent: false,
          Item: HARVESTED_FLOWER_ITEM,
          ItemFromFacilityLicenseNumber: '',
          ItemFromFacilityName: '',
          LabTestingStateDate: OLD_DATE,
          LabTestingStateName: 'NotSubmitted',
          Label: label,
          LastModified: OLD_DATETIME,
          LocationName: i % 2 ? ROW_01_LOCATION.Name : FROZEN_STORAGE_LOCATION.Name,
          LocationTypeName: 'Default Location Type',
          MultiHarvest: true,
          MultiPackage: true,
          MultiProductionBatch: false,
          Note: '',
          PackageType: 'Product',
          PackagedByFacilityLicenseNumber: '',
          PackagedByFacilityName: '',
          PackagedDate: OLD_DATE,
          PatientLicenseNumber: '',
          ProductRequiresRemediation: false,
          ProductionBatchNumber: '',
          Quantity: 0,
          ReceivedDateTime: null,
          ReceivedFromFacilityLicenseNumber: null,
          ReceivedFromFacilityName: null,
          ReceivedFromManifestNumber: null,
          RemediationDate: null,
          SourceHarvestNames: '',
          SourcePackageIsDonation: false,
          SourcePackageIsTradeSample: false,
          SourcePackageLabels: '',
          SourceProductionBatchNumbers: '',
          TradeSampleFacilityLicenseNumber: null,
          TradeSampleFacilityName: null,
          TransferManifestNumber: '',
          TransferPackageStateName: null,
          UnitOfMeasureAbbreviation: 'lb',
          UnitOfMeasureId: 3,
          UnitOfMeasureQuantityType: 'WeightBased',
          SourceHarvestCount: 1,
          SourcePackageCount: 1,
          SourceProcessingJobCount: 1,
          SourceProcessingJobNumbers: '',
          SourceProcessingJobNames: '',
          MultiProcessingJob: false,
          ExpirationDate: null,
          SellByDate: null,
          UseByDate: null,
          LabTestResultDocumentFileId: null,
          IsOnTrip: false,
          IsOnRetailerDelivery: false,
          PackageForProductDestruction: null,
          Trip: null,
          HasPartial: false,
          IsPartial: false,
        });
        continue;
      }
    }

    return this._mockPackages;
  }

  // Static test set
  mockItems(): IItemData[] {
    if (this._mockItems.length > 0) {
      return this._mockItems;
    }

    this._mockItems.push(HARVESTED_FLOWER_ITEM);
    this._mockItems.push(CLONE_ITEM);
    this._mockItems.push(...TEMPLATE_ITEMS);

    return this._mockItems;
  }

  mockLocations(): ILocationData[] {
    if (this._mockLocations.length > 0) {
      return this._mockLocations;
    }

    this._mockLocations.push(ROW_01_LOCATION);
    this._mockLocations.push(FROZEN_STORAGE_LOCATION);

    return this._mockLocations;
  }

  mockStrains(): IStrainData[] {
    if (this._mockStrains.length > 0) {
      return this._mockStrains;
    }

    this._mockStrains.push(DO_SI_DOS_STRAIN);
    this._mockStrains.push(ICE_CREAM_CAKE_STRAIN);

    return this._mockStrains;
  }

  mockTags(): IIndexedTagData[] {
    if (this._mockTags.length > 0) {
      return this._mockTags;
    }

    const firstTag = 'AVAILABLE000000000000001';
    const lastTag = getTagFromOffset(firstTag, 499);

    const labels = generateTagRangeOrError(firstTag, lastTag);

    for (const [i, label] of labels.entries()) {
      if (i < 250) {
        this._mockTags.push({
          TagState: TagState.AVAILABLE,
          TagMatcher: '',
          LicenseNumber: '',
          Label: label,
          Id: 20000000 + i,
          IsArchived: false,
          IsUsed: false,
          LastModified: OLD_DATETIME,
          StatusName: 'Received',
          TagTypeName: 'CannabisPlant',
          UsedDateTime: '',
          CommissionedDateTime: OLD_DATETIME,
          DetachedDateTime: '',
        });
        continue;
      }
      if (i < 500) {
        this._mockTags.push({
          TagState: TagState.AVAILABLE,
          TagMatcher: '',
          LicenseNumber: '',
          Label: label,
          Id: 20000000 + i,
          IsArchived: false,
          IsUsed: false,
          LastModified: OLD_DATETIME,
          StatusName: 'Received',
          TagTypeName: 'CannabisPackage',
          UsedDateTime: '',
          CommissionedDateTime: OLD_DATETIME,
          DetachedDateTime: '',
        });
        continue;
      }
    }

    return this._mockTags;
  }

  mockItemCategories() {}

  mockUnitsOfMeasure(): IUnitOfMeasure[] {
    return [
      {
        Id: 5001,
        Name: 'Each',
      },
      {
        Id: 5004,
        Name: 'Grams',
      },
      {
        Id: 5002,
        Name: 'Pounds',
      },
    ] as IUnitOfMeasure[];
  }

  mockUnitsOfWeight() {}

  mockWasteReasons() {}

  mockWasteMethods() {}

  mockAdjustPackageReasons() {}

  mockRemediatePackageMethods() {}

  mockPlantBatchTypes(): IPlantBatchType[] {
    return [
      {
        Name: 'Clone',
        Id: 0,
        CanBeCloned: true,
        LastModified: '',
      },
      {
        Name: 'Seed',
        Id: 1,
        CanBeCloned: true,
        LastModified: '',
      },
    ];
  }

  mockPlantBatchGrowthPhases(): IPlantBatchGrowthPhase[] {
    return [{ Id: '3', Display: 'Flowering' }];
  }

  mockDefaultPhoneNumberForQuestions(): string {
    return '123-456-7890';
  }

  mockFacilityUsesLocationForPackages(): boolean {
    return store.state.flags?.mockedFlags.mockFacilityUsesLocationForPackages.enabled!;
  }

  mockFacilities(): IMetrcFacilityData[] {
    return [];
  }

  mockDestinationFacilities(): IMetrcFacilityData[] {
    return [
      {
        Id: 103,
        LicenseNumber: 'DESTINATION-103',
        FacilityName: 'Destination 103, LLC',
        FacilityTypeName: 'AM-Type N: Infusion',
        FacilityType: null,
        PhysicalAddress: {
          Id: 103,
          LicenseId: 0,
          AddressType: 'Physical',
          Recipient: '',
          Street1: '2086 Allston Way',
          Street2: '',
          Street3: '',
          Street4: '',
          City: 'Berkeley',
          County: 'ALAMEDA',
          State: 'CA',
          PostalCode: '94704',
          Country: '',
          AssessorParcelNumber: '',
          IsArchived: false,
        },
        MainPhoneNumber: '(123) 456-7890',
        MobilePhoneNumber: '(123) 456-7890',
      },
      {
        Id: 104,
        LicenseNumber: 'DESTINATION-104',
        FacilityName: 'Destination 104, LLC',
        FacilityTypeName: 'AM-Type N: Infusion',
        FacilityType: null,
        PhysicalAddress: {
          Id: 104,
          LicenseId: 0,
          AddressType: 'Physical',
          Recipient: '',
          Street1: '2086 Allston Way',
          Street2: '',
          Street3: '',
          Street4: '',
          City: 'Berkeley',
          County: 'ALAMEDA',
          State: 'CA',
          PostalCode: '94704',
          Country: '',
          AssessorParcelNumber: '',
          IsArchived: false,
        },
        MainPhoneNumber: '(123) 456-7890',
        MobilePhoneNumber: '(123) 456-7890',
      },
    ];
  }

  mockTransporterFacilities(): IMetrcFacilityData[] {
    return [
      {
        Id: 101,
        LicenseNumber: 'TRANSPORTER-101',
        FacilityName: 'Transporter 101, LLC',
        FacilityTypeName: 'AM-Type N: Infusion',
        FacilityType: null,
        PhysicalAddress: {
          Id: 101,
          LicenseId: 0,
          AddressType: 'Physical',
          Recipient: '',
          Street1: '101 Main Street',
          Street2: '',
          Street3: '',
          Street4: '',
          City: 'Berkeley',
          County: 'ALAMEDA',
          State: 'CA',
          PostalCode: '94709',
          Country: '',
          AssessorParcelNumber: '',
          IsArchived: false,
        },
        MainPhoneNumber: '(123) 456-7890',
        MobilePhoneNumber: '(123) 456-7890',
      },
      {
        Id: 102,
        LicenseNumber: 'TRANSPORTER-102',
        FacilityName: 'Transporter 102, LLC',
        FacilityTypeName: 'AM-Type N: Infusion',
        FacilityType: null,
        PhysicalAddress: {
          Id: 202,
          LicenseId: 0,
          AddressType: 'Physical',
          Recipient: '',
          Street1: '102 Main Street',
          Street2: '',
          Street3: '',
          Street4: '',
          City: 'Berkeley',
          County: 'ALAMEDA',
          State: 'CA',
          PostalCode: '94709',
          Country: '',
          AssessorParcelNumber: '',
          IsArchived: false,
        },
        MainPhoneNumber: '(123) 456-7890',
        MobilePhoneNumber: '(123) 456-7890',
      },
    ];
  }

  mockTransferTypes(): IMetrcTransferType[] {
    return [
      {
        Id: 101,
        Name: 'Return',
        TransactionType: 'Standard',
        TransactionTypeName: 'Standard',
        ForLicensedShipments: true,
        ForExternalIncomingShipments: true,
        ShipperLicenseNumberFieldEnabled: true,
        ShipperLicenseNumberFieldLabel: 'Origin Temp. Lic. No.',
        ShipperLicenseNameFieldEnabled: true,
        ShipperAddressFieldsEnabled: true,
        ForExternalOutgoingShipments: true,
        RecipientLicenseNumberFieldEnabled: true,
        RecipientLicenseNumberFieldLabel: 'Destination Temp. Lic. No.',
        RecipientLicenseNameFieldEnabled: true,
        RecipientAddressFieldsEnabled: true,
        TransporterFieldsEnabled: true,
        RequiresDestinationGrossWeight: false,
        RequiresPackagesGrossWeight: false,
        MinimumWholesalePrice: null,
        MaximumWholesalePrice: null,
        FacilityTypes: [
          {
            FacilityTypeId: 209,
            FacilityTypeName: 'Cannabis - Microbusiness License',
          },
        ],
      },
      {
        Id: 116,
        Name: 'State Authorized',
        TransactionType: 'Standard',
        TransactionTypeName: 'Standard',
        ForLicensedShipments: true,
        ForExternalIncomingShipments: false,
        ShipperLicenseNumberFieldEnabled: false,
        ShipperLicenseNumberFieldLabel: '',
        ShipperLicenseNameFieldEnabled: false,
        ShipperAddressFieldsEnabled: false,
        ForExternalOutgoingShipments: false,
        RecipientLicenseNumberFieldEnabled: false,
        RecipientLicenseNumberFieldLabel: '',
        RecipientLicenseNameFieldEnabled: false,
        RecipientAddressFieldsEnabled: false,
        TransporterFieldsEnabled: false,
        RequiresDestinationGrossWeight: false,
        RequiresPackagesGrossWeight: false,
        MinimumWholesalePrice: null,
        MaximumWholesalePrice: null,
        FacilityTypes: [
          {
            FacilityTypeId: 209,
            FacilityTypeName: 'Cannabis - Microbusiness License',
          },
        ],
      },
      {
        Id: 1,
        Name: 'Transfer',
        TransactionType: 'Standard',
        TransactionTypeName: 'Standard',
        ForLicensedShipments: true,
        ForExternalIncomingShipments: true,
        ShipperLicenseNumberFieldEnabled: true,
        ShipperLicenseNumberFieldLabel: 'Origin Temp. Lic. No.',
        ShipperLicenseNameFieldEnabled: true,
        ShipperAddressFieldsEnabled: true,
        ForExternalOutgoingShipments: true,
        RecipientLicenseNumberFieldEnabled: true,
        RecipientLicenseNumberFieldLabel: 'Destination Temp. Lic. No.',
        RecipientLicenseNameFieldEnabled: true,
        RecipientAddressFieldsEnabled: true,
        TransporterFieldsEnabled: true,
        RequiresDestinationGrossWeight: false,
        RequiresPackagesGrossWeight: false,
        MinimumWholesalePrice: null,
        MaximumWholesalePrice: null,
        FacilityTypes: [
          {
            FacilityTypeId: 209,
            FacilityTypeName: 'Cannabis - Microbusiness License',
          },
        ],
      },
      {
        Id: 111,
        Name: 'Wholesale Manifest',
        TransactionType: 'Wholesale',
        TransactionTypeName: 'Wholesale',
        ForLicensedShipments: true,
        ForExternalIncomingShipments: true,
        ShipperLicenseNumberFieldEnabled: true,
        ShipperLicenseNumberFieldLabel: 'Origin Temp. Lic. No.',
        ShipperLicenseNameFieldEnabled: true,
        ShipperAddressFieldsEnabled: true,
        ForExternalOutgoingShipments: true,
        RecipientLicenseNumberFieldEnabled: true,
        RecipientLicenseNumberFieldLabel: 'Destination Temp. Lic. No.',
        RecipientLicenseNameFieldEnabled: true,
        RecipientAddressFieldsEnabled: true,
        TransporterFieldsEnabled: true,
        RequiresDestinationGrossWeight: false,
        RequiresPackagesGrossWeight: false,
        MinimumWholesalePrice: null,
        MaximumWholesalePrice: null,
        FacilityTypes: [
          {
            FacilityTypeId: 209,
            FacilityTypeName: 'Cannabis - Microbusiness License',
          },
        ],
      },
    ];
  }

  mockDrivers(): IMetrcDriverData[] {
    return [
      {
        DriverName: 'Driver One',
        DriverOccupationalLicenseNumber: 'Driver1',
        DriverVehicleLicenseNumber: 'DRV00001',
      },
      {
        DriverName: 'Driver Two',
        DriverOccupationalLicenseNumber: 'Driver2',
        DriverVehicleLicenseNumber: 'DRV00002',
      },
      {
        DriverName: 'Driver Three',
        DriverOccupationalLicenseNumber: 'Driver3',
        DriverVehicleLicenseNumber: 'DRV00003',
      },
    ];
  }

  mockVehicles(): IMetrcVehicleData[] {
    return [
      {
        VehicleMake: 'Ford',
        VehicleModel: 'F-150',
        VehicleLicensePlateNumber: '1111111',
      },
      {
        VehicleMake: 'Ford',
        VehicleModel: 'F-250',
        VehicleLicensePlateNumber: '2222222',
      },
      {
        VehicleMake: 'Ford',
        VehicleModel: 'F-350',
        VehicleLicensePlateNumber: '3333333',
      },
    ];
  }
}

export const mockDataManager = new MockDataManager();
