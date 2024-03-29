export enum PackageHistoryMutations {
  SET_SOURCE_PACKAGE = 'SET_SOURCE_PACKAGE',
  SET_ANCESTORS = 'SET_ANCESTORS',
  SET_CHILDREN = 'SET_CHILDREN',
  SET_SOURCE_HARVESTS = 'SET_SOURCE_HARVESTS',
  SET_STATUS = 'SET_STATUS',
  LOG_EVENT = 'LOG_EVENT',
  SET_MAX_PARENT_LOOKUP_DEPTH = 'SET_MAX_PARENT_LOOKUP_DEPTH',
  SET_MAX_CHILD_LOOKUP_DEPTH = 'SET_MAX_CHILD_LOOKUP_DEPTH',
  SET_MAX_PARENT_VISIBLE_DEPTH = 'SET_MAX_PARENT_VISIBLE_DEPTH',
  SET_MAX_CHILD_VISIBLE_DEPTH = 'SET_MAX_CHILD_VISIBLE_DEPTH',
  SET_PARENT_ZOOM = 'SET_PARENT_ZOOM',
  SET_CHILD_ZOOM = 'SET_CHILD_ZOOM',
  SET_SHOW_UNOWNED_PACKAGES = 'SET_SHOW_UNOWNED_PACKAGES',
}

export enum PackageHistoryGetters {
  ANCESTOR_LIST = 'ANCESTOR_LIST',
  ANCESTOR_GENERATIONS = 'ANCESTOR_GENERATIONS',
  CHILD_LIST = 'CHILD_LIST',
  CHILD_GENERATIONS = 'CHILD_GENERATIONS',
}

export enum PackageHistoryActions {
  SET_SOURCE_PACKAGE = 'SET_SOURCE_PACKAGE',
  LOG_EVENT = 'LOG_EVENT',
  SET_MAX_PARENT_LOOKUP_DEPTH = 'SET_MAX_PARENT_LOOKUP_DEPTH',
  SET_MAX_CHILD_LOOKUP_DEPTH = 'SET_MAX_CHILD_LOOKUP_DEPTH',
  SET_MAX_PARENT_VISIBLE_DEPTH = 'SET_MAX_PARENT_VISIBLE_DEPTH',
  SET_MAX_CHILD_VISIBLE_DEPTH = 'SET_MAX_CHILD_VISIBLE_DEPTH',
  SET_PARENT_ZOOM = 'SET_PARENT_ZOOM',
  SET_CHILD_ZOOM = 'SET_CHILD_ZOOM',
  SET_SHOW_UNOWNED_PACKAGES = 'SET_SHOW_UNOWNED_PACKAGES',
  HALT = 'HALT',
}

export enum PackageHistoryStatus {
  INITIAL = 'INITIAL',
  INFLIGHT = 'INFLIGHT',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  HALTED = 'HALTED',
}
