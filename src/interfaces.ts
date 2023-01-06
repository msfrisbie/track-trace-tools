import {
  BackgroundTaskState,
  Level,
  MessageType,
  MetrcStatus,
  PackageState,
  PlantState,
  SearchModalView,
  TagState,
  TaskType,
  ToolkitView,
  TransferState,
} from "@/consts";
import { IFlagsState } from "./store/page-overlay/modules/flags/interfaces";
import { IListingState } from "./store/page-overlay/modules/listing/interfaces";
import { IPackageHistoryState } from "./store/page-overlay/modules/package-history/interfaces";
import { IPackageSearchState } from "./store/page-overlay/modules/package-search/interfaces";
import { IPlantSearchState } from "./store/page-overlay/modules/plant-search/interfaces";
import { IPluginAuthState } from "./store/page-overlay/modules/plugin-auth/interfaces";
import { IPromoteImmaturePlantsBuilderState } from "./store/page-overlay/modules/promote-immature-plants-builder/interfaces";
import { ISearchState } from "./store/page-overlay/modules/search/interfaces";
import { ISettingsState } from "./store/page-overlay/modules/settings/interfaces";
import { ISplitPackageBuilderState } from "./store/page-overlay/modules/split-package-builder/interfaces";
import { ITransferBuilderState } from "./store/page-overlay/modules/transfer-builder/interfaces";
import { CsvUpload, CsvUploadStatus } from "./types";

export type PlantBatchTypeName = "Clone" | "Seed";
export type PlantGrowthPhase = "Vegetative" | "Flowering";
export type HarvestType = "WholePlant" | "Manicure";

export interface IAtomicService {
  init: () => Promise<void>;
}

