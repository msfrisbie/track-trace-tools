import {
  IIndexedTransferData,
  IMetrcFacilityData,
  IMetrcTransferTypeData,
  ITransferPackageList,
  IUnitOfMeasure,
} from "@/interfaces";

export interface ITransferBuilderState {
  transferPackageLists: ITransferPackageList[];
  originFacility: IMetrcFacilityData | null;
  transporterFacility: IMetrcFacilityData | null;
  destinationFacility: IMetrcFacilityData | null;
  transferType: IMetrcTransferTypeData | null;
  departureIsodate: string;
  departureIsotime: string;
  arrivalIsodate: string;
  arrivalIsotime: string;
  plannedRoute: string;
  driverName: string;
  driverEmployeeId: string;
  driverLicenseNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  phoneNumberForQuestions: string;
  wholesalePackageValues: number[];
  packageGrossWeights: number[];
  packageGrossUnitsOfWeight: IUnitOfMeasure[];
  isSameSiteTransfer: boolean;
  transferForUpdate: IIndexedTransferData | null;
}

export interface ITransferBuilderUpdateData {
  originFacility?: IMetrcFacilityData | null;
  transporterFacility?: IMetrcFacilityData | null;
  destinationFacility?: IMetrcFacilityData | null;
  transferType?: IMetrcTransferTypeData | null;
  wholesalePackageValues?: number[];
  packageGrossWeights?: number[];
  packageGrossUnitsOfWeight?: IUnitOfMeasure[];
  departureIsodate?: string;
  departureIsotime?: string;
  arrivalIsodate?: string;
  arrivalIsotime?: string;
  plannedRoute?: string;
  driverName?: string;
  driverEmployeeId?: string;
  driverLicenseNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  phoneNumberForQuestions?: string;
}
