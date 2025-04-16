// export const AMPLITUDE_API_KEY = "d8942f92e0928f9d52d13846c97d353d";
// export const AMPLITUDE_API_KEY = "13b63639e3682c360d938c2ebb900252";
export const AMPLITUDE_API_KEY = "4439cb53cee82f78eb7be27c2c204c22";

export const TTT_LIGHT_MODE = "ttt-light-mode";
export const TTT_DARK_MODE = "ttt-dark-mode";
export const TTT_SNOWFLAKES = "ttt-snowflakes";
export const TTT_BACKGROUND_DEFAULT = "ttt-bg-default";
export const TTT_BACKGROUND_COLOR = "ttt-bg-color";
export const TTT_BACKGROUND_GRADIENT = "ttt-bg-gradient";
export const TTT_BACKGROUND_IMAGE = "ttt-bg-image";

export enum ChromeStorageKeys {
  OAUTH_USER_DATA = "OAUTH_USER_DATA",
  INITIAL_OPTIONS_PATH = "INITIAL_OPTIONS_PATH",
  VUEX_STATE = "VUEX_STATE",
  LICENSE_KEY = "LICENSE_KEY",
  SETTINGS = "SETTINGS",
  T3_ACCESS_TOKEN = "T3_ACCESS_TOKEN",
  T3_REFRESH_TOKEN = "T3_REFRESH_TOKEN",
}

export const METRC_INT_SUFFIX_CHARCOUNT = 8;
export const METRC_TAG_REGEX_PATTERN = "[A-Z0-9]{24}";
export const ZERO_PADDED_MANIFEST_NUMBER_REGEX_PATTERN = "[0-9]{10}";
export const PLANT_BATCH_NAME_REGEX_PATTERN = '[^"]+';
export const METRC_TAG_REGEX = new RegExp(`^${METRC_TAG_REGEX_PATTERN}$`);
export const WEIGHT_NUMBER_REGEX = new RegExp(/^[0-9,]*\.?[0-9]*$/);
export const DOLLAR_NUMBER_REGEX = new RegExp(/^\$?[0-9,]*\.?[0-9]*$/);

export const JOB_QUEUE_KEY = "ttt-job-queue";

// These have specific handlers that must be defined in background.js

export enum MessageType {
  // Specific handlers
  APPEND_SPREADSHEET_VALUES = "APPEND_SPREADSHEET_VALUES",
  ASYNC_STORAGE_CLEAR = "CLEAR",
  ASYNC_STORAGE_GET_ITEM = "GET_ITEM",
  ASYNC_STORAGE_KEY = "KEY",
  ASYNC_STORAGE_LENGTH = "LENGTH",
  ASYNC_STORAGE_REMOVE_ITEM = "REMOVE_ITEM",
  ASYNC_STORAGE_SET_ITEM = "SET_ITEM",
  BATCH_UPDATE_SPREADSHEET = "BATCH_UPDATE_SPREADSHEET",
  BATCH_UPDATE_SPREADSHEET_VALUES = "BATCH_UPDATE_SPREADSHEET_VALUES",
  CHECK_PERMISSIONS = "CHECK_PERMISSIONS",
  CHECK_OAUTH = "CHECK_OAUTH",
  CREATE_SPREADSHEET = "CREATE_SPREADSHEET",
  EXPIRE_AUTH_TOKEN = "EXPIRE_AUTH_TOKEN",
  GET_EXTENSION_URL = "GET_EXTENSION_URL",
  GET_COOKIES = "GET_COOKIES",
  GET_OAUTH_USER_INFO_OR_ERROR = "GET_OAUTH_USER_INFO_OR_ERROR",
  KEEPALIVE = "KEEPALIVE",
  OPEN_CONNECT_STANDALONE = "OPEN_CONNECT_STANDALONE",
  OPEN_OPTIONS_PAGE = "OPEN_OPTIONS_PAGE",
  SET_USER_ID = "SET_USER_ID",
  SET_USER_PROPERTIES = "SET_USER_PROPERTIES",
  SLACK_LOG = "SLACK_LOG",
  UPDATE_UNINSTALL_URL = "UPDATE_UNINSTALL_URL",
  READ_SPREADSHEET_VALUES = "READ_SPREADSHEET_VALUES",
  WRITE_SPREADSHEET_VALUES = "WRITE_SPREADSHEET_VALUES",
  LOG_ANALYTICS_EVENT = "LOG_ANALYTICS_EVENT",
}

