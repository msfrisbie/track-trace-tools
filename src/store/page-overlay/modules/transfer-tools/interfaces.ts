import { IMetrcFacilityData } from "@/interfaces";

export interface ITransferToolsState {
    destinationFacilities: IMetrcFacilityData[];
    transporterFacilities: IMetrcFacilityData[];
    selectedDestinationLicense: string | null;

}
