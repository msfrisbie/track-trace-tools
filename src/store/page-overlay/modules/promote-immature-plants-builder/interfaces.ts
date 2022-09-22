import {
  IIntermediatePromotePlantBatchData,
  ILocationData,
  IPlantBatchData,
  IPlantBatchGrowthPhase,
  ITagData
} from "@/interfaces";

export interface IPromoteImmaturePlantsBuilderState {
  selectedPlantBatches: IPlantBatchData[];
  growthPhase: IPlantBatchGrowthPhase | null;
  totalPlantCount: number;
  promoteData: IIntermediatePromotePlantBatchData[];
  plantTags: ITagData[];
  patientLicenseNumber: string;
  showTagPicker: boolean;
  growthIsodate: string;
  plantLocation: ILocationData | null;
  showHiddenDetailFields: boolean;
}