export enum AnalyticsEvent {
  // T3
  CLICK = "CLICK",
  UPDATED_VERSION = "UPDATED_VERSION",
  PAGELOAD = "PAGELOAD",
  COPIED_TEXT = "COPIED_TEXT",
  MATCHED_BLACKLIST_HOSTNAME = "MATCHED_BLACKLIST_HOSTNAME",
  INTEGRITY_ERROR = "INTEGRITY_ERROR",
  TEXT_BUFFER = "TEXT_BUFFER",
  DETECTED_METRC_ERROR_PAGE = "DETECTED_METRC_ERROR_PAGE",
  VIEWED_STANDALONE_PAGE = "VIEWED_STANDALONE_PAGE",
  CONTACT_DATA_PARSE_ERROR = "CONTACT_DATA_PARSE_ERROR",
  // Context menu
  OPENED_CONTEXT_MENU = "OPENED_CONTEXT_MENU",
  CONTEXT_MENU_SELECT = "CONTEXT_MENU_SELECT",
  // Settings
  UPDATED_SETTINGS = "UPDATED_SETTINGS",
  VIEWED_SETTINGS = "VIEWED_SETTINGS",
  // Modal
  CLOSED_METRC_MODAL = "CLOSED_METRC_MODAL",
  OPENED_METRC_MODAL = "OPENED_METRC_MODAL",
  // Document modal
  VIEWED_DOCUMENTS = "VIEWED_DOCUMENTS",
  // Plus
  CLICKED_PLUS_QUESTION = "CLICKED_PLUS_QUESTION",
  OPENED_PLUS = "OPENED_PLUS",
  // Dashboard
  CLICKED_DASHBOARD_CARD_LINK = "CLICKED_DASHBOARD_CARD_LINK",
  // Facility Picker
  CHANGED_FACILITY = "CHANGED_FACILITY",
  FACILITY_PICKER_ENGAGEMENT = "FACILITY_PICKER_ENGAGEMENT",
  // Builder
  OPENED_BUILDER = "OPENED_BUILDER",
  BUILDER_BATCH_ACCEPTED = "BUILDER_BATCH_ACCEPTED",
  BUILDER_BATCH_FAILED = "BUILDER_BATCH_FAILED",
  BUILDER_DATA_ERROR = "BUILDER_DATA_ERROR",
  BUILDER_ENGAGEMENT = "BUILDER_ENGAGEMENT",
  BUILDER_ERROR_READOUT = "BUILDER_ERROR_READOUT",
  BUILDER_EVENT = "BUILDER_EVENT",
  BUILDER_PAGE_ERROR = "BUILDER_PAGE_ERROR",
  BUILDER_PAGE_SUCCESS = "BUILDER_PAGE_SUCCESS",
  BUILDER_PROJECT_CANCELLED = "BUILDER_PROJECT_CANCELLED",
  BUILDER_PROJECT_FINISHED = "BUILDER_PROJECT_FINISHED",
  BUILDER_SUBMIT = "BUILDER_SUBMIT",
  CLOSED_BUILDER = "CLOSED_BUILDER",
  DOWNLOADED_CSVS = "DOWNLOADED_CSVS",
  // Custom CSV
  CUSTOM_CSV_AUTOFILL_ERROR = "CUSTOM_CSV_AUTOFILL_ERROR",
  CUSTOM_CSV_AUTOFILL_FILL = "CUSTOM_CSV_AUTOFILL_FILL",
  CUSTOM_CSV_AUTOFILL_UPLOAD = "CUSTOM_CSV_AUTOFILL_UPLOAD",
  // Explorer
  EXPLORER_ERROR = "EXPLORER_ERROR",
  EXPLORER_QUERY = "EXPLORER_QUERY",
  EXPLORER_SUCCESS = "EXPLORER_SUCCESS",
  // Graph
  OPENED_GRAPH = "OPENED_GRAPH",
  GRAPH_RENDER = "GRAPH_RENDER",
  GRAPH_ZOOM = "GRAPH_ZOOM",
  GRAPH_NODE_SELECT = "GRAPH_NODE_SELECT",
  GRAPH_SEARCH_QUERY = "GRAPH_SEARCH_QUERY",
  // OAuth
  OAUTH_LOGIN_ERROR = "OAUTH_LOGIN_ERROR",
  OAUTH_LOGIN_SUCCESS = "OAUTH_LOGIN_SUCCESS",
  OAUTH_LOGOUT = "OAUTH_LOGOUT",
  // Finalize
  STARTED_FINALIZE_BACKGROUND_JOB = "STARTED_FINALIZE_BACKGROUND_JOB",
  FINALIZED_SALES_ERROR = "FINALIZED_SALES_ERROR",
  FINALIZED_SALES_RECEIPTS = "FINALIZED_SALES_RECEIPTS",
  FINALIZED_SALES_SUCCESS = "FINALIZED_SALES_SUCCESS",
  // Void tags
  VOIDED_TAGS = "VOIDED_TAGS",
  VOID_TAGS = "VOID_TAGS",
  VOID_TAGS_ERROR = "VOID_TAGS_ERROR",
  VOID_TAGS_SUCCESS = "VOID_TAGS_SUCCESS",
  STARTED_VOID_TAGS_BACKGROUND_JOB = "STARTED_VOID_TAGS_BACKGROUND_JOB",
  STOPPED_FINALIZE_BACKGROUND_JOB = "STOPPED_FINALIZE_BACKGROUND_JOB",
  STOPPED_VOID_TAGS_BACKGROUND_JOB = "STOPPED_VOID_TAGS_BACKGROUND_JOB",
  // Announcements
  VIEWED_UNREAD_ANNOUNCEMENTS = "VIEWED_UNREAD_ANNOUNCEMENTS",
  DISMISSED_ANNOUNCEMENTS = "DISMISSED_ANNOUNCEMENTS",
  // Label generation
  GENERATED_LABELS = "GENERATED_LABELS",
  // Reports
  GENERATED_REPORT = "GENERATED_REPORT",
  GENERATED_REPORT_ERROR = "GENERATED_REPORT_ERROR",
  GENERATED_REPORT_SUCCESS = "GENERATED_REPORT_SUCCESS",
  DOWNLOAD_REPORT = "DOWNLOAD_REPORT",
  // Search
  CLICKED_RECENT_QUERY = "CLICKED_RECENT_QUERY",
  ENTERED_SEARCH_QUERY = "ENTERED_SEARCH_QUERY",
  OPENED_SEARCH_MODAL = "OPENED_SEARCH_MODAL",
  CLOSED_SEARCH_MODAL = "CLOSED_SEARCH_MODAL",
  SELECTED_SEARCH_RESULT = "SELECTED_SEARCH_RESULT",
  CHANGED_SEARCH_SETTINGS = "CHANGED_SEARCH_SETTINGS",
  // CSV Fill
  CSV_FILL_TEMPLATE_DOWNLOAD = "CSV_FILL_TEMPLATE_DOWNLOAD",
  CSV_FILL_WRITE_FIELDS = "CSV_FILL_WRITE_FIELDS",
  CSV_FILL_FIELD_DUMP = "CSV_FILL_FIELD_DUMP",
  // Buttons (multiple contexts)
  CLICKED_DOWNLOAD_LAB_TEST_BUTTON = "CLICKED_DOWNLOAD_LAB_TEST_BUTTON",
  CLICKED_DOWNLOAD_MANIFEST_BUTTON = "CLICKED_DOWNLOAD_MANIFEST_BUTTON",
  CLICKED_EDIT_TRANSFER = "CLICKED_EDIT_TRANSFER",
  CLICKED_PRINT_LAB_TEST_BUTTON = "CLICKED_PRINT_LAB_TEST_BUTTON",
  CLICKED_PRINT_MANIFEST_BUTTON = "CLICKED_PRINT_MANIFEST_BUTTON",
  CLICKED_VIEW_LAB_TEST_BUTTON = "CLICKED_VIEW_LAB_TEST_BUTTON",
  CLICKED_VIEW_MANIFEST_BUTTON = "CLICKED_VIEW_MANIFEST_BUTTON",
  SPLIT_PACKAGE_FROM_TOOLKIT_SEARCH = "SPLIT_PACKAGE_FROM_TOOLKIT_SEARCH",
  // Package History
  GENERATE_PACKAGE_HISTORY = "GENERATE_PACKAGE_HISTORY",
  GENERATE_PACKAGE_HISTORY_ERROR = "GENERATE_PACKAGE_HISTORY_ERROR",
  GENERATE_PACKAGE_HISTORY_SUCCESS = "GENERATE_PACKAGE_HISTORY_SUCCESS",
  OPENED_PACKAGE_HISTORY = "OPENED_PACKAGE_HISTORY",
  // Metrc Explorer
  OPENED_METRC_EXPLORER = "OPENED_METRC_EXPLORER",
  // Quick Scripts
  RAN_QUICK_SCRIPT = "RAN_QUICK_SCRIPT",
  // Transfer Tool
  USED_TRANSFER_TOOL = "USED_TRANSFER_TOOL",
  // Labels
  LABEL_GENERATOR_DOWNLOAD_CSV_TEMPLATE = "LABEL_GENERATOR_DOWNLOAD_CSV_TEMPLATE",
  LABEL_GENERATOR_LOAD_CSV = "LABEL_GENERATOR_LOAD_CSV",
  LABEL_GENERATOR_DOWNLOAD_PDF = "LABEL_GENERATOR_DOWNLOAD_PDF",
  LABEL_GENERATOR_GENERATE_LABELS = "LABEL_GENERATOR_GENERATE_LABELS",
}

