import {
  IIndexedTransferData,
  IMetrcFacilityData,
  IMetrcTransferType,
  IUnionIndexedPackageData,
  IUnitOfMeasure,
} from "@/interfaces";

export interface ITransferBuilderState {
  transferPackageList: IUnionIndexedPackageData[];
  originFacility: IMetrcFacilityData | null;
  transporterFacility: IMetrcFacilityData | null;
  destinationFacility: IMetrcFacilityData | null;
  transferType: IMetrcTransferType | null;
  departureIsodate: string;
  departureIsotime: string;
  layoverCheckInIsodate: string;
  layoverCheckInIsotime: string;
  layoverCheckOutIsodate: string;
  layoverCheckOutIsotime: string;
  arrivalIsodate: string;
  arrivalIsotime: string;
  plannedRoute: string;
  driverName: string;
  driverEmployeeId: string;
  driverLicenseNumber: string;
  driverLayoverLeg: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  phoneNumberForQuestions: string;
  wholesalePackageValues: number[];
  packageGrossWeights: number[];
  packageGrossUnitsOfWeight: IUnitOfMeasure[];
  destinationGrossWeight: number | null;
  destinationGrossUnitOfWeight: IUnitOfMeasure | null;
  isSameSiteTransfer: boolean;
  isLayover: boolean;
  transferForUpdate: IIndexedTransferData | null;
}

export interface ITransferBuilderUpdateData {
  originFacility?: IMetrcFacilityData | null;
  transporterFacility?: IMetrcFacilityData | null;
  destinationFacility?: IMetrcFacilityData | null;
  transferType?: IMetrcTransferType | null;
  wholesalePackageValues?: number[];
  packageGrossWeights?: number[];
  packageGrossUnitsOfWeight?: IUnitOfMeasure[];
  destinationGrossWeight?: number;
  destinationGrossUnitOfWeight?: IUnitOfMeasure;
  departureIsodate?: string;
  departureIsotime?: string;
  arrivalIsodate?: string;
  arrivalIsotime?: string;
  plannedRoute?: string;
  driverName?: string;
  driverEmployeeId?: string;
  driverLicenseNumber?: string;
  driverLayoverLeg?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  phoneNumberForQuestions?: string;
}
