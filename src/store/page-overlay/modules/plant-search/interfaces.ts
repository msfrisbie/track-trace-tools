import { IIndexedPlantData, IPlantSearchFilters } from "@/interfaces";

export interface IPlantSearchState {
  plantSearchFilters: IPlantSearchFilters;
  plants: IIndexedPlantData[];
  selectedPlant: IIndexedPlantData | null;
}
