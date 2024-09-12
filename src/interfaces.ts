import {
  BackgroundTaskState,
  HarvestState,
  HistoryTreeNodeType,
  Level,
  MessageType,
  MetrcStatus,
  PackageState,
  PlantBatchState,
  PlantState,
  SearchModalView,
  TagState,
  TransferState,
} from "@/consts";
import { Store } from "vuex";
import { IAnnouncementsState } from "./store/page-overlay/modules/announcements/interfaces";
import { IClientState } from "./store/page-overlay/modules/client/interfaces";
import { ICreatePackageCsvState } from "./store/page-overlay/modules/create-package-csv/interfaces";
import { ICsvFillToolState } from "./store/page-overlay/modules/csv-fill-tool/interfaces";
import { IEmployeeSamplesState } from "./store/page-overlay/modules/employee-samples/interfaces";
import { IExplorerState } from "./store/page-overlay/modules/explorer/interfaces";
import { IFlagsState } from "./store/page-overlay/modules/flags/interfaces";
import { IGraphState } from "./store/page-overlay/modules/graph/interfaces";
import { ILabCsvState } from "./store/page-overlay/modules/lab-csv/interfaces";
import { ILabelPrintState } from "./store/page-overlay/modules/label-print/interfaces";
import { IListingState } from "./store/page-overlay/modules/listing/interfaces";
import { IMetrcTableState } from "./store/page-overlay/modules/metrc-table/interfaces";
import { IPackageHistoryState } from "./store/page-overlay/modules/package-history/interfaces";
import { IPackageSearchState } from "./store/page-overlay/modules/package-search/interfaces";
import { IPlantSearchState } from "./store/page-overlay/modules/plant-search/interfaces";
import { IPluginAuthState } from "./store/page-overlay/modules/plugin-auth/interfaces";
import { IPromoteImmaturePlantsBuilderState } from "./store/page-overlay/modules/promote-immature-plants-builder/interfaces";
import { IReportsState } from "./store/page-overlay/modules/reports/interfaces";
import { ISearchState } from "./store/page-overlay/modules/search/interfaces";
import { ISettingsState } from "./store/page-overlay/modules/settings/interfaces";
import { ISplitPackageBuilderState } from "./store/page-overlay/modules/split-package-builder/interfaces";
import { ITagSearchState } from "./store/page-overlay/modules/tag-search/interfaces";
import {
  DriverLayoverLeg,
  ITransferBuilderState,
} from "./store/page-overlay/modules/transfer-builder/interfaces";
import { ITransferPackageSearchState } from "./store/page-overlay/modules/transfer-package-search/interfaces";
import { ITransferSearchState } from "./store/page-overlay/modules/transfer-search/interfaces";
import { ITransferToolsState } from "./store/page-overlay/modules/transfer-tools/interfaces";
import { CsvUpload, CsvUploadStatus } from "./types";
import { UnitOfMeasureAbbreviation, UnitOfMeasureName } from "./utils/units";

export type PlantBatchTypeName = "Clone" | "Seed";
export type PlantGrowthPhase = "Vegetative" | "Flowering";
export type HarvestType = "WholePlant" | "Manicure";

export interface IComputedGetSet<T> {
  get: () => T;
  set: (x: T) => void;
  $store: Store<IPluginState>;
}

export interface IComputedGetSetMismatched<T, U> {
  get: () => T;
  set: (x: U) => void;
  $store: Store<IPluginState>;
}

export interface IAtomicService {
  init: () => Promise<void>;
}

export enum BackgroundState {
  DEFAULT = "DEFAULT",
  COLOR = "COLOR",
  GRADIENT = "GRADIENT",
  IMAGE = "IMAGE",
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
  dismissedCsvBuilderPopover: boolean;
  dismissedBuilderPopover: boolean;
  dismissedToolboxPopover: boolean;
  dismissedReportsPopover: boolean;
  dismissedFacilityPopover: boolean;
  dismissedSearchPopover: boolean;
  dismissedQuickScriptsPopover: boolean;
  dismissedBugReportsPopover: boolean;
  dismissedSnapshotPopover: boolean;
}

export interface IFilter {
  field: string;
  operator: "eq" | "contains" | "endswith" | "gt" | "lt";
  value: string | number;
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
  label?: string | null;
  sourceHarvestName?: string | null;
  sourcePackageLabel?: string | null;
  productionBatchNumber?: string | null;
  sourceProductionBatchNumbers?: string | null;
  itemName?: string | null;
  itemStrainName?: string | null;
  itemProductCategoryName?: string | null;
  locationName?: string | null;
}

export interface IPlantSearchFilters {
  label: string | null;
  strainName: string | null;
  locationName: string | null;
}

export interface ITransferSearchFilters {
  manifestNumber: string | null;
  shipperFacilityInfo: string | null;
  deliveryFacilities: string | null;
}

export interface ITagSearchFilters {
  label: string | null;
}

export interface ITransferPackageList {
  identity: string;
  license: string;
  packages: IUnionIndexedPackageData[];
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
  credentials: string | null;
  builderModalOpen: CsvUpload | null;
  debugMode: boolean;
  demoMode: boolean;
  mockDataMode: boolean;
  errorMessage: string | null;
  flashMessage: string | null;
  flashMessageTimeout: number | null;
  loadingMessage: string | null;
  muteAnalytics: boolean;
  searchModalView: SearchModalView | null;
  trackedInteractions: ITrackedInteractions;
  backgroundTasks: IBackgroundTasksState;
  metrcStatusData: IMetrcStatusData | null;
}

export interface IPluginState extends IRootState {
  // Modules
  pluginAuth: IPluginAuthState;
  announcements: IAnnouncementsState;
  client: IClientState;
  transferBuilder: ITransferBuilderState;
  packageSearch: IPackageSearchState;
  plantSearch: IPlantSearchState;
  transferSearch: ITransferSearchState;
  tagSearch: ITagSearchState;
  splitPackageBuilder: ISplitPackageBuilderState;
  promoteImmaturePlantsBuilder: IPromoteImmaturePlantsBuilderState;
  search: ISearchState;
  settings: ISettingsState;
  listing: IListingState;
  reports: IReportsState;
  flags: IFlagsState;
  packageHistory: IPackageHistoryState;
  explorer: IExplorerState;
  employeeSamples: IEmployeeSamplesState;
  createPackageCsv: ICreatePackageCsvState;
  transferPackageSearch: ITransferPackageSearchState;
  graph: IGraphState;
  labCsv: ILabCsvState;
  transferTools: ITransferToolsState;
  metrcTable: IMetrcTableState;
  labelPrint: ILabelPrintState;
  csvFillTool: ICsvFillToolState;
}

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
  TagType: MetrcTagTypeName;
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

export interface IResponseObjectData {
  Id: number;
}
export interface ITaggedIResponseObjectData extends IResponseObjectData {
  Label: string;
}

export type MetrcTagTypeName =
  | "Medical Package"
  | "Medical Plant"
  | "Cannabis Package"
  | "Cannabis Plant";
export type TagInventoryTypeName =
  | "MedicalPackage"
  | "MedicalPlant"
  | "CannabisPackage"
  | "CannabisPlant";

export interface ITagData extends ITaggedIResponseObjectData {
  Id: number;
  GroupTagTypeName: null;
  TagTypeName: MetrcTagTypeName;
  GroupTagTypeId: null;
  TagTypeId: string; // "TagType-6",
  TagInventoryTypeName: TagInventoryTypeName;
  MaxGroupSize: number;
  FacilityId: number;
  StatusName: "Received" | "Used" | "Voided";
  CommissionedDateTime: string;
  IsUsed: boolean;
  UsedDateTime: string | null;
  DetachedDateTime: string | null;
  IsArchived: boolean;
  LastModified: string;
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
  UnitThcContentUnitOfMeasureId: number | null;
  UnitThcContentDoseUnitOfMeasureAbbreviation: string | null;
  UnitThcContentUnitOfMeasureAbbreviation: string | null;
  UnitThcPercent: number | null;
  UnitVolume: number | null;
  UnitVolumeUnitOfMeasureAbbreviation: string | null;
  UnitWeight: number | null;
  UnitWeightUnitOfMeasureAbbreviation: string | null;
  UnitWeightUnitOfMeasureId: number | null;
  ExpirationDateConfiguration: "Off" | "Optional";
  SellByDateConfiguration: "Off" | "Optional";
  UseByDateConfiguration: "Off" | "Optional";
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
  filter?: IPlantFilter;
}

export interface IFilterOptions {
  operator?: "and" | "or";
  plantFilter?: IPlantFilter;
  tagFilter?: ITagFilter;
  plantBatchFilter?: IPlantBatchFilter;
  packageFilter?: IPackageFilter;
  transferFilter?: ITransferFilter;
  harvestFilter?: IHarvestFilter;
}

export interface ISortOptions {
  salesReceiptSort?: ISalesReceiptSort;
  plantSort?: IPlantSort;
  plantBatchSort?: IPlantBatchSort;
}

export interface IMetrcFilter {
  lastModifiedDateGt?: string | null;
  lastModifiedDateEq?: string | null;
  lastModifiedDateLt?: string | null;
}

export interface IPlantFilter {
  locationName?: string | null;
  strainName?: string | null;
  label?: string | null;
  vegetativeDateGt?: string | null;
  vegetativeDateEq?: string | null;
  vegetativeDateLt?: string | null;
  floweringDateGt?: string | null;
  floweringDateEq?: string | null;
  floweringDateLt?: string | null;
  plantedDateGt?: string | null;
  plantedDateEq?: string | null;
  plantedDateLt?: string | null;
  includeVegetative?: boolean;
  includeFlowering?: boolean;
  includeInactive?: boolean;
}

export interface IPlantBatchOptions extends IDataLoadOptions {
  filter?: IPlantBatchFilter;
}

export interface IPlantBatchFilter {
  name?: string;
  locationName?: string | null;
  strainName?: string | null;
  plantedDateGt?: string | null;
  plantedDateEq?: string | null;
  plantedDateLt?: string | null;
  includeActive?: boolean;
  includeInactive?: boolean;
}

export interface IPackageFilter extends IMetrcFilter {
  label?: string | null;
  itemStrainName?: string | null;
  itemStrainNameExact?: boolean | null;
  itemName?: string | null;
  itemNameExact?: boolean | null;
  locationName?: string | null;
  locationNameExact?: boolean | null;
  isEmpty?: boolean | null;
  quantityLt?: number | null;
  packagedDateGt?: string | null;
  packagedDateEq?: string | null;
  packagedDateLt?: string | null;
  includeActive?: boolean;
  includeIntransit?: boolean;
  includeInactive?: boolean;
  includeTransferHub?: boolean;
}

export interface IHarvestFilter extends IMetrcFilter {
  harvestName?: string | null;
  includeActive?: boolean;
  includeInactive?: boolean;
  harvestDateGt?: string | null;
  harvestDateLt?: string | null;
}

export interface ITransferFilter extends IMetrcFilter {
  manifestNumber?: string | null;
  idMatches?: number[] | null;
  createdDateGt?: string | null;
  createdDateEq?: string | null;
  createdDateLt?: string | null;
  onlyWholesale?: boolean;
  estimatedArrivalDateGt?: string | null;
  estimatedArrivalDateLt?: string | null;
  estimatedDepartureDateGt?: string | null;
  estimatedDepartureDateLt?: string | null;
  includeIncoming?: boolean;
  includeIncomingInactive?: boolean;
  includeOutgoing?: boolean;
  includeRejected?: boolean;
  includeOutgoingInactive?: boolean;
}

