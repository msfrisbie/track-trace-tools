import { IMetrcFacilityData } from "@/interfaces";

export function getLicenseFromNameOrError(name: string): string {
    const pieces = name.split("|");

    if (pieces.length !== 2) {
        throw new Error("Bad facility name format");
    }

    return pieces[pieces.length - 1].trim();
}

/**
 * Metrc tends to identify facilitys as FacilityName | LicenseNumber, this replicate that behavior
 * 
 * @param facility 
 * @returns 
 */
export function facilitySummary(facility: IMetrcFacilityData | null): string {
    return facility ? `${facility.FacilityName} | ${facility.LicenseNumber}` : "";
}