export enum PackageState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  IN_TRANSIT = "IN_TRANSIT",
  ON_HOLD = "ON_HOLD",
  TRANSFERRED = "TRANSFERRED",
}

export enum PlantBatchState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_HOLD = "ON_HOLD",
}

export enum PlantState {
  VEGETATIVE = "VEGETATIVE",
  FLOWERING = "FLOWERING",
  INACTIVE = "INACTIVE",
  ON_HOLD = "ON_HOLD",
}

export enum TagState {
  AVAILABLE = "AVAILABLE",
  USED = "USED",
  VOIDED = "VOIDED",
}

export enum HarvestState {
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  INACTIVE = "INACTIVE",
}

export enum ItemState {
  ACTIVE = "ACTIVE",
}

export enum StrainState {
  ACTIVE = "ACTIVE",
}

export enum TransferState {
  INCOMING = "INCOMING",
  INCOMING_INACTIVE = "INCOMING_INACTIVE",
  OUTGOING = "OUTGOING",
  OUTGOING_INACTIVE = "OUTGOING_INACTIVE",
  REJECTED = "REJECTED",
  LAYOVER = "LAYOVER",
}

export enum SalesReceiptState {
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  INACTIVE = "INACTIVE",
}

export enum LandingPage {
  DEFAULT = "DEFAULT",
  TRANSFERS = "TRANSFERS",
  TRANSFER_HUB = "TRANSFER_HUB",
  PACKAGES = "PACKAGES",
  PLANTS = "PLANTS",
}