export interface ITagFilter extends IMetrcFilter {
  label?: string | null;
  includeAvailable?: boolean;
  includeUsed?: boolean;
  includeVoided?: boolean;
  includePlant?: boolean;
  includePackage?: boolean;
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

export interface IIndexedPlantBatchData extends IPlantBatchData {
  PlantBatchState: PlantBatchState;
  LicenseNumber: string;
  TagMatcher: string;
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
  UnitOfMeasureAbbreviation: UnitOfMeasureAbbreviation;
  UnitOfMeasureId: number;
  UnitOfMeasureQuantityType: "WeightBased" | "CountBased" | "VolumeBased";
  SourceHarvestCount: number;
  SourcePackageCount: number;
  SourceProcessingJobCount: number;
  SourceProcessingJobNumbers: string;
  SourceProcessingJobNames: string;
  MultiProcessingJob: boolean;
  ExpirationDate: null | string;
  SellByDate: null | string;
  UseByDate: null | string;
  LabTestResultDocumentFileId: null | number;
  IsOnTrip: boolean;
  IsOnRetailerDelivery: boolean;
  PackageForProductDestruction: null | boolean;
  Trip: null;
  HasPartial: boolean;
  IsPartial: boolean;
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

export interface IMetrcObjectHistoryData {
  ActualDate: string | null;
  Descriptions: string[];
  ExternalSourceName: string;
  InputSourcesNames: string;
  RecordedDateTime: string;
  UserName: string;
}

export interface ITransferHistoryData extends IMetrcObjectHistoryData {}

export interface IPackageHistoryData extends IMetrcObjectHistoryData {}

export interface IHarvestHistoryData extends IMetrcObjectHistoryData {}

export interface IPackageSourceHarvestData {
  HarvestStartDate: string; // "2022-09-22"
  HarvestTypeName: string; // "Manicure Batch";
  HarvestedByFacilityLicenseNumber: string; // "EX-000002";
  HarvestedByFacilityName: string; // "Example, LLC";
  IsOnHold: false;
  LabTestingStateDate: null;
  LabTestingStateName: "NotSubmitted";
  Name: string; // "Birthday Cake 10.21"
}

export interface IPlantHistoryData {}
export interface IPlantBatchHistoryData {}

export interface ITestResultData {
  ExpirationDateTime: string | null;
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
  ProductCategoryName: string | null;
  ProductName: string | null;
  ResultReleased: boolean;
  ResultReleaseDateTime: string;
  RevokedDate: string | null;
  SourcePackageLabel: string | null;
  TestComment: string;
  TestInformationalOnly: boolean;
  TestPassed: boolean;
  TestPerformedDate: string;
  TestResultLevel: number;
  TestTypeName: string;
}

export interface IIndexedPlantData extends IPlantData {
  PlantState: PlantState;
  LicenseNumber: string;
  TagMatcher: string;
}

export interface IFractionalCostData {
  parentLabel: string;
  totalParentQuantity: number;
  fractionalQuantity: number;
}

export interface IIndexedPackageData extends IPackageData {
  PackageState: PackageState;
  LicenseNumber: string;
  TagMatcher: string;
  history?: IPackageHistoryData[];
  testResults?: ITestResultData[];
  initialQuantity?: number;
  initialQuantityUnitOfMeasure?: string;
  totalInputQuantity?: number;
  totalInputQuantityUnitOfMeasure?: string;
}

export interface IRichIndexedPackageData extends IIndexedPackageData {
  fractionalCostData?: IFractionalCostData[];
  errors?: string[];
}

export interface IRichIndexedDestinationPackageData extends IIndexedDestinationPackageData {
  fractionalCostData?: IFractionalCostData[];
  errors?: string[];
}

export interface IDestinationPackageData {
  ContainsRemediatedProduct: boolean;
  DonationFacilityLicenseNumber: null;
  DonationFacilityName: null;
  GrossUnitOfWeightAbbreviation: string; // "g"
  GrossWeight: number | null;
  IsDonation: boolean;
  IsTestingSample: boolean;
  IsTradeSample: boolean;
  IsTradeSamplePersistent: boolean;
  ItemBrandName: null;
  ItemServingSize: "";
  ItemStrainName: null;
  ItemSupplyDurationDays: null;
  ItemUnitCbdContent: null;
  ItemUnitCbdContentDose: null;
  ItemUnitCbdContentDoseUnitOfMeasureAbbreviation: null;
  ItemUnitCbdContentUnitOfMeasureAbbreviation: null;
  ItemUnitCbdPercent: null;
  ItemUnitQuantity: null;
  ItemUnitQuantityUnitOfMeasureAbbreviation: string | null;
  ItemUnitThcContent: null;
  ItemUnitThcContentDose: null;
  ItemUnitThcContentDoseUnitOfMeasureAbbreviation: null;
  ItemUnitThcContentUnitOfMeasureAbbreviation: null;
  ItemUnitThcPercent: null;
  ItemUnitVolume: null;
  ItemUnitVolumeUnitOfMeasureAbbreviation: null;
  ItemUnitWeight: number | null;
  ItemUnitWeightUnitOfMeasureAbbreviation: string; // "g";
  LabTestingStateName: string; // "TestPassed";
  MultiHarvest: true;
  MultiPackage: boolean;
  PackageId: number;
  PackageLabel: string; // "1A4000000000000000213809";
  PackageType: string; // "Product";
  PackagedDate: null;
  ProductCategoryName: string; // "Infused-Edible";
  ProductName: string; // "Mojo - Chocolate 20mg (Sativa)";
  ProductRequiresRemediation: false;
  ProductionBatchNumber: string | null;
  ReceivedQuantity: number;
  ReceivedUnitOfMeasureAbbreviation: string;
  ReceiverWholesalePrice: null;
  RemediationDate: null;
  ShipmentPackageState: string; // "Accepted";
  ShippedQuantity: number;
  ShippedUnitOfMeasureAbbreviation: string;
  ShipperWholesalePrice: number | null;
  SourceHarvestNames: string;
  SourcePackageIsDonation: false;
  SourcePackageIsTradeSample: false;
  SourcePackageLabels: string;
  TradeSampleFacilityLicenseNumber: null;
  TradeSampleFacilityName: null;
}

export interface IIndexedDestinationPackageData extends IDestinationPackageData {
  PackageState: PackageState;
  LicenseNumber: string;
  TagMatcher: string;
  history?: IPackageHistoryData[];
  testResults?: ITestResultData[];
  fractionalCostData?: IFractionalCostData[];
}

export type IUnionPackageData = IPackageData | IDestinationPackageData;
export type IUnionIndexedPackageData = IIndexedPackageData | IIndexedDestinationPackageData;
export type IUnionRichIndexedPackageData =
  | IRichIndexedPackageData
  | IRichIndexedDestinationPackageData;

export interface ISimplePackageData {
  LicenseNumber: string;
  Id: number;
  PackageState: PackageState;
  Label: string;
  ItemName: string;
  SourcePackageLabels: string;
  ProductionBatchNumber: string | null;
  parentPackageLabels: string[] | null;
  childPackageLabelQuantityPairs: [string, number][] | null;
}

export interface ISimpleOutgoingTransferData {
  LicenseNumber: string;
  ManifestNumber: string;
  Id: number;
  TransferState: TransferState;
  Destinations: {
    Id: number;
    Type: string;
    ETD: string;
  }[];
}

export interface ISimpleTransferPackageData extends ISimplePackageData {
  ETD: string;
  Type: string;
  ManifestNumber: string;
  UnitOfMeasureAbbreviation: string;
  Quantity: number | null;
}

export interface ISimpleCogsPackageData extends ISimplePackageData {
  manifest: boolean;
  manifestGraph: boolean;
  childLabels: string[];
  fractionalCostData: IFractionalCostData[];
  errors: string[];
}

export interface IMetadataSimplePackageData extends ISimpleTransferPackageData {
  fractionalCostMultiplierPairs: [string, number][] | undefined;
}

// This is a shared type between incoming and outgoing
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

export interface IOutgoingTransferData extends IIndexedTransferData {
  DeliveryId: 0;
  DeliveryPackageCount: 0;
  DeliveryReceivedPackageCount: 0;
}

export interface IIncomingTransferData extends IIndexedTransferData {}

export interface IRichIncomingTransferData extends IIncomingTransferData {
  packages?: IIndexedDestinationPackageData[];
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
  LicenseNumber: string;
  TagMatcher: string;
  history?: IHarvestHistoryData[];
}

export interface IIndexedTransferData extends ITransferData {
  TransferState: TransferState;
  LicenseNumber: string;
  TagMatcher: string;
  history?: ITransferHistoryData[];
}

export interface ITransporterData {
  AcceptedDateTime: null;
  ActualArrivalDateTime: null;
  ActualDepartureDateTime: null;
  DriverLayoverLeg: null;
  DriverName: string;
  DriverOccupationalLicenseNumber: string;
  DriverVehicleLicenseNumber: string;
  EstimatedArrivalDateTime: string | null;
  EstimatedDepartureDateTime: string | null;
  IsLayover: boolean;
  TransporterDirectionName: "Outbound";
  TransporterFacilityLicenseNumber: string;
  TransporterFacilityName: string;
  VehicleLicensePlateNumber: string;
  VehicleMake: string;
  VehicleModel: string;
}

export interface IDestinationData {
  ActualArrivalDateTime: null;
  ActualDepartureDateTime: null;
  ActualReturnArrivalDateTime: null;
  ActualReturnDepartureDateTime: null;
  DeliveryPackageCount: number;
  DeliveryReceivedPackageCount: number;
  EstimatedArrivalDateTime: string;
  EstimatedDepartureDateTime: string;
  EstimatedReturnArrivalDateTime: null;
  EstimatedReturnDepartureDateTime: null;
  GrossUnitOfWeightAbbreviation: string | null;
  GrossUnitOfWeightId: number | null;
  GrossWeight: number | null;
  Id: number;
  PlannedRoute: string;
  ReceivedByName: null;
  ReceivedDateTime: null;
  RecipientFacilityId: number;
  RecipientFacilityLicenseNumber: string;
  RecipientFacilityName: string;
  RejectedPackagesReturned: boolean;
  ShipmentTransactionTypeName: string;
  ShipmentTypeName: "Transfer";
}

export interface ITransferTransporterDetails {
  ShipmentPlanId: number;
  ShipmentDeliveryId: number;
  TransporterDirection: "Outbound";
  TransporterFacilityId: number;
  LineNumber: number;
  DriverName: string;
  DriverOccupationalLicenseNumber: string;
  DriverVehicleLicenseNumber: string;
  DriverLayoverLeg: DriverLayoverLeg | null;
  VehicleMake: string;
  VehicleModel: string;
  VehicleLicensePlateNumber: string;
  ActualDriverStartDateTime: null;
}

export interface IRichDestinationData extends IDestinationData {
  transporters?: ITransporterData[];
  packages?: IIndexedDestinationPackageData[];
}

/**
 * The transfer format is gnarly. There are a lot of field overlaps
 * between incoming/outgoing transfer, destination, and transporter
 *
 * Incoming transfers:
 *   Single transporter
 *   Multiple packages per transporter
 *
 * Outgoing transfers:
 *   Multiple destinations
 *   Multiple packages per destination
 *
 * This wrap them up into
 */
export interface IIndexedRichOutgoingTransferData extends IIndexedTransferData {
  outgoingDestinations?: IRichDestinationData[];
}

export interface IIndexedRichIncomingTransferData extends IIndexedTransferData {
  incomingTransporters?: ITransporterData[];
  incomingPackages?: IIndexedDestinationPackageData[];
}

export interface IIndexedTagData extends ITagData {
  LicenseNumber: string;
  TagState: TagState;
  TagMatcher: string;
}

export interface IMetrcAddPackageNoteData {
  Id: number;
  Note: string;
}

export interface IReorderTagsPayload {
  Details: Array<{
    TagType: MetrcTagTypeName;
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
  // apiKey: string;
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

export interface IXlsxFile {
  filename: string;
  sheets: {
    sheetName: string;
    options?: {
      table: boolean;
    };
    data: any[][];
  }[];
}

export interface ITextFile {
  filename: string;
  data: string;
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
  HarvestStartDate: string;
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

export interface IMetrcCreateTransferPayload {
  Destinations: IMetrcTransferDestinationData[];
  ShipmentLicenseType: string;
}

export interface IMetrcUpdateTransferPayload extends IMetrcCreateTransferPayload {
  Id: number;
}

export interface IMetrcAssignCoaPayload {
  LabTestResultDocumentId: string;
  Id: string;
}

export interface IMetrcTransferDestinationData {
  ShipmentLicenseType: string;
  RecipientId: string;
  PlannedRoute: string;
  TransferTypeId: string;
  Packages: IMetrcTransferPackageData[];
  // These are thre transfer ETA/ETD
  EstimatedDepartureDateTime: string;
  EstimatedArrivalDateTime: string;
  // These fields are provided in MI for wholesale transfers
  GrossWeight: string;
  GrossUnitOfWeightId: string;
  // Some types such as State Authorized do not submit a Transporter
  Transporters?: IMetrcTransferTransporterData[];
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
  TransporterDetails: IMetrcTransferTransporterDetailsData[];
  // These are the layover ETA/ETD
  IsLayover?: string; // "true";
  EstimatedArrivalDateTime?: string;
  EstimatedDepartureDateTime?: string;
}

export interface IMetrcTransferTransporterDetailsData {
  DriverName: string;
  DriverOccupationalLicenseNumber: string;
  DriverLicenseNumber: string;
  VehicleMake: string;
  VehicleModel: string;
  VehicleLicensePlateNumber: string;
  DriverLayoverLeg: DriverLayoverLeg;
}

export interface IMetrcMovePlantsPayload {
  ActualDate: string;
  LocationId: string;
  Id: string;
}

export interface IMetrcChangePlantsGrowthPhasePayload {
  GrowthDate: string;
  GrowthPhase: string;
  Id: string;
  NewLocationId: string;
  NewTagId: string;
}

export interface IMetrcMovePlantBatchesPayload {
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
  ExpirationDate: string;
  UseByDate: "";
  SellByDate: "";
}

export interface IMetrcFinishPackagesPayload {
  ActualDate: string;
  Id: string;
}

export interface IMetrcAdjustPackagePayload {
  AdjustmentDate: string; // ISODATE
  AdjustmentQuantity: string;
  AdjustmentReasonId: string;
  AdjustmentUnitOfMeasureId: string;
  CurrentQuantity: string; // "5.4"
  CurrentQuantityUom: UnitOfMeasureName;
  FinishDate: string; // ISODATE or ""
  Id: string; // "123"
  NewQuantity: string; // 6.4
  NewQuantityUom: UnitOfMeasureName;
  ReasonNote: string;
}

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

export interface IMetrcDestroyPlantBatchesPayload {
  ActualDate: string;
  Id: string;
  CountToDestroy: string;
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

export interface IItemCategoryFacilityType {
  ProductCategoryId: number;
  FacilityTypeId: number;
  CanCreateFromProductionBatch: boolean;
  CanCreateFromHarvestBatch: boolean;
}

export interface IItemCategory {
  Id: number;
  Name: string;
  ProductCategoryType: string;
  ProductCategoryTypeName: string;
  QuantityType: string;
  QuantityTypeName: string;
  DefaultLabTestingStateName: string;
  PatientPurchaseAmountMultiplier: number;
  RequiresApproval: boolean;
  RequiresStrain: boolean;
  RequiresItemBrand: boolean;
  RequiresAdministrationMethod: boolean;
  RequiresUnitCbdPercent: boolean;
  RequiresUnitCbdContent: boolean;
  RequiresUnitCbdContentDose: boolean;
  RequiresUnitThcPercent: boolean;
  RequiresUnitThcContent: boolean;
  RequiresUnitThcContentDose: boolean;
  RequiresUnitVolume: boolean;
  RequiresUnitWeight: boolean;
  RequiresServingSize: boolean;
  RequiresSupplyDurationDays: boolean;
  RequiresNumberOfDoses: boolean;
  CalculateUnitQuantity: boolean;
  UnitQuantityMultiplier: number | null;
  UnitQuantityUnitOfMeasureAbbreviation: string | null;
  RequiresPublicIngredients: boolean;
  RequiresDescription: boolean;
  RequiresAllergens: boolean;
  RequiresProductPhotos: number;
  RequiresProductPhotoDescription: boolean;
  RequiresLabelPhotos: number;
  RequiresLabelPhotoDescription: boolean;
  RequiresPackagingPhotos: number;
  RequiresPackagingPhotoDescription: boolean;
  CanContainSeeds: boolean;
  CanBeRemediated: boolean;
  CanBeDestroyed: boolean;
  UseItemWeightAsPatientFlowerPurchased: boolean;
  UseItemWeightAsPatientConcentratePurchased: boolean;
  UseItemWeightAsPatientInfusedPurchased: boolean;
  ExpirationDateConfiguration: string;
  SellByDateConfiguration: string;
  UseByDateConfiguration: string;
  ExpirationDateDaysInAdvance: number | null;
  SellByDateDaysInAdvance: number | null;
  UseByDateDaysInAdvance: number | null;
  FacilityTypes: IItemCategoryFacilityType[];
  RequiresProductPDFDocuments: number;
}

export interface IUnitOfMeasure {
  Abbreviation: UnitOfMeasureAbbreviation;
  // (weight in oz) * FromBaseFactor = (weight in g)
  FromBaseFactor: number; // g is 28.349523125
  Id: number;
  IsArchived: boolean;
  IsBaseUnit: boolean;
  Name: UnitOfMeasureName;
  QuantityType: "WeightBased" | "VolumeBased" | "CountBased";
  // (weight in oz) * ToBaseFactor = (weight in g)
  ToBaseFactor: number; // g is 0.035273961949580414
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

export interface IDestroyPlantBatchActionReason {
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

export interface IMetrcDriverData {
  Id: number;
  FacilityId: number;
  EmployeeId: string;
  Name: string;
  DriversLicenseNumber: string;
  IsArchived: boolean;
  LastModified: string;
}

export interface IMetrcVehicleData {
  Id: number;
  FacilityId: number;
  Make: string;
  Model: string;
  LicensePlateNumber: string;
  IsArchived: boolean;
  LastModified: string;
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
  // overrides?: {
  //   transferTemplateHtmlUrl?: string;
  // };
}

export interface IClientInfo {
  clientName: string;
  licenseKey: string;
}

export interface IStrippedIndexedPackage {
  PackageState: PackageState;
  Label: string;
  LicenseNumber: string;
  ProductionBatchNumber: string;
  Quantity: number;
  ItemName: string;
  PackagedByFacilityLicenseNumber: string;
  ReceivedFromFacilityLicenseNumber: string;
  UnitOfMeasureAbbreviation: string;
  SourcePackageLabels: string;
}

export interface IHistoryTreeNode {
  type: HistoryTreeNodeType;
  relationship: "PARENT" | "CHILD";
  label: string;
  pkg: IStrippedIndexedPackage;
}

export interface IPackageAncestorTreeNode extends IHistoryTreeNode {
  ancestors: IPackageAncestorTreeNode[];
}

export interface IPackageChildTreeNode extends IHistoryTreeNode {
  children: IPackageChildTreeNode[];
}

export interface IGoogleOAuthOAuthUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string; // Full Name
  given_name: string; // First Name
  family_name: string; // Last Name
  picture: string; // "https://lh3.googleusercontent.com/a/..."
  locale: string; // "en"
}

export interface ISimpleSpreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
  };
  sheets: ISimpleSheet[];
}

export interface ISimpleSheet {
  properties: {
    sheetId: number;
    title: string;
    index: number;
  };
}

export interface ISpreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
  };
  sheets: ISheet[];
}

export interface ISheet {
  properties: {
    sheetId: number; // 0
    title: string; // Sheet1
    index: number; // 0
    sheetType: string; // GRID
    gridProperties: {
      rowCount: number; // 1000
      columnCount: number; // 26
      frozenRowCount: number; // 1
    };
    tabColor: {
      red: number; // 1.0
      green: number; // 0.3
      blue: number; // 0.4
    };
  };
}

export type ISheetValues = any[][];

export interface IValueRange {
  range: string;
  majorDimension: "ROWS";
  values: ISheetValues;
}

export interface IMetrcEmployeeData {
  Id: number;
  GivenNames: string; // Matt
  FamilyName: string; // Frisbie
  FullName: string; // Matt Frisbie
  License: {
    Number: string; // "12345"
    Status: "Active";
    StartDate: null;
    EndDate: null;
    MainPhoneNumber: string; // "1231231234"
    MobilePhoneNumber: "";
    LicenseType: "Unlicensed";
  };
  SelectedFacilityEmployee: {
    FacilityId: number;
    HireDate: string; // "2023-01-01";
    TerminationDate: null;
    CanLogIn: boolean;
    HomePage: "Packages";
    IsBlocked: boolean;
    IsIndustryAdmin: boolean;
    IsOwner: boolean;
    IsManager: boolean;
    Name: null;
    Alias: null;
    DisplayName: null;
    FacilityType: null;
    License: null;
  };
  UserId: number;
  User: {
    Id: number; // same as UserId
    Username: string; // "12345"
    UserType: "Industry";
    Name: string; // Matt Frisbie
    Email: string;
    UseSingleSignOn: boolean;
    HomePage: "";
    UserRoleId: null;
    UserRoleName: null;
    DatabaseQueryRoleName: null;
    LastLogIn: string;
    LockedUntil: null;
    RequiresMultiFactorAuthentication: boolean;
    MultiFactorAuthenticationEnabled: boolean;
    AcceptedLicenseDateTime: string;
    StoreGridConfigRemotely: boolean;
  };
}

export interface PackageMetadata {
  testResults: ITestResultData[];
  testResultPdfUrls: string[];
}

export interface ITransferMetadata {
  destinations: IRichDestinationData[];
  packages: IIndexedDestinationPackageData[];
  packagesTestResults: {
    pkg: IIndexedDestinationPackageData;
    testResults: ITestResultData[];
    testResultPdfUrls: string[];
  }[];
}

export interface ILicenseFormFilters {
  licenses: string[];
  licenseOptions: string[];
}

export interface IBuilderListOption {
  route: string;
  text: string;
  icon: string;
  backgroundColor: string;
  isBeta: boolean;
  isNew: boolean;
  enabled: boolean;
  visible: boolean;
  isPlus: boolean;
  showDisabledMessage: boolean;
}
