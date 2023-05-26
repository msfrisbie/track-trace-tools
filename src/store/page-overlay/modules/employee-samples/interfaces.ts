import { IIndexedPackageData, IMetrcEmployeeData } from "@/interfaces";

export interface ISampleAllocation {
  packageQuantity: number;
  flowerAllocationGrams: number;
  concentrateAllocationGrams: number;
  infusedAllocationGrams: number;
}

export interface IEmployeeSamplesState {
  loadInflight: boolean;
  employees: IMetrcEmployeeData[];
  availableSamplePackages: IIndexedPackageData[];
  modifiedSamplePackages: IIndexedPackageData[];
}
