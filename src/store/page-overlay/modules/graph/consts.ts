export enum GraphMutations {
  GRAPH_MUTATION = 'GRAPH_MUTATION',
}

export enum GraphGetters {
  GRAPH_GETTER = 'GRAPH_GETTER',
}

export enum GraphActions {
  LOAD_DATA = 'LOAD_DATA',
  INITIALIZE_GRAPH = 'INITIALIZE_GRAPH',
  RENDER_GRAPH = 'RENDER_GRAPH',
  SET_SEARCH_QUERY = 'SET_SEARCH_QUERY',
  SET_HOVERED_NODE = 'SET_HOVERED_NODE',
  SELECT_NODE = 'SELECT_NODE',
  HANDLE_EVENT = 'HANDLE_EVENT',
  ZOOM = 'ZOOM'
}

export enum GraphRenderAlgorithm {
  RANDOM = 'RANDOM',
  DATE_SORT = 'DATE_SORT',
}

export enum GraphStatus {
  INITIAL = 'INITIAL',
  INFLIGHT = 'INFLIGHT',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