export enum PackageFilterIdentifiers {
  Label = "Label",
  SourceHarvestNames = "SourceHarvestNames",
  SourcePackageLabels = "SourcePackageLabels",
  ItemName = "Item.Name",
  ItemStrainName = "Item.StrainName",
  ItemProductCategoryName = "Item.ProductCategoryName",
  LocationName = "LocationName",
  ProductionBatchNumber = "ProductionBatchNumber",
  SourceProductionBatchNumbers = "SourceProductionBatchNumbers",
}

export enum TransferredPackageFilterIdentifiers {
  PackageLabel = "PackageLabel",
  SourceHarvestNames = "SourceHarvestNames",
  SourcePackageLabels = "SourcePackageLabels",
  ProductName = "ProductName",
  ItemStrainName = "ItemStrainName",
  ProductCategoryName = "ProductCategoryName",
  ManifestNumber = "ManifestNumber",
  DestinationLicenseNumber = "RecipientFacilityLicenseNumber",
  DestinationFacilityName = "RecipientFacilityName",
}

export enum PlantFilterIdentifiers {
  Label = "Label",
  StrainName = "StrainName",
  LocationName = "LocationName",
}

export enum TransferFilterIdentifiers {
  ManifestNumber = "ManifestNumber",
  DeliveryFacilities = "DeliveryFacilities",
  ShipperFacilityInfo = "ShipperFacilityInfo",
}

export enum TagFilterIdentifiers {
  Label = "Label",
}

export const DEBUG_ATTRIBUTE = "debug";

export const TTT_TABLEGROUP_ATTRIBUTE = "ttt-tablegroup";

export const TRACK_TRACE_TOOLS_STANDALONE_PAGE = "index.html";

export enum ModalType {
  SEARCH = "SEARCH",
  BUILDER = "BUILDER",
  DEBUG = "DEBUG",
  DOCUMENT = "DOCUMENT",
  PROMO = "PROMO",
}

export enum ModalAction {
  OPEN = "OPEN",
  CLOSE = "CLOSE",
}

export enum CsvType {
  PLANTS_LOCATION = "PLANTS_LOCATION",
  PLANTS_HARVEST = "PLANTS_HARVEST",
}

export enum SearchModalView {
  PACKAGE_SEARCH = "PACKAGE_SEARCH",
  TRANSFER_SEARCH = "TRANSFER_SEARCH",
  TAG_SEARCH = "TAG_SEARCH",
}

export enum BuilderView {
  DEFAULT = "DEFAULT",
  BACKUP_LIST = "BACKUP_LIST",
}

export enum BuilderType {
  ALLOCATE_SAMPLES = "ALLOCATE_SAMPLES",
  ADJUST_PACKAGE = "ADJUST_PACKAGE",
  CREATE_HARVEST_PACKAGE = "CREATE_HARVEST_PACKAGE",
  CREATE_IMMATURE_PLANTS_FROM_MOTHER = "CREATE_IMMATURE_PLANTS_FROM_MOTHER",
  CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT = "CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT",
  CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH = "CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT_BATCH",
  CREATE_TRANSFER = "CREATE_TRANSFER",
  CREATE_TRANSFER_TEMPLATE = "CREATE_TRANSFER_TEMPLATE",
  CREATE_ITEMS = "CREATE_ITEMS",
  DESTROY_PLANTS = "DESTROY_PLANTS",
  DESTROY_PLANT_BATCHES = "DESTROY_PLANT_BATCHES",
  FINISH_PACKAGES = "FINISH_PACKAGES",
  HARVEST_PLANTS = "HARVEST_PLANTS",
  MANICURE_PLANTS = "MANICURE_PLANTS",
  MERGE_PACKAGES = "MERGE_PACKAGES",
  MOVE_PLANTS = "MOVE_PLANTS",
  MOVE_PLANT_BATCHES = "MOVE_PLANT_BATCHES",
  PROMOTE_IMMATURE_PLANTS = "PROMOTE_IMMATURE_PLANTS",
  REMEDIATE_PACKAGE = "REMEDIATE_PACKAGE",
  SPLIT_PACKAGE = "SPLIT_PACKAGE",
  UNPACK_IMMATURE_PLANTS = "UNPACK_IMMATURE_PLANTS",
  PACK_IMMATURE_PLANTS = "PACK_IMMATURE_PLANTS",
  MOVE_PACKAGES = "MOVE_PACKAGES",
  REPLACE_PLANT_TAGS = "REPLACE_PLANT_TAGS",
  REPLACE_PLANT_BATCH_TAGS = "REPLACE_PLANT_BATCH_TAGS",
  UPDATE_TRANSFER = "UPDATE_TRANSFER",
  CSV_CREATE_PACKAGE = "CSV_CREATE_PACKAGE",
  ASSIGN_LAB_COA = "ASSIGN_LAB_COA",
  CHANGE_PLANTS_GROWTH_PHASE = "CHANGE_PLANTS_GROWTH_PHASE",
}

