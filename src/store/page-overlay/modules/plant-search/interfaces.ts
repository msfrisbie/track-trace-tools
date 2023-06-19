import { IIndexedPlantData, IPlantSearchFilters } from "@/interfaces";

export interface ISelectedPlantMetadata {
  plantData: IIndexedPlantData;
  sectionName: string;
  priority: number;
}

export interface IPlantSearchState {
  searchInflight: boolean;
  plantSearchFilters: IPlantSearchFilters;
  plants: IIndexedPlantData[];
  selectedPlantMetadata: ISelectedPlantMetadata | null;
}
