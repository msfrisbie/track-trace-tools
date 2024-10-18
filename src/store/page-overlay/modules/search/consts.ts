import { MetrcGridId } from "@/consts";

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