export enum BackgroundTaskState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

const DATA_LOAD_MAX_PAGES: number = 1;
export const DEFAULT_SEARCH_LOAD_PAGE_SIZE: number = 100;
export const DATA_LOAD_PAGE_SIZE: number = 5000;
export const DATA_LOAD_MAX_COUNT: number = DATA_LOAD_PAGE_SIZE * DATA_LOAD_MAX_PAGES;
export const DATA_LOAD_MAX_ITERATION_FAILSAFE: number = 100;
export const DATA_LOAD_FETCH_TIMEOUT_MS: number = 5 * 60 * 1000;
export const PLANTABLE_ITEM_CATEGORY_NAMES = [
  // Note: this was to match an inconsistency in the plural.
  // There's no apparent penalty for having both.
  "Immature Plant",
  "Immature Plants",
  "Clone - Cutting",
  "Clone - Tissue Culture",
  "Seeds",
  "Seeds (each)",
];

export const PLANT_BATCH_TYPES = [
  { text: "Clones", value: "Clone" },
  { text: "Seeds", value: "Seed" },
];

export const GROWTH_PHASES = [
  // { text: "Vegetative", value: "Vegetative" },
  { text: "Flowering", value: "Flowering" },
];

export enum MetrcStatus {
  UP = "UP",
  SLOW = "SLOW",
  DEGRADED = "DEGRADED",
  DOWN = "DOWN",
}

export enum Level {
  L0 = "L0",
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
}

export const ALASKA_METRC_HOSTNAME = "ak.metrc.com";
export const CALIFORNIA_METRC_HOSTNAME = "ca.metrc.com";
export const COLORADO_METRC_HOSTNAME = "co.metrc.com";
export const DC_METRC_HOSTNAME = "dc.metrc.com";
export const LOUISIANA_METRC_HOSTNAME = "la.metrc.com";
export const MAINE_METRC_HOSTNAME = "me.metrc.com";
export const MARYLAND_METRC_HOSTNAME = "md.metrc.com";
export const MASSACHUSETS_METRC_HOSTNAME = "ma.metrc.com";
export const MICHIGAN_METRC_HOSTNAME = "mi.metrc.com";
export const MISSOURI_METRC_HOSTNAME = "mo.metrc.com";
export const MONTANA_METRC_HOSTNAME = "mt.metrc.com";
export const NEVADA_METRC_HOSTNAME = "nv.metrc.com";
export const OHIO_METRC_HOSTNAME = "oh.metrc.com";
export const OKLAHOMA_METRC_HOSTNAME = "ok.metrc.com";
export const OREGON_METRC_HOSTNAME = "or.metrc.com";
export const WEST_VIRGINIA_METRC_HOSTNAME = "wv.metrc.com";
export const TESTING_AZ_METRC_HOSTNAME = "testing-az.metrc.com";

export const METRC_HOSTNAMES_LACKING_LAB_PDFS: string[] = [];

export const VUEX_KEY = "vuex";

export enum IdbKeyPiece {
  TRANSFER_MODAL_HTML = "transfer_modal_html",
  TRANSFER_MODAL_HTML_TIMESTAMP = "transfer_modal_html_timestamp",
  PACKAGE_MODAL_HTML = "package_modal_html",
  PACKAGE_MODAL_HTML_TIMESTAMP = "package_modal_html_timestamp",
  TRANSFER_TEMPLATE_MODAL_HTML = "transfer_template_modal_html",
  TRANSFER_TEMPLATE_MODAL_HTML_TIMESTAMP = "transfer_template_modal_html_timestamp",
}

export const METRC_INDUSTRY_LICENSE_PATH_REGEX: RegExp = /\/industry\/([^\/]+)(\/.+)/;

export const STRAIN_TESTING_STATUS_OPTIONS: { text: string; value: string }[] = [
  {
    text: "None",
    value: "None",
  },
  {
    text: "In House",
    value: "InHouse",
  },
  {
    text: "Third Party",
    value: "ThirdParty",
  },
];

export enum HistoryTreeNodeType {
  OWNED_PACKAGE = "OWNED_PACKAGE",
  UNOWNED_PACKAGE = "UNOWNED_PACKAGE",
}

export enum PackageTabLabel {
  ACTIVE = "Active",
  ON_HOLD = "On Hold",
  INACTIVE = "Inactive",
  IN_TRANSIT = "In Transit",
  TRANSFERRED = "Transferred",
}

