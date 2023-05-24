import { IIndexedPackageData, IMetrcEmployeeData } from "@/interfaces";

export interface IEmployeeSamplesState {
    employees: IMetrcEmployeeData[],
    availableSamplePackages: IIndexedPackageData[]
}
