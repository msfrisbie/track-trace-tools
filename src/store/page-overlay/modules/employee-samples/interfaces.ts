import { IIndexedPackageData, IMetrcEmployeeData } from "@/interfaces";
import { EmployeeSamplesState } from "./consts";

export interface INormalizedAllocation {
  flowerAllocationGrams: number;
  concentrateAllocationGrams: number;
  infusedAllocationGrams: number;
}

export interface IEmployeeSamplesState {
  toolState: EmployeeSamplesState;
  employees: IMetrcEmployeeData[];
  selectedEmployeeIds: number[];
  availableSamples: {
    quantity: number;
    pkg: IIndexedPackageData;
    allocation: INormalizedAllocation;
  }[];
  availableSamplePackages: IIndexedPackageData[];
  selectedSamplePackageIds: number[];
  modifiedSamplePackages: IIndexedPackageData[];
  pendingAllocationBuffer: ISampleAllocation[];
  recordedAllocationBuffer: ISampleAllocation[];
  startDate: string;
  endDate: string;
  stateMessage: string;
}
// Indicates what can be extracted from a package history
// Employee may or may not exist
export interface IHistoryAllocationData {
  packageLabel: string;
  employeeLicenseNumber: string;
  employeeName: string;
  quantity: number;
  unitOfMeasureName: string;
  isodate: string;
}

// Indicates a package-employee match,
// or a proposed adjustment that will be sent to Metrc
export interface ISampleAllocation extends INormalizedAllocation {
  employee: IMetrcEmployeeData;
  pkg: IIndexedPackageData;
  adjustmentQuantity: number;
}
