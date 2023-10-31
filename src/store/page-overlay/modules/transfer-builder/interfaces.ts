import {
  IIndexedTransferData,
  IMetrcFacilityData,
  IMetrcTransferType,
  IUnionIndexedPackageData,
  IUnitOfMeasure,
} from "@/interfaces";

export type DriverLayoverLeg = "" | "FromLayover" | "ToLayover" | "FromAndToLayover";

export interface ITransferBuilderState {
  transferPackageList: IUnionIndexedPackageData[];
  originFacility: IMetrcFacilityData | null;
  transporterFacility: IMetrcFacilityData | null;
  destinationFacility: IMetrcFacilityData | null;
  transferType: IMetrcTransferType | null;
  departureIsodate: string;
  departureIsotime: string;
  arrivalIsodate: string;
  arrivalIsotime: string;
  layoverCheckInIsodate: string;
  layoverCheckInIsotime: string;
  layoverCheckOutIsodate: string;
  layoverCheckOutIsotime: string;
  plannedRoute: string;
  driverName: string;
  driverEmployeeId: string;
  driverLicenseNumber: string;
  driverLayoverLeg: DriverLayoverLeg;
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
  destinationGrossWeight?: number | null;
  destinationGrossUnitOfWeight?: IUnitOfMeasure | null;
  departureIsodate?: string;
  departureIsotime?: string;
  arrivalIsodate?: string;
  arrivalIsotime?: string;
  layoverCheckInIsodate?: string;
  layoverCheckInIsotime?: string;
  layoverCheckOutIsodate?: string;
  layoverCheckOutIsotime?: string;
  plannedRoute?: string;
  driverName?: string;
  driverEmployeeId?: string;
  driverLicenseNumber?: string;
  driverLayoverLeg?: DriverLayoverLeg;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  isLayover?: boolean;
  phoneNumberForQuestions?: string;
}