export enum DarkModeState {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

export enum SnowflakeState {
  ENABLED = "ENABLED",
  CSS = "CSS",
  DISABLED = "DISABLED",
}

export interface IAccountSettings {
  backupBuilderSubmits: boolean;
}

export interface ITrackedInteractions {
  dismissedScreenshotPopover: boolean;
  dismissedCsvBuilderPopover: boolean;
  dismissedBuilderPopover: boolean;
  dismissedToolboxPopover: boolean;
  dismissedReportsPopover: boolean;
  dismissedFacilityPopover: boolean;
  dismissedSearchPopover: boolean;
}

export interface IFilter {
  field: string;
  operator: "eq" | "contains" | "endswith" | "gt" | "lt";
  value: string;
}

export interface ISort {
  field: string;
  dir: "asc";
}

export interface ICollectionFilters {
  logic: "and" | "or";
  filters: IFilter[];
}

export interface ICollectionRequest {
  request: {
    filter?: ICollectionFilters;
    sort?: ISort[];
    take: number;
    skip: number;
    page: number;
    pageSize: number;
    group: any[];
  };
}

export interface ICollectionResponse<T> {
  Data: T[];
  Total: number;
}

export interface IPackageSearchFilters {
  label: string | null;
  sourceHarvestName: string | null;
  sourcePackageLabel: string | null;
  itemName: string | null;
  itemStrainName: string | null;
  itemProductCategoryName: string | null;
  locationName: string | null;
}

export interface IPlantSearchFilters {
  label: string | null;
  strainName: string | null;
  locationName: string | null;
}

export interface ITransferSearchFilters {
  manifestNumber: string | null;
}

export interface ITagSearchFilters {
  label: string | null;
}

export interface ITransferPackageList {
  identity: string;
  license: string;
  packages: IPackageData[];
}

export interface IBackgroundTasksState {
  finalizeSalesReceiptsState: BackgroundTaskState;
  finalizeSalesReceiptsLicense: string | null;
  finalizeSalesReceiptsStopIsodate: string | null;
  finalizeSalesReceiptsReadout: string | null;
  finalizeSalesReceiptsRunningTotal: number;
  finalizeSalesReceiptsConsecutiveErrorTotal: number;
  voidTagsState: BackgroundTaskState;
  voidTagsLicense: string | null;
  voidTagsStartTag: string | null;
  voidTagsEndTag: string | null;
  voidTagsLastAttemptedTag: string | null;
  voidTagsReadout: string | null;
  voidTagsRunningTotal: number;
  voidTagsConsecutiveErrorTotal: number;
}

export interface IRootState {
  // authState: IAuthState | null;
  accountEnabled: boolean;
  accountSettings: IAccountSettings;
  contactData: IContactData | null;
  currentVersion: string | null;
  currentView: ToolkitView | null;
  currentViewSelectedAt: number | null;
  credentials: string | null;
  builderModalOpen: CsvUpload | null;
  debugMode: boolean;
  demoMode: boolean;
  mockDataMode: boolean;
  errorMessage: string | null;
  expanded: boolean;
  flashMessage: string | null;
  flashMessageTimeout: number | null;
  loadingMessage: string | null;
  muteAnalytics: boolean;
  navigateOnNextLoad: boolean;
  omniQueryString: string;
  omniQueryStringHistory: string[];
  searchModalView: SearchModalView | null;
  showTransferSearchResults: boolean;
  tagQueryString: string;
  tagQueryStringHistory: string[];
  tagSearchFilters: ITagSearchFilters;
  taskQueue: Array<Task>;
  taskQueuePaused: boolean;
  trackedInteractions: ITrackedInteractions;
  transferQueryString: string;
  transferQueryStringHistory: string[];
  transferSearchFilters: ITransferSearchFilters;
  backgroundTasks: IBackgroundTasksState;
  metrcStatusData: IMetrcStatusData | null;
}

export interface IPluginState extends IRootState {
  // Modules
  pluginAuth: IPluginAuthState;
  transferBuilder: ITransferBuilderState;
  packageSearch: IPackageSearchState;
  plantSearch: IPlantSearchState;
  splitPackageBuilder: ISplitPackageBuilderState;
  promoteImmaturePlantsBuilder: IPromoteImmaturePlantsBuilderState;
  search: ISearchState;
  settings: ISettingsState;
  listing: IListingState;
  flags: IFlagsState;
  packageHistory: IPackageHistoryState;
}

export type MetrcTagType = "CannabisPlant" | "CannabisPackage";

export interface IAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

export interface IContactInfo {
  contactName: string;
  phoneNumber: string;
  address: IAddress;
}

export interface IExtractedITagOrderData {
  maxPlantOrderSize: number;
  maxPackageOrderSize: number;
  contactInfo: IContactInfo;
}

export interface IExtractedAuthData {
  identity: string;
  license: string;
  apiVerificationToken: string;
}

export interface IExtractedContactData {
  email: string | null;
  phoneNumber: string | null;
}

export interface IExtractedApiKeyData {
  apiKey: string;
}

export interface IExtractedRepeaterData {
  parsedRepeaterData: Object;
}

export interface IExtractedDataImportApiVerificationTokenData {
  apiVerificationToken: string;
}

export interface ITagOrderParams {
  MaxOrderQuantity: number;
  TagType: MetrcTagType;
}

export interface IMetrcShippingData {
  Address: {
    AddressValidationOverridden?: "true" | "false";
    City: string;
    PostalCode: string;
    State: string;
    Street1: string;
    Street2: string;
  };
  ContactName: string;
  ContactPhoneNumber: string;
}

export interface ITagOrderModalData {
  Details: Array<ITagOrderParams>;
  Shipping: IMetrcShippingData;
}

export interface IAuthState {
  identity: string;
  license: string;
  apiVerificationToken: string;
  hostname: string;
}

export interface ICurrentUser {
  uuid: string;
  email: string;
  metrc_hostname: string;
  license_numbers: string[];
  accepted_user_agreement_at: string[];
}

export interface IContactData {
  email: string;
  phoneNumber: string;
  lastSuccessfulContactDataFetch: number;
}

export interface IIdentityState {
  email: string;
  password: string;
  phoneNumber: string;
}

export interface IApiKeyState {
  metrcApiKey: string;
}

export interface Task {
  taskId: string;
  taskType: TaskType;
  taskName: string;
  taskData: any;
}

export interface IResponseObjectData {
  Id: number;
}
export interface ITaggedIResponseObjectData extends IResponseObjectData {
  Label: string;
}

export interface ITagData extends ITaggedIResponseObjectData {
  Id: number;
  IsArchived: boolean;
  IsUsed: boolean;
  LastModified: string;
  StatusName: "Received" | "Used" | "Voided";
  TagTypeName: "CannabisPlant" | "CannabisPackage";
  UsedDateTime: string;
  CommissionedDateTime: string;
  DetachedDateTime: string;
}
export interface IItemData extends IResponseObjectData {
  AdministrationMethod: string;
  ApprovalStatusDateTime: string;
  ApprovalStatusName: "Approved";
  DefaultLabTestingStateName: "NotRequired" | "NotSubmitted";
  Description: string;
  FacilityLicenseNumber: string | null;
  FacilityName: string | null;
  IsArchived: boolean;
  IsUsed: boolean;
  ItemBrandId: number;
  ItemBrandName: string | null;
  LabelImages: any[];
  Name: string;
  NumberOfDoses: number | null;
  PackagingImages: any[];
  ProductCategoryName: string;
  ProductCategoryTypeName: string;
  ProductImages: any[];
  PublicIngredients: string;
  QuantityTypeName: "WeightBased" | "CountBased" | "VolumeBased";
  ServingSize: string;
  StrainName: string | null;
  SupplyDurationDays: number | null;
  UnitCbdContent: number | null;
  UnitCbdContentDose: number | null;
  UnitCbdContentDoseUnitOfMeasureAbbreviation: number | null;
  UnitCbdContentUnitOfMeasureAbbreviation: number | null;
  UnitCbdPercent: number | null;
  UnitOfMeasureId: number;
  UnitOfMeasureName: string;
  UnitQuantity: number | null;
  UnitQuantityUnitOfMeasureAbbreviation: string | null;
  UnitThcContent: number | null;
  UnitThcContentDose: number | null;
  UnitThcContentDoseUnitOfMeasureAbbreviation: string | null;
  UnitThcContentUnitOfMeasureAbbreviation: string | null;
  UnitThcPercent: number | null;
  UnitVolume: number | null;
  UnitVolumeUnitOfMeasureAbbreviation: string | null;
  UnitWeight: number | null;
  UnitWeightUnitOfMeasureAbbreviation: string | null;
}

// Values that are defined per-request
export interface IPaginationOptions {
  page: number;
  pageSize: number;
}

// Values defined for an entire stream
export interface IDataLoadOptions {
  maxCount?: number;
  pageSize?: number;
}

export interface IPackageOptions extends IDataLoadOptions {}

export interface IPlantOptions extends IDataLoadOptions {
  filter: IPlantFilter;
}

export interface IPlantFilter {
  locationName?: string | null;
  strainName?: string | null;
  label?: string | null;
  floweringDateGt?: string | null;
  floweringDateEq?: string | null;
  floweringDateLt?: string | null;
  plantedDateGt?: string | null;
  plantedDateEq?: string | null;
  plantedDateLt?: string | null;
}

export interface IPlantBatchOptions extends IDataLoadOptions {
  filter: IPlantBatchFilter;
}

export interface IPlantBatchFilter {
  locationName?: string | null;
  strainName?: string | null;
}

export interface IPackageFilter {
  label?: string | null;
}

export interface IHarvestFilter {
  harvestName?: string | null;
}

export interface ITransferFilter {
  manifestNumber?: string | null;
}

export interface ITagFilter {
  label?: string | null;
}

export interface ISalesReceiptSort {
  RecordedDateTime: "asc";
}

export interface IPlantSort {
  Label: "asc";
}

export interface IPlantBatchSort {
  Name: "asc";
}

export interface IPlantBatchData {
  DestroyedCount: number;
  HarvestedCount: number;
  Id: number;
  LastModified: string;
  LocationName: string;
  LocationTypeName: string;
  Name: string;
  PackagedCount: number;
  PatientLicenseNumber: string;
  PlantedDate: string;
  SourcePackageLabel: string;
  SourcePlantBatchName: string | null;
  SourcePlantLabel: string | null;
  StrainName: string;
  TrackedCount: number;
  TypeName: string;
  UntrackedCount: number;
}

export interface IPlantData extends ITaggedIResponseObjectData {
  DestroyedByUserName: string | null;
  DestroyedDate: string | null;
  DestroyedNote: string | null;
  FloweringDate: string;
  GrowthPhaseName: PlantGrowthPhase;
  HarvestCount: number;
  Id: number;
  IsOnHold: boolean;
  LastModified: string;
  LocationName: string;
  LocationTypeName: string;
  PatientLicenseNumber: string;
  PlantBatchName: string;
  PlantBatchTypeName: PlantBatchTypeName;
  PlantedDate: string;
  StateName: string;
  StrainName: string;
  VegetativeDate: string | null;
}

export interface IPackageData extends ITaggedIResponseObjectData {
  ArchivedDate: string | null;
  ContainsRemediatedProduct: boolean;
  DonationFacilityLicenseNumber: string | null;
  DonationFacilityName: string | null;
  FacilityLicenseNumber: string | null;
  FacilityName: string | null;
  FinishedDate: string | null;
  InitialLabTestingState: "NotRequired" | "TestPassed" | "NotSubmitted";
  IsArchived: boolean;
  IsDonation: boolean;
  IsDonationPersistent: boolean;
  IsFinished: boolean;
  IsInTransit: boolean;
  IsOnHold: boolean;
  IsProcessValidationTestingSample: boolean;
  IsProductionBatch: boolean;
  IsTestingSample: boolean;
  IsTradeSample: boolean;
  IsTradeSamplePersistent: boolean;
  Item: IItemData;
  ItemFromFacilityLicenseNumber: string;
  ItemFromFacilityName: string;
  LabTestingStateDate: string;
  LabTestingStateName: string;
  Label: string;
  LastModified: string;
  LocationName: string | null;
  LocationTypeName: string | null;
  MultiHarvest: boolean;
  MultiPackage: boolean;
  MultiProductionBatch: boolean;
  Note: string;
  PackageType: "ImmaturePlant" | "Product";
  PackagedByFacilityLicenseNumber: string;
  PackagedByFacilityName: string;
  PackagedDate: string;
  PatientLicenseNumber: string;
  ProductRequiresRemediation: boolean;
  ProductionBatchNumber: string;
  Quantity: number;
  ReceivedDateTime: string | null;
  ReceivedFromFacilityLicenseNumber: string | null;
  ReceivedFromFacilityName: string | null;
  ReceivedFromManifestNumber: string | null;
  RemediationDate: string | null;
  SourceHarvestNames: string; // "HARVEST 1, HARVEST 2, "
  SourcePackageIsDonation: boolean;
  SourcePackageIsTradeSample: boolean;
  SourcePackageLabels: string; // "1A4000000000000000000528, 1A4000000000000000000529, "
  SourceProductionBatchNumbers: string; // "BATCH 1, BATCH 2, "
  TradeSampleFacilityName: string | null;
  TradeSampleFacilityLicenseNumber: string | null;
  TransferManifestNumber: string;
  TransferPackageStateName: string | null;
  UnitOfMeasureAbbreviation: "lb" | "ea";
  UnitOfMeasureId: number;
  UnitOfMeasureQuantityType: "WeightBased" | "CountBased";
}
export interface ITagOrderData extends IResponseObjectData {
  FacilityContactName: string;
  FacilityAddressStreet1: string;
  FacilityAddressStreet2: string;
  FacilityAddressStreet3: string;
  FacilityAddressStreet4: string;
  FacilityAddressCity: string;
  FacilityAddressState: string;
  FacilityAddressPostalCode: string;
  FacilityPhoneNumber: string;
}

export interface ITransferHistoryData {
  ActualDate: null;
  Descriptions: string[];
  ExternalSourceName: string;
  InputSourcesNames: string;
  RecordedDateTime: string;
  UserName: string;
}

export interface ITestResultData {
  IsRevoked: boolean;
  LabFacilityLicenseNumber: string;
  LabFacilityName: string;
  LabTestDetailId: number;
  LabTestDetailIsRevoked: boolean;
  LabTestDetailRevokedDate: string | null;
  LabTestResultDocumentFileId: number;
  LabTestResultId: number;
  OverallPassed: boolean;
  PackageId: number;
  ProductCategoryName: string;
  ProductName: string;
  ResultReleaseDateTime: string;
  ResultReleased: boolean;
  RevokedDate: string | null;
  SourcePackageLabel: string;
  TestComment: string;
  TestInformationalOnly: boolean;
  TestPassed: boolean;
  TestPerformedDate: string;
  TestResultLevel: number;
  TestTypeName: string;
}

export interface IIndexedPlantData extends IPlantData {
  PlantState: PlantState;
  TagMatcher: string;
}

export interface IIndexedPackageData extends IPackageData {
  PackageState: PackageState;
  TagMatcher: string;
}

export interface ITransferData {
  ActualArrivalDateTime: string | null;
  ActualDepartureDateTime: string | null;
  ActualReturnArrivalDateTime: string | null;
  ActualReturnDepartureDateTime: string | null;
  CanEdit: boolean;
  ContainsDonation: boolean;
  ContainsPlantPackage: boolean;
  ContainsProductPackage: boolean;
  ContainsProductRequiresRemediation: boolean;
  ContainsRemediatedProductPackage: boolean;
  ContainsTestingSample: boolean;
  ContainsTradeSample: boolean;
  CreatedByUserName: string;
  CreatedDateTime: string;
  DeliveryCount: number;
  DeliveryFacilities: string;
  DeliveryId: number;
  DeliveryPackageCount: number;
  DeliveryReceivedPackageCount: number;
  DriverName: string;
  DriverOccupationalLicenseNumber: string;
  DriverVehicleLicenseNumber: string;
  EditCount: number;
  EstimatedArrivalDateTime: string;
  EstimatedDepartureDateTime: string;
  EstimatedReturnArrivalDateTime: string | null;
  EstimatedReturnDepartureDateTime: string | null;
  Id: number;
  IsVoided: boolean;
  LastModified: string;
  ManifestNumber: string;
  Name: string | null;
  PackageCount: number;
  ReceivedByName: string | null;
  ReceivedDateTime: string | null;
  ReceivedDeliveryCount: number;
  ReceivedPackageCount: number;
  RecipientFacilityLicenseNumber: string;
  RecipientFacilityName: string;
  ShipmentLicenseTypeName: string;
  ShipmentTransactionTypeName: string;
  ShipmentTypeName: string;
  ShipperFacilityLicenseNumber: string;
  ShipperFacilityName: string;
  TransporterFacilityLicenseNumber: string;
  TransporterFacilityName: string;
  VehicleLicensePlateNumber: string;
  VehicleMake: string;
  VehicleModel: string;
}

export interface IVehicleData {
  Id: number;
  Make: string;
  Model: string;
  LicensePlateNumber: string;
}

export interface IDriverData {
  Id: number;
  Name: string;
  EmployeeId: string;
  DriversLicenseNumber: string;
}

export interface IIndexedHarvestData extends IHarvestData {
  HarvestState: HarvestState;
  TagMatcher: string;
}

export interface IIndexedTransferData extends ITransferData {
  TransferState: TransferState;
  TagMatcher: string;
}

export interface IIndexedTagData extends ITagData {
  TagState: TagState;
  TagMatcher: string;
}

export interface IMetrcAddPackageNoteData {
  Id: number;
  Note: string;
}

export interface IReorderTagsPayload {
  Details: Array<{
    TagType: MetrcTagType;
    Quantity: string;
  }>;
  Shipping: IMetrcShippingData;
}

export interface IReorderTagsFormData {
  plantTagCount: number;
  packageTagCount: number;
  contactInfo: IContactInfo;
}

export interface IIndexedPackageFilters {}

export interface IIndexedTransferFilters {}

export interface IIndexedTagFilters {}

export interface IBusMessageOptions {
  muteAnalytics?: boolean;
}

export interface IBusMessage {
  type: MessageType;
  data: any;
  options: IBusMessageOptions;
}

export interface IBusEvent {
  uuid?: string;
  message: IBusMessage;
}

export interface IBackgroundScriptScreenshotUploadData {
  metrcId: string;
  state: string;
  url: string;
  license: string;
}

export interface IContentScriptScreenshotUploadData extends IBackgroundScriptScreenshotUploadData {
  blobUrl: string;
}

export interface IDocumentUploadData {
  blobUrl: string;
  apiKey: string;
}

export interface ITelemetryData {
  origin: string;
  success: boolean;
  responseMs: number;
  errorMessage?: string;
  statusCode?: number;
}

export interface IPluginUserData {
  metrcId: string;
  licenseNumber: string;
  state: string;
  apiKey: string;
}

export interface IPluginCsvData extends IPluginUserData {
  dataType: string;
  signature: string;
  filename: string;
  data: any[][];
}

export interface CsvGroup {
  groupId: string;
}

export interface PlantTagsCsvGroup {
  plantTags: string[];
}

export interface LocationCsvGroup {
  locationName: string;
}

export interface DateCsvGroup {
  isoDate: string;
}

export interface PatientIdCsvGroup {
  patientId: "X00001";
}

export interface CsvPlantLocationGroup
  extends CsvGroup,
    PlantTagsCsvGroup,
    LocationCsvGroup,
    DateCsvGroup {}

export interface CsvPlantHarvestGroup
  extends CsvGroup,
    PlantTagsCsvGroup,
    LocationCsvGroup,
    PatientIdCsvGroup,
    DateCsvGroup {}

export interface ICsvFile {
  filename: string;
  data: any[][];
}

export interface ICsvUploadResult {
  DataTag: CsvUpload;
  DataTagString: CsvUpload;
  FacilityId: number;
  FacilityLicenseNumber: string;
  FacilityName: string;
  FileName: string;
  Id: number;
  Processed: boolean;
  Status: CsvUploadStatus;
  TotalRows: number;
  UploadDateTime: string;
  UserId: number;
  UserName: string;
}

export interface ILocationData {
  ForHarvests: boolean;
  ForPackages: boolean;
  ForPlantBatches: boolean;
  ForPlants: boolean;
  Id: number;
  IsArchived: boolean;
  LocationTypeId: number;
  LocationTypeName: "Default Location Type";
  Name: string;
}

export interface IStrainData {
  Id: number;
  Name: string;
  CbdLevel: number | null;
  IndicaPercentage: number;
  SativaPercentage: number;
  IsUsed: boolean;
  TestingStatus: string;
  ThcLevel: number | null;
  IsArchived: boolean;
}

export interface IHarvestData {
  ArchivedDate: string | null;
  CurrentWeight: number;
  DryingLocationName: string;
  DryingLocationTypeName: "Default Location Type";
  FacilityLicenseNumber: string | null;
  FacilityName: string | null;
  FinishedDate: string | null;
  HarvestStartDate: string | null;
  HarvestType: HarvestType;
  HarvestTypeName: "Harvest Batch";
  Id: number;
  IsArchived: boolean;
  IsFinished: boolean;
  IsOnHold: boolean;
  LabTestingStateDate: string | null;
  LabTestingStateName: string;
  LastModified: string;
  MultiStrain: boolean;
  Name: string;
  PackageCount: number;
  PatientLicenseNumber: string;
  PlantCount: number;
  SourceStrainCount: number;
  SourceStrainNames: string;
  TotalPackagedWeight: number;
  TotalRestoredWeight: number;
  TotalWasteWeight: number;
  TotalWetWeight: number;
  UnitOfWeightAbbreviation: string;
  UnitOfWeightId: number;
}

export interface ISalesReceiptData {
  ArchivedDate: string | null;
  CaregiverLicenseNumber: string;
  Id: number;
  IdentificationMethod: string;
  IsArchived: boolean;
  IsFinal: boolean;
  LastModified: string;
  PatientLicenseNumber: string;
  ReceiptNumber: string;
  RecordedByUserName: string;
  RecordedDateTime: string;
  SalesCustomerType: string;
  SalesCustomerTypeName: string;
  SalesDateTime: string;
  TotalPackages: number;
  TotalPrice: number;
  Transactions: any[];
}

export interface IMetrcFacilityData {
  Id: number;
  LicenseNumber: string;
  FacilityName: string;
  FacilityTypeName: string;
  FacilityType: null;
  PhysicalAddress: {
    Id: number;
    LicenseId: number;
    AddressType: string;
    Recipient: string;
    Street1: string;
    Street2: string;
    Street3: string;
    Street4: string;
    City: string;
    County: string;
    State: string;
    PostalCode: string;
    Country: string;
    AssessorParcelNumber: string;
    IsArchived: boolean;
  };
  MainPhoneNumber: string;
  MobilePhoneNumber: string;
}

export interface IMetrcTransferType {
  Id: number;
  Name: string;
  TransactionType: string;
  TransactionTypeName: string;
  ForLicensedShipments: boolean;
  ForExternalIncomingShipments: boolean;
  ShipperLicenseNumberFieldEnabled: boolean;
  ShipperLicenseNumberFieldLabel: string;
  ShipperLicenseNameFieldEnabled: boolean;
  ShipperAddressFieldsEnabled: boolean;
  ForExternalOutgoingShipments: boolean;
  RecipientLicenseNumberFieldEnabled: boolean;
  RecipientLicenseNumberFieldLabel: string;
  RecipientLicenseNameFieldEnabled: boolean;
  RecipientAddressFieldsEnabled: boolean;
  TransporterFieldsEnabled: boolean;
  RequiresDestinationGrossWeight: boolean;
  RequiresPackagesGrossWeight: boolean;
  MinimumWholesalePrice: null;
  MaximumWholesalePrice: null;
  FacilityTypes: { FacilityTypeId: number; FacilityTypeName: string }[];
}

export interface IMetrcCreateStateAuthorizedTransferPayload {
  Destinations: IMetrcStateAuthorizedTransferDestinationData[];
  ShipmentLicenseType: string;
}

export interface IMetrcCreateTransferPayload {
  Destinations: IMetrcTransferDestinationData[];
  ShipmentLicenseType: string;
}

interface IMetrcSharedTransferDestinationData {
  ShipmentLicenseType: string;
  RecipientId: string;
  PlannedRoute: string;
  TransferTypeId: string;
  EstimatedDepartureDateTime: string;
  EstimatedArrivalDateTime: string;
  GrossWeight: string;
  GrossUnitOfWeightId: string;
  Packages: IMetrcTransferPackageData[];
}

export interface IMetrcStateAuthorizedTransferDestinationData
  extends IMetrcSharedTransferDestinationData {}

export interface IMetrcTransferDestinationData extends IMetrcSharedTransferDestinationData {
  Transporters: IMetrcTransferTransporterData[];
}

export interface IMetrcTransferPackageData {
  Id: string;
  WholesalePrice: string;
  GrossWeight: string;
  GrossUnitOfWeightId: string;
}

export interface IMetrcTransferTransporterData {
  TransporterId: string;
  PhoneNumberForQuestions: string;
  EstimatedArrivalDateTime: string;
  EstimatedDepartureDateTime: string;
  TransporterDetails: IMetrcTransferTransporterDetailsData[];
}

export interface IMetrcTransferTransporterDetailsData {
  DriverName: string;
  DriverOccupationalLicenseNumber: string;
  DriverLicenseNumber: string;
  VehicleMake: string;
  VehicleModel: string;
  VehicleLicensePlateNumber: string;
}

export interface IMetrcMovePlantsPayload {
  ActualDate: string;
  LocationId: string;
  Id: string;
}

export interface IMetrcMovePackagesPayload {
  ActualDate: string;
  LocationId: string;
  Id: string;
}

export interface IMetrcHarvestPlantsPayload {
  ActualDate: string;
  DryingLocation: string;
  HarvestName: string;
  Id: string;
  PlantWeight: string;
  UnitOfWeightId: string;
}

export interface IMetrcManicurePlantsPayload {
  ActualDate: string;
  DryingLocation: string;
  HarvestName: string;
  Id: string;
  ProductWeight: string;
  UnitOfWeightId: string;
}

export interface IMetrcReplacePlantTagsPayload {
  ActualDate: string;
  Id: string;
  TagId: string;
}

export interface IMetrcReplacePlantBatchTagsPayload {
  ActualDate: string;
  Id: string;
  TagId: string;
}

// Quantity will be positive, so "3" means "decreased by 3"
export interface IPackageIngredient {
  FinishDate: string;
  PackageId: string;
  Quantity: string;
  UnitOfMeasureId: string;
}

export interface IMetrcCreatePackagesFromPackagesPayload {
  ActualDate: string;
  Ingredients: IPackageIngredient[];
  ItemId: string;
  LocationId?: string;
  Note: string;
  ProductionBatchNumber: string;
  Quantity: string;
  TagId: string;
  UnitOfMeasureId: string;
  RemediationDate: string;
  RemediationMethodId: string;
  RemediationSteps: string;
  UseSameItem?: "true" | "false";
  IsDonation?: "true";
  IsFromMotherPlant?: "true";
}

export interface IMetrcFinishPackagesPayload {
  ActualDate: string;
  Id: string;
}

export interface IMetrcAdjustPackagePayload {}

export interface IMetrcChangePackageItemPayload {}

export interface IMetrcDestroyPlantsPayload {
  ActualDate: string;
  Id: string;
  MaterialMixed: string;
  PlantWasteMethodId: string;
  ReasonNote: string;
  WasteReasonId: string;
  WasteUnitOfMeasureId: string;
  WasteWeight: string;
}

export interface IMetrcCreatePlantBatchPackagesFromMotherPlantPayload {
  ItemId: string;
  LocationId?: string;
  Note: string;
  PackageDate: string;
  PlantBatchTypeId: string;
  PlantId: string;
  PlantsCount: string;
  TagId: string;
}

export interface IMetrcCreatePlantBatchPackagesFromMotherPlantBatchPayload {
  ActualDate: string;
  LocationId?: string;
  Count: string;
  IsDonation?: "true";
  IsFromMotherPlant?: "true";
  ItemId: string;
  Note: string;
  PlantBatchId: string;
  TagId: string;
}

export interface IMetrcCreatePlantBatchPackagesFromImmaturePlantBatchPayload {
  ActualDate: string;
  Count: string;
  ItemId: string;
  Note: string;
  PlantBatchId: string;
  TagId: string;
}

// Unused
export interface IMetrcCreatePlantBatchesFromMotherPlant {
  ActualDate: string;
  LocationId: string;
  PlantBatchTypeId: string;
  PlantId: string;
  PlantsCount: string;
  StrainId: string;
  TagId: string;
}

export interface IMetrcUnpackImmaturePlantsPayload {
  ActualDate: string;
  LocationId: string;
  PackageId: string;
  PlantBatchTypeId: string;
  PlantedDate: string;
  PlantsCount: string;
  Quantity: string;
  StrainId: string;
  TagId: string;
  UnitOfMeasureId: string;
}

export interface IMetrcPackImmaturePlantsPayload {
  ActualDate: string;
  LocationId: string;
  PackageId: string;
  PlantBatchTypeId: string;
  PlantedDate: string;
  PlantsCount: string;
  Quantity: string;
  StrainId: string;
  TagId: string;
  UnitOfMeasureId: string;
}

export interface IMetrcPromoteImmaturePlantsPayload {
  EndingTagId: string;
  GrowthDate: string;
  GrowthPhase: string;
  Id: string;
  NewLocationId: string;
  PlantsCount: string;
  StartingTagId: string;
}

export interface IMetrcCreateItemsPayload {
  AdministrationMethod: string;
  Description: string;
  ItemBrandId: string;
  Name: string;
  NumberOfDoses: string;
  ProductCategoryId: string;
  PublicIngredients: string;
  ServingSize: string;
  StrainId: string;
  SupplyDurationDays: string;
  UnitCbdContent: string;
  UnitCbdContentDose: string;
  UnitCbdContentDoseUoMId: string;
  UnitCbdContentUoMId: string;
  UnitCbdPercent: string;
  UnitOfMeasureId: string;
  UnitThcContent: string;
  UnitThcContentDose: string;
  UnitThcContentDoseUoMId: string;
  UnitThcContentUoMId: string;
  UnitThcPercent: string;
  UnitVolume: string;
  UnitVolumeUoMId: string;
  UnitWeight: string;
  UnitWeightUoMId: string;
}

export interface IMetrcCreateStrainsPayload {
  CbdLevel: string;
  IndicaPercentage: string;
  Name: string;
  SativaPercentage: string;
  TestingStatus: string;
  ThcLevel: string;
}

export interface IItemTemplate {
  Name: string;
  StrainId: string;
  Category: IItemCategory;
  UnitOfMeasureId: number;
  UnitOfMeasureName: string;
  UnitWeight: number;
  UnitWeightUnitOfMeasureId: number;
  UnitWeightUnitOfMeasureName: string;
}

export interface IBackgroundTaskOptions {
  stopIsodate: string;
}

export interface IBackgroundTaskReadout {
  description: string;
}

export interface IBackgroundTaskMetrics {
  batchCount: number;
  runningTotal: number;
}

export interface IClientPackagePickerFilters {
  // true means only show empty packages
  // false means only show non-empty packages
  // undefined means do not apply a filter
  isEmpty?: boolean;
}

export interface IClientItemFilters {
  itemCategory: string[];
  quantityType: string[];
}

export interface IClientLocationFilters {
  locationTypeName?: string;
}

// All numbers here will be positive, so "3" for ingredients means "decreased by 3"
export interface IIntermediateCreatePackageFromPackagesData {
  ingredients: {
    pkg: IPackageData;
    quantity: number;
  }[];
  quantity: number;
}

export interface IIntermediateCreatePackageFromMotherPlantData {
  plant: IPlantData;
  counts: number[];
  plantBatchType: IPlantBatchType;
}

export interface IIntermediateCreatePackageFromMotherPlantBatchData {
  plantBatch: IPlantBatchData;
  counts: number[];
}

export interface IIntermediateCreatePlantBatchFromPackageData {
  pkg: IPackageData;
  count: number;
  quantity: number;
  unitOfMeasureId: number;
}

export interface IIntermediatePromotePlantBatchData {
  plantBatch: IPlantBatchData;
  count: number;
}

export interface IMetrcStatusData {
  datetime?: string;
  first_uuid?: string;
  last_uuid?: string;
  high_error_origins?: string[];
  status?: MetrcStatus;
  status_text?: string;
  localized_origin_text?: string;
  error_rate_level?: Level;
  response_time_level?: Level;
  percent_error: number;
  response_ms_percentiles: {
    25: number;
    50: number;
    75: number;
    90: number;
    99: number;
  };
}

export interface IItemCategory {
  Id: number;
  Name: string;
}

export interface IUnitOfMeasure {
  Id: number;
  Name: string;
}

export interface IWasteReason {
  Id: number;
  Name: string;
}

export interface IAdjustPackageReason {
  Id: number;
  Name: string;
  FacilityTypes: Array<{
    FacilityTypeId: number;
    FacilityTypeName: string;
  }>;
  ForAdministrativeHolds: boolean;
  ForPackageAdjustments: boolean;
  ForPlantWaste: boolean;
  ForRejectedTransfers: boolean;
  ForReturnedSalesDeliveries: boolean;
  ForTransferNotes: boolean;
}

export interface IRemediatePackageMethod {
  Id: number;
  Name: string;
}

export interface IWasteMethod {
  Id: number;
  Name: string;
}

export interface IPlantBatchType {
  Id: number;
  Name: string;
  CanBeCloned: boolean;
  LastModified: string;
}

export interface IPlantBatchGrowthPhase {
  Id: string;
  Display: string;
}

export interface ICompressedMetrcTagRange {
  startTag: string;
  endTag: string;
  maskedData: Object;
  rawData?: Object;
}

export interface ICompressedMetrcTagRanges {
  readonly version: number;
}

export interface IPageMetrcFacilityData {
  link: string;
  name: string;
  licenseName: string;
  licenseNumber: string;
}

// export interface IMetrcFacilityData {
//   Id: number;
//   LicenseNumber: string;
//   FacilityName: string;
//   FacilityTypeName: string;
//   FacilityType: null;
//   PhysicalAddress: {
//     Id: number;
//     LicenseId: number;
//     AddressType: "Physical";
//     Recipient: string;
//     Street1: string;
//     Street2: string;
//     Street3: string;
//     Street4: string;
//     City: string;
//     County: string;
//     State: string;
//     PostalCode: string;
//     Country: string;
//     AssessorParcelNumber: string;
//     IsArchived: boolean;
//   };
//   MainPhoneNumber: string;
//   MobilePhoneNumber: string;
// }

// This may not be correct - based on old data dump
export interface IMetrcDriverData {
  RowNumber?: number;
  DriverName: string;
  DriverOccupationalLicenseNumber: string;
  DriverVehicleLicenseNumber: string;
}

// This may not be correct - based on old data dump
export interface IMetrcVehicleData {
  RowNumber?: number;
  VehicleLicensePlateNumber: string;
  VehicleMake: string;
  VehicleModel: string;
}

export interface IMetrcTransferTypeData {
  Id: number;
  Name: string;
  TransactionType: "Standard" | "Wholesale";
  TransactionTypeName: "Standard" | "Wholesale";
  ForLicensedShipments: boolean;
  ForExternalIncomingShipments: boolean;
  ShipperLicenseNumberFieldEnabled: boolean;
  ShipperLicenseNumberFieldLabel: string;
  ShipperLicenseNameFieldEnabled: boolean;
  ShipperAddressFieldsEnabled: boolean;
  ForExternalOutgoingShipments: boolean;
  RecipientLicenseNumberFieldEnabled: boolean;
  RecipientLicenseNumberFieldLabel: string;
  RecipientLicenseNameFieldEnabled: boolean;
  RecipientAddressFieldsEnabled: boolean;
  TransporterFieldsEnabled: boolean;
  RequiresDestinationGrossWeight: boolean;
  RequiresPackagesGrossWeight: boolean;
  MinimumWholesalePrice: null;
  MaximumWholesalePrice: null;
  FacilityTypes: {
    FacilityTypeId: number;
    FacilityTypeName: "Cannabis - Microbusiness License";
  }[];
}

export type PluginKeyvalCategory =
  | "GENERIC"
  | "FACILITIES"
  | "TRANSFER_TYPES"
  | "TRANSFER_BLOB"
  | "PAGE_DUMP"
  | "MODAL_FIELDS"
  | "FACILITY_METADATA"
  | "REPEATER_DATA_KEYS";

export interface IBuilderComponentError {
  tags: string[];
  message: string;
}

export interface IClientConfig {
  clientName: string;
  values?: {
    [key: string]: string;
  };
  // Deprecated
  overrides?: {
    transferTemplateHtmlUrl?: string;
  };
}

export interface IClientInfo {
  clientName: string;
  licenseKey: string;
}
