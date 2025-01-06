import { UniqueMetrcGridId } from "@/consts";
import { MetrcGroup } from "./interfaces";

export enum SearchMutations {
  SEARCH_MUTATION = "SEARCH_MUTATION",
  PUSH_SEARCH_RESULTS = "PUSH_SEARCH_RESULTS",
}

export enum SearchGetters {}

export enum SearchActions {
  SET_SHOW_SEARCH_RESULTS = "SET_SHOW_SEARCH_RESULTS",
  SET_QUERY_STRING = "SET_QUERY_STRING",
  EXECUTE_QUERY = "EXECUTE_QUERY",
  MIRROR_METRC_SEARCH_FILTERS = "MIRROR_METRC_SEARCH_FILTERS",
  SET_ACTIVE_METRC_GRID_ID = "SET_ACTIVE_METRC_GRID_ID",
  SELECT_SEARCH_RESULT = "SELECT_SEARCH_RESULT",
  UPDATE_SEARCH_GROUPS = "UPDATE_SEARCH_GROUPS",
  UPDATE_SEARCH_RESULT_PAGE_SIZE = "UPDATE_SEARCH_RESULT_PAGE_SIZE",
}

export enum SearchType {
  PACKAGES = "PACKAGES",
  TRANSFER_PACKAGES = "TRANSFER_PACKAGES",
  PLANTS = "PLANTS",
  TAGS = "TAGS",
  TRANSFERS = "TRANSFERS",
  HARVESTS = "HARVESTS",
  PLANT_BATCHES = "PLANT_BATCHES",
  SALES = "SALES",
  TRANSFER_TEMPLATES = "TRANSFER_TEMPLATES",
}

export enum SearchStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export const ALL_METRC_GROUPS: MetrcGroup[] = [
  {
    name: "PLANTS",
    children: [
      {
        name: "VEGETATIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.PLANTS_VEGETATIVE,
        enabled: true,
      },
      {
        name: "FLOWERING",
        uniqueMetrcGridId: UniqueMetrcGridId.PLANTS_FLOWERING,
        enabled: true,
      },
      {
        name: "INACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.PLANTS_INACTIVE,
        enabled: false,
      },
    ],
  },
  {
    name: "PACKAGES",
    children: [
      {
        name: "ACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_ACTIVE,
        enabled: true,
      },
      {
        name: "ON HOLD",
        uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_ON_HOLD,
        enabled: false,
      },
      {
        name: "INACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_INACTIVE,
        enabled: false,
      },
      {
        name: "IN TRANSIT",
        uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_IN_TRANSIT,
        enabled: true,
      },
      {
        name: "TRANSFERRED",
        uniqueMetrcGridId: UniqueMetrcGridId.PACKAGES_TRANSFERRED,
        enabled: false,
      },
    ],
  },
  {
    name: "TRANSFERS",
    children: [
      {
        name: "INCOMING",
        uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_INCOMING,
        enabled: true,
      },
      {
        name: "INCOMING INACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_INCOMING_INACTIVE,
        enabled: false,
      },
      {
        name: "OUTGOING",
        uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_OUTGOING,
        enabled: true,
      },
      {
        name: "OUTGOING INACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_OUTGOING_INACTIVE,
        enabled: false,
      },
      {
        name: "REJECTED",
        uniqueMetrcGridId: UniqueMetrcGridId.TRANSFERS_REJECTED,
        enabled: true,
      },
    ],
  },
  {
    name: "TAGS",
    children: [
      {
        name: "AVAILABLE",
        uniqueMetrcGridId: UniqueMetrcGridId.TAGS_AVAILABLE,
        enabled: false,
      },
      {
        name: "USED",
        uniqueMetrcGridId: UniqueMetrcGridId.TAGS_USED,
        enabled: false,
      },
      {
        name: "VOIDED",
        uniqueMetrcGridId: UniqueMetrcGridId.TAGS_VOIDED,
        enabled: false,
      },
    ],
  },
  {
    name: "SALES",
    children: [
      {
        name: "ACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.SALES_ACTIVE,
        enabled: true,
      },
      {
        name: "INACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.SALES_INACTIVE,
        enabled: false,
      },
    ],
  },
  {
    name: "ITEMS",
    children: [
      {
        name: "ACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.ITEMS,
        enabled: true,
      },
    ],
  },
  {
    name: "STRAINS",
    children: [
      {
        name: "ACTIVE",
        uniqueMetrcGridId: UniqueMetrcGridId.STRAINS,
        enabled: true,
      },
    ],
  },
];
