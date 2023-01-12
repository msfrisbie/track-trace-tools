export enum PackageHistoryMutations {
  SET_SOURCE_PACKAGE = "SET_SOURCE_PACKAGE",
  SET_PARENTS = "SET_PARENTS",
  SET_CHILDREN = "SET_CHILDREN",
  SET_SOURCE_HARVESTS = "SET_SOURCE_HARVESTS",
  SET_STATUS = "SET_STATUS",
  LOG_EVENT = "LOG_EVENT",
  SET_MAX_LOOKUP_DEPTH = "SET_MAX_LOOKUP_DEPTH",
}

export enum PackageHistoryGetters {
  PARENT_LIST = "PARENT_LIST",
  PARENT_GENERATIONS = "PARENT_GENERATIONS",
  CHILD_LIST = "CHILD_LIST",
  CHILD_GENERATIONS = "CHILD_GENERATIONS",
}

export enum PackageHistoryActions {
  SET_SOURCE_PACKAGE = "SET_SOURCE_PACKAGE",
  LOG_EVENT = "LOG_EVENT",
  SET_MAX_LOOKUP_DEPTH = "SET_MAX_LOOKUP_DEPTH",
  HALT = "HALT",
}

export enum PackageHistoryStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
  HALTED = "HALTED",
}
