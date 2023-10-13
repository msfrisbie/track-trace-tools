import { IIndexedPackageData } from "@/interfaces";
import Graph from "graphology";
import Sigma from "sigma";
import { GraphRenderAlgorithm, GraphStatus } from "./consts";

export interface IGraphState {
  status: GraphStatus;
  renderAlgorithm: GraphRenderAlgorithm;
  filterDateGt: boolean;
  dateGt: string;
  filterDateLt: boolean;
  dateLt: string;
  licenseOptions: string[];
  licenses: string[];
  graphData: IGraphData;
  hoveredNode: string | null;
  searchQuery: string | null;
  selectedNode: string | null;
  suggestions: string[];
  hoveredNeighbors: string[];
}

export interface IGraphComponentContext {
  container: HTMLElement;
  searchInput: HTMLInputElement;
  graph: Graph;
  renderer: Sigma;
}

export interface IGraphNode {
  key: string;
  attributes: {
    size: number;
    label: string;
    color: string;
    obj: {
      type: string;
      pkg?: IIndexedPackageData;
    };
  };
}

export interface IGraphData {
  nodes: IGraphNode[];
  edges: {
    key: string;
    source: string;
    target: string;
    attributes: { type: "arrow"; size: number };
  }[];
}