export enum SalesTabLabel {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export enum TagsTabLabel {
  AVAILABLE = "Available",
  USED = "Used",
  VOIDED = "Voided",
}

export enum PlantsTabLabel {
  IMMATURE = "Immature",
  ON_HOLD = "On Hold",
  VEGETATIVE = "Vegetative",
  FLOWERING = "Flowering",
  HARVESTED = "Harvested",
  INACTIVE = "Inactive",
  ADDITIVE = "Additive",
  WASTE = "Waste",
}

export enum TransfersTabLabel {
  INCOMING = "Incoming",
  OUTGOING = "Outgoing",
  REJECTED = "Rejected",
  INACTIVE = "Inactive",
}

export enum SheetTitles {
  OVERVIEW = "Overview",
  PACKAGES = "Packages",
  TAGS = "Tags",
  HARVESTS = "Harvests",
  IMMATURE_PLANTS = "Immature Plants",
  MATURE_PLANTS = "Mature Plants",
  PACKAGES_QUICKVIEW = "Packages Quickview",
  MATURE_PLANTS_QUICKVIEW = "Mature Plants Quickview",
  IMMATURE_PLANTS_QUICKVIEW = "Immature Plants Quickview",
  INCOMING_TRANSFERS = "Incoming Transfers",
  OUTGOING_TRANSFERS = "Outgoing Transfers",
  TRANSFER_HUB_TRANSFERS = "Hub Transfers",
  INCOMING_TRANSFER_MANIFESTS = "Incoming Transfer Manifest Packages",
  INCOMING_MANIFEST_INVENTORY = "Incoming Transfer Manifest Inventory",
  OUTGOING_TRANSFER_MANIFESTS = "Outgoing Transfer Manifest Packages",
  TRANSFER_HUB_TRANSFER_MANIFESTS = "Hub Manifest Packages",
  STRAGGLER_PACKAGES = "Straggler Packages",
  PRODUCTION_BATCH_COSTS = "Production Batch Costs",
  WORKSHEET = "Worksheet",
  MASTER_WORKSHEET = "Master Worksheet",
  MANIFEST_COGS = "Manifest Cogs",
  BULK_INFUSED_GOODS_COGS = "Bulk Infused Goods COGS",
  DIST_REX_COGS = "Dist ReX COGS",
  PACKAGED_GOODS_COGS = "Packaged Goods COGS",
  EMPLOYEE_SAMPLES = "Distributed Employee Samples",
  RECEIVED_SAMPLES = "Received Samples",
  EMPLOYEE_AUDIT = "Employee Audit",
  EMPLOYEE_PERMISSIONS = "Employee Permissions",
  SCAN_SHEET = "Scan Sheet",
  HARVEST_PACKAGES = "Harvest Packages",
  POINT_IN_TIME_INVENTORY = "Point In Time Inventory",
  SINGLE_TRANSFER = "Transfer",
  LAB_RESULTS = "Lab Results",
  ITEMS_METADATA = "Items Metadata",
}

// Sheets self-enforced timeout is 180000ms,
// this allows for 3 requests plus a little extra
export const SHEETS_API_MESSAGE_TIMEOUT_MS = 3 * 180000 + 60000;

export const PRINT_DATA_KEY = "PRINT_DATA_KEY";
export const OPTIONS_REDIRECT_KEY = "OPTIONS_REDIRECT_KEY";

export enum NativeMetrcGridId {
  PLANT_BATCHES = "plantbatches-grid",
  PLANT_BATCHES_ON_HOLD = "plantbatchesonhold-grid",
  PLANT_BATCHES_INACTIVE = "plantbatchesinactive-grid",

  PLANTS_VEGETATIVE = "plantsvegetative-grid",
  PLANTS_FLOWERING = "plantsflowering-grid",
  PLANTS_ON_HOLD = "plantsonhold-grid",
  PLANTS_INACTIVE = "plantsinactive-grid",
  PLANTS_WASTE = "waste-grid",
  PLANTS_ADDITIVES = "additives-grid",

  HARVESTS_HARVESTED = "harvested-grid",
  HARVESTS_ON_HOLD = "harvestsonhold-grid",
  HARVESTS_INACTIVE = "harvestsinactive-grid",

  PACKAGES_ACTIVE = "active-grid",
  PACKAGES_ON_HOLD = "onhold-grid",
  PACKAGES_INACTIVE = "inactive-grid",
  PACKAGES_IN_TRANSIT = "intransit-grid",
  PACKAGES_TRANSFERRED = "transferred-grid",
  PACKAGES_PRODUCT_LABELS = "retailid-grid",

  TRANSFERS_INCOMING = "incoming-grid",
  TRANSFERS_INCOMING_INACTIVE = "incomingInactive-grid",
  TRANSFERS_OUTGOING = "outgoing-grid",
  TRANSFERS_REJECTED = "rejected-grid",
  TRANSFERS_OUTGOING_INACTIVE = "outgoingInactive-grid",
  TRANSFERS_TEMPLATES = "templates-grid",

  TAGS_AVAILABLE = "available-grid",
  TAGS_USED = "used-grid",
  TAGS_VOIDED = "voided-grid",

  SALES_ACTIVE = "active-grid",
  SALES_INACTIVE = "inactive-grid",

  LOCATIONS = "locations-grid",

  ITEMS = "items-grid",
  ITEMS_ITEM_BRANDS = "itembrands-grid",

  STRAINS = "strains-grid",
}

export enum UniqueMetrcGridId {
  PLANT_BATCHES = "PLANT_BATCHES",
  PLANT_BATCHES_ON_HOLD = "PLANT_BATCHES_ON_HOLD",
  PLANT_BATCHES_INACTIVE = "PLANT_BATCHES_INACTIVE",

