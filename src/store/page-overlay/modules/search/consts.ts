export enum SearchMutations {
  SEARCH_MUTATION = "SEARCH_MUTATION",
}

export enum SearchGetters {}

export enum SearchActions {
  SET_SEARCH_TYPE = "SET_SEARCH_TYPE",
  SET_SHOW_SEARCH_RESULTS = "SET_SHOW_SEARCH_RESULTS",
  SET_QUERY_STRING = "SET_QUERY_STRING",
  EXECUTE_QUERY = "EXECUTE_QUERY",
  SET_SEARCH_FILTERS = "SET_SEARCH_FILTERS",
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
