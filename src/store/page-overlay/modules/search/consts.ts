import { MetrcGridId } from "@/consts";
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
        metrcGridId: MetrcGridId.PLANTS_VEGETATIVE,
        enabled: true,
      },
      {
        name: "FLOWERING",
        metrcGridId: MetrcGridId.PLANTS_FLOWERING,
        enabled: true,
      },
      {
        name: "INACTIVE",
        metrcGridId: MetrcGridId.PLANTS_INACTIVE,
        enabled: false,
      },
    ],
  },
  {
    name: "PACKAGES",
    children: [
      {
        name: "ACTIVE",
        metrcGridId: MetrcGridId.PACKAGES_ACTIVE,
        enabled: true,
      },
      {
        name: "ON HOLD",
        metrcGridId: MetrcGridId.PACKAGES_ON_HOLD,
        enabled: false,
      },
      {
        name: "INACTIVE",
        metrcGridId: MetrcGridId.PACKAGES_INACTIVE,
        enabled: false,
      },
      {
        name: "IN TRANSIT",
        metrcGridId: MetrcGridId.PACKAGES_IN_TRANSIT,
        enabled: true,
      },
      {
        name: "TRANSFERRED",
        metrcGridId: MetrcGridId.PACKAGES_TRANSFERRED,
        enabled: false,
      },
    ],
  },
  {
    name: "TRANSFERS",
    children: [
      {
        name: "INCOMING",
        metrcGridId: MetrcGridId.TRANSFERS_INCOMING,
        enabled: true,
      },
      {
        name: "INCOMING INACTIVE",
        metrcGridId: MetrcGridId.TRANSFERS_INCOMING_INACTIVE,
        enabled: false,
      },
      {
        name: "OUTGOING",
        metrcGridId: MetrcGridId.TRANSFERS_OUTGOING,
        enabled: true,
      },
      {
        name: "OUTGOING INACTIVE",
        metrcGridId: MetrcGridId.TRANSFERS_OUTGOING_INACTIVE,
        enabled: false,
      },
      {
        name: "REJECTED",
        metrcGridId: MetrcGridId.TRANSFERS_REJECTED,
        enabled: true,
      },
    ],
  },
  {
    name: "TAGS",
    children: [
      {
        name: "AVAILABLE",
        metrcGridId: MetrcGridId.TAGS_AVAILABLE,
        enabled: false,
      },
      {
        name: "USED",
        metrcGridId: MetrcGridId.TAGS_USED,
        enabled: false,
      },
      {
        name: "VOIDED",
        metrcGridId: MetrcGridId.TAGS_VOIDED,
        enabled: false,
      },
    ],
  },
  {
    name: "SALES",
    children: [
      {
        name: "ACTIVE",
        metrcGridId: MetrcGridId.SALES_ACTIVE,
        enabled: true,
      },
      {
        name: "INACTIVE",
        metrcGridId: MetrcGridId.SALES_INACTIVE,
        enabled: false,
      },
    ],
  },
  {
    name: "ITEMS",
    children: [
      {
        name: "ACTIVE",
        metrcGridId: MetrcGridId.ITEMS_GRID,
        enabled: true,
      },
    ],
  },
  {
    name: "STRAINS",
    children: [
      {
        name: "ACTIVE",
        metrcGridId: MetrcGridId.STRAIN_GRID,
        enabled: true,
      },
    ],
  },
];