  PLANTS_VEGETATIVE = "PLANTS_VEGETATIVE",
  PLANTS_FLOWERING = "PLANTS_FLOWERING",
  PLANTS_ON_HOLD = "PLANTS_ON_HOLD",
  PLANTS_INACTIVE = "PLANTS_INACTIVE",
  PLANTS_WASTE = "PLANTS_WASTE",
  PLANTS_ADDITIVES = "PLANTS_ADDITIVES",

  HARVESTS_HARVESTED = "HARVESTS_HARVESTED",
  HARVESTS_ON_HOLD = "HARVESTS_ON_HOLD",
  HARVESTS_INACTIVE = "HARVESTS_INACTIVE",

  PACKAGES_ACTIVE = "PACKAGES_ACTIVE",
  PACKAGES_ON_HOLD = "PACKAGES_ON_HOLD",
  PACKAGES_INACTIVE = "PACKAGES_INACTIVE",
  PACKAGES_IN_TRANSIT = "PACKAGES_IN_TRANSIT",
  PACKAGES_TRANSFERRED = "PACKAGES_TRANSFERRED",
  PACKAGES_PRODUCT_LABELS = "PACKAGES_PRODUCT_LABELS",

  TRANSFERS_INCOMING = "TRANSFERS_INCOMING",
  TRANSFERS_INCOMING_INACTIVE = "TRANSFERS_INCOMING_INACTIVE",
  TRANSFERS_OUTGOING = "TRANSFERS_OUTGOING",
  TRANSFERS_REJECTED = "TRANSFERS_REJECTED",
  TRANSFERS_OUTGOING_INACTIVE = "TRANSFERS_OUTGOING_INACTIVE",
  TRANSFERS_TEMPLATES = "TRANSFERS_TEMPLATES",

  TAGS_AVAILABLE = "TAGS_AVAILABLE",
  TAGS_USED = "TAGS_USED",
  TAGS_VOIDED = "TAGS_VOIDED",

  SALES_ACTIVE = "SALES_ACTIVE",
  SALES_INACTIVE = "SALES_INACTIVE",

  LOCATIONS = "LOCATION",

  ITEMS = "ITEMS",
  ITEMS_ITEM_BRANDS = "ITEMS_ITEM_BRANDS",

