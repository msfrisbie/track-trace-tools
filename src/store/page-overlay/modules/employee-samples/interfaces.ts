import { IIndexedPackageData, IMetrcEmployeeData } from '@/interfaces';
import { EmployeeSamplesState } from './consts';

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
  pendingAllocationBufferIds: string[];
  recordedAllocationBuffer: ISampleAllocation[];
  daysInRange: number;
  stateMessage: string;
}

export interface INormalizedAllocation {
  flowerAllocationGrams: number;
  concentrateAllocationGrams: number;
  infusedAllocationGrams: number;
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
  uuid: string;
  employee: IMetrcEmployeeData;
  pkg: IIndexedPackageData;
  adjustmentQuantity: number;
  distributionDate: string;
}
