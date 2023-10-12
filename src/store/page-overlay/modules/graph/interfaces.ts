export interface IGraphState {
  inflight: boolean;
  dateGt: string;
  dateLt: string;
  licenseOptions: string[];
  licenses: string[];
  graphData: GraphData;
  hoveredNode: string | null;
  searchQuery: string | null;
  selectedNode: string | null;
  suggestions: string[];
  hoveredNeighbors: string[];
}

export interface GraphData {
  nodes: {
    key: string;
    attributes: {
      size: number;
      label: string;
      color: string;
      //   obj: {
      //     pkg?: IIndexedPackageData;
      //   };
    };
  }[];
  edges: {
    key: string;
    source: string;
    target: string;
    attributes: { type: "arrow"; size: number };
  }[];
}
