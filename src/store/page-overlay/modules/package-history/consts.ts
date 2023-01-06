export enum PackageHistoryMutations {
  SET_SOURCE_PACKAGE = "SET_SOURCE_PACKAGE",
  SET_ANCESTORS = "SET_ANCESTORS",
  SET_CHILDREN = "SET_CHILDREN",
  SET_STATUS = "SET_STATUS",
  LOG_EVENT = "LOG_EVENT",
}

export enum PackageHistoryGetters {
  EXAMPLE_GETTER = "EXAMPLE_GETTER",
}

export enum PackageHistoryActions {
  SET_SOURCE_PACKAGE = "SET_SOURCE_PACKAGE",
  LOG_EVENT = "LOG_EVENT",
}

export enum PackageHistoryStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}