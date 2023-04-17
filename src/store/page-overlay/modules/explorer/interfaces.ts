import {
  IHarvestHistoryData,
  IIndexedDestinationPackageData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IPackageHistoryData,
  IPlantBatchHistoryData,
  IPlantHistoryData,
  ITransferHistoryData,
} from "@/interfaces";
import { ExplorerStatus, ExplorerTargetType } from "./consts";

export type ExplorerTarget =
  | IIndexedPackageData
  | IIndexedDestinationPackageData
  | IIndexedPlantData
  | IIndexedPlantBatchData
  | IIndexedHarvestData
  | IIndexedRichIncomingTransferData
  | IIndexedRichOutgoingTransferData;

export type ExplorerTargetHistory =
  | IPackageHistoryData[]
  | IPlantHistoryData[]
  | IPlantBatchHistoryData[]
  | IHarvestHistoryData[]
  | ITransferHistoryData[];

export interface IExplorerState {
  status: ExplorerStatus;
  statusMessage: string;
  queryString: string;
  targetType: ExplorerTargetType;
  target: ExplorerTarget | null;
  history: ExplorerTargetHistory | null;
  recent: {
    queryString: string,
    targetType: ExplorerTargetType
  }[]
  // Parents
  //   parentPackageLabels?: string[];
  //   parentHarvestNames?: string[];
  //   parentPlantLabels?: string[];
  //   parentPlantBatchLabels?: string[];
  //   parentManifestNumber?: string;
  // Children
  //   childHarvestNames?: string[];
  //   childPackageLabels?: string[];
  //   childPlantLabels?: string[];
  //   childPlantBatchNames?: string[];
  //   childManifestNumber?: string;
}