  STRAINS = "STRAINS",
}

export enum MetrcPageId {
  PACKAGES = "PACKAGES",
  PLANTS = "PLANTS",
  TRANSFERS = "TRANSFERS",
  SALES_RECEIPTS = "SALES_RECEIPTS",
  ITEMS = "ITEMS",
  ITEM_BRANDS = "ITEM_BRANDS",
  STRAINS = "STRAINS",
  LOCATIONS = "LOCATIONS",
  TAGS = "TAGS",
  TRANSFERS_TEMPLATES = "TRANSFERS_TEMPLATES",
}

export const METRC_PAGE_METADATA: {
  [key: string]: {
    pathPartial: string;
  };
} = {
  [MetrcPageId.PACKAGES]: {
    pathPartial: "/packages",
  },
  [MetrcPageId.PLANTS]: {
    pathPartial: "/plants",
  },
  [MetrcPageId.TRANSFERS]: {
    pathPartial: "/transfers/licensed",
  },
  [MetrcPageId.TRANSFERS_TEMPLATES]: {
    pathPartial: "/transfers/licensed.templates",
  },
  [MetrcPageId.SALES_RECEIPTS]: {
    pathPartial: "/sales/receipts",
  },
  [MetrcPageId.ITEMS]: {
    pathPartial: "/admin/items",
  },
  [MetrcPageId.ITEM_BRANDS]: {
    pathPartial: "/admin/items/brands",
  },
  [MetrcPageId.STRAINS]: {
    pathPartial: "/admin/strains",
  },
  [MetrcPageId.LOCATIONS]: {
    pathPartial: "/admin/locations",
  },
  [MetrcPageId.TAGS]: {
    pathPartial: "/admin/tags",
  },
};

export const METRC_GRID_METADATA: {
  [key: string]: {
    nativeMetrcGridId: NativeMetrcGridId;
    metrcPageId: MetrcPageId;
  };
} = {
  [UniqueMetrcGridId.PLANT_BATCHES]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANT_BATCHES,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANT_BATCHES_ON_HOLD]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANT_BATCHES_ON_HOLD,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANT_BATCHES_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANT_BATCHES_INACTIVE,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANTS_VEGETATIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANTS_VEGETATIVE,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANTS_FLOWERING]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANTS_FLOWERING,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANTS_ON_HOLD]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANTS_ON_HOLD,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANTS_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANTS_INACTIVE,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.HARVESTS_HARVESTED]: {
    nativeMetrcGridId: NativeMetrcGridId.HARVESTS_HARVESTED,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.HARVESTS_ON_HOLD]: {
    nativeMetrcGridId: NativeMetrcGridId.HARVESTS_ON_HOLD,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.HARVESTS_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.HARVESTS_INACTIVE,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PACKAGES_ACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.PACKAGES_ACTIVE,
    metrcPageId: MetrcPageId.PACKAGES,
  },
  [UniqueMetrcGridId.PACKAGES_ON_HOLD]: {
    nativeMetrcGridId: NativeMetrcGridId.PACKAGES_ON_HOLD,
    metrcPageId: MetrcPageId.PACKAGES,
  },
  [UniqueMetrcGridId.PACKAGES_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.PACKAGES_INACTIVE,
    metrcPageId: MetrcPageId.PACKAGES,
  },
  [UniqueMetrcGridId.PACKAGES_IN_TRANSIT]: {
    nativeMetrcGridId: NativeMetrcGridId.PACKAGES_IN_TRANSIT,
    metrcPageId: MetrcPageId.PACKAGES,
  },
  [UniqueMetrcGridId.PACKAGES_TRANSFERRED]: {
    nativeMetrcGridId: NativeMetrcGridId.PACKAGES_TRANSFERRED,
    metrcPageId: MetrcPageId.PACKAGES,
  },
  [UniqueMetrcGridId.PACKAGES_PRODUCT_LABELS]: {
    nativeMetrcGridId: NativeMetrcGridId.PACKAGES_PRODUCT_LABELS,
    metrcPageId: MetrcPageId.PACKAGES,
  },
  [UniqueMetrcGridId.TRANSFERS_INCOMING]: {
    nativeMetrcGridId: NativeMetrcGridId.TRANSFERS_INCOMING,
    metrcPageId: MetrcPageId.TRANSFERS,
  },
  [UniqueMetrcGridId.TRANSFERS_INCOMING_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.TRANSFERS_INCOMING_INACTIVE,
    metrcPageId: MetrcPageId.TRANSFERS,
  },
  [UniqueMetrcGridId.TRANSFERS_OUTGOING]: {
    nativeMetrcGridId: NativeMetrcGridId.TRANSFERS_OUTGOING,
    metrcPageId: MetrcPageId.TRANSFERS,
  },
  [UniqueMetrcGridId.TRANSFERS_REJECTED]: {
    nativeMetrcGridId: NativeMetrcGridId.TRANSFERS_REJECTED,
    metrcPageId: MetrcPageId.TRANSFERS,
  },
  [UniqueMetrcGridId.TRANSFERS_OUTGOING_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.TRANSFERS_OUTGOING_INACTIVE,
    metrcPageId: MetrcPageId.TRANSFERS,
  },
  [UniqueMetrcGridId.TRANSFERS_TEMPLATES]: {
    nativeMetrcGridId: NativeMetrcGridId.TRANSFERS_TEMPLATES,
    metrcPageId: MetrcPageId.TRANSFERS_TEMPLATES,
  },
  [UniqueMetrcGridId.TAGS_AVAILABLE]: {
    nativeMetrcGridId: NativeMetrcGridId.TAGS_AVAILABLE,
    metrcPageId: MetrcPageId.TAGS,
  },
  [UniqueMetrcGridId.TAGS_USED]: {
    nativeMetrcGridId: NativeMetrcGridId.TAGS_USED,
    metrcPageId: MetrcPageId.TAGS,
  },
  [UniqueMetrcGridId.TAGS_VOIDED]: {
    nativeMetrcGridId: NativeMetrcGridId.TAGS_VOIDED,
    metrcPageId: MetrcPageId.TAGS,
  },
  [UniqueMetrcGridId.SALES_ACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.SALES_ACTIVE,
    metrcPageId: MetrcPageId.SALES_RECEIPTS,
  },
  [UniqueMetrcGridId.SALES_INACTIVE]: {
    nativeMetrcGridId: NativeMetrcGridId.SALES_INACTIVE,
    metrcPageId: MetrcPageId.SALES_RECEIPTS,
  },
  [UniqueMetrcGridId.ITEMS]: {
    nativeMetrcGridId: NativeMetrcGridId.ITEMS,
    metrcPageId: MetrcPageId.ITEMS,
  },
  [UniqueMetrcGridId.ITEMS_ITEM_BRANDS]: {
    nativeMetrcGridId: NativeMetrcGridId.ITEMS_ITEM_BRANDS,
    metrcPageId: MetrcPageId.ITEM_BRANDS,
  },
  [UniqueMetrcGridId.STRAINS]: {
    nativeMetrcGridId: NativeMetrcGridId.STRAINS,
    metrcPageId: MetrcPageId.STRAINS,
  },
  [UniqueMetrcGridId.LOCATIONS]: {
    nativeMetrcGridId: NativeMetrcGridId.LOCATIONS,
    metrcPageId: MetrcPageId.LOCATIONS,
  },
  [UniqueMetrcGridId.PLANTS_WASTE]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANTS_WASTE,
    metrcPageId: MetrcPageId.PLANTS,
  },
  [UniqueMetrcGridId.PLANTS_ADDITIVES]: {
    nativeMetrcGridId: NativeMetrcGridId.PLANTS_ADDITIVES,
    metrcPageId: MetrcPageId.PLANTS,
  },
};

export enum TransferPackageSearchAlgorithm {
  OLD_TO_NEW = "OLD_TO_NEW",
  NEW_TO_OLD = "NEW_TO_OLD",
}
