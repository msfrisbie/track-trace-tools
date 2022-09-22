import { IMetrcDriverData, IMetrcFacilityData, IMetrcVehicleData, ITransferHistoryData, ITransferPackageList } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { ITransferBuilderState } from "@/store/page-overlay/modules/transfer-builder/interfaces";

const DRIVER_NAME_MATCHER = /^- Driver Name: (.+)$/;
const DRIVER_EMPLOYEE_ID_MATCHER = /^- Driver Employee ID: (.+)$/;
const DRIVER_LICENSE_NUMBER_MATCHER = /^- Driver's License Number: (.+)$/;
const VEHICLE_MATCHER = /^- Vehicle Make Model \(Lic. No.\): (.+) \((.+)\)$/;

export function getActiveTransferPackageListOrNull({ state, identity, license }: { state: ITransferBuilderState, identity: string, license: string }): ITransferPackageList | null {
    return state.transferPackageLists.find((list) => list.license === license && list.identity === identity) || null;
}

export async function extractRecentDestinationFacilitiesFromTransfers(): Promise<IMetrcFacilityData[]> {
    const outgoingTransfers = await primaryDataLoader.outgoingTransfers();

    const facilityMap: Map<string, IMetrcFacilityData> =
        await dynamicConstsManager.facilityMap();

    const recentDestinationFacilities: IMetrcFacilityData[] = [];

    const recentDestinationFacilitiesSet = new Set<string>();

    for (let outgoingTransfer of outgoingTransfers) {
        // DeliveryFacilities: "CCL20-0002194 (QCSC, LLC)"
        const destinationFacilityLicenseMatch =
            outgoingTransfer.DeliveryFacilities.match(/^[^\s]+/);

        if (destinationFacilityLicenseMatch) {
            const destinationFacilityLicense: string =
                destinationFacilityLicenseMatch[0];

            if (!destinationFacilityLicense) {
                console.error(
                    "outgoingTransfer.DeliveryFacilities",
                    outgoingTransfer.DeliveryFacilities
                );
                continue;
            }

            const destinationFacility = facilityMap.get(
                destinationFacilityLicense
            );

            if (
                destinationFacility &&
                !recentDestinationFacilitiesSet.has(destinationFacilityLicense)
            ) {
                recentDestinationFacilitiesSet.add(destinationFacilityLicense);

                recentDestinationFacilities.push(destinationFacility);
            }
        }
    }

    return recentDestinationFacilities;
}

export async function extractRecentTransporterFacilitiesFromTransfers(): Promise<IMetrcFacilityData[]> {
    const outgoingTransfers = await primaryDataLoader.outgoingTransfers();

    const facilityMap: Map<string, IMetrcFacilityData> =
        await dynamicConstsManager.facilityMap();

    const recentTransporterFacilities: IMetrcFacilityData[] = [];

    const recentTransporterFacilitiesSet = new Set<string>();

    for (let outgoingTransfer of outgoingTransfers) {
        // ShipperFacilityLicenseNumber: "C12-0000020-LIC"
        const transporterFacilityLicenseMatch =
            outgoingTransfer.ShipperFacilityLicenseNumber.match(/^[^\s]+/);
        if (transporterFacilityLicenseMatch) {
            const transporterFacilityLicense: string =
                transporterFacilityLicenseMatch[0];

            if (!transporterFacilityLicense) {
                console.error(
                    "outgoingTransfer.ShipperFacilityLicenseNumber",
                    outgoingTransfer.ShipperFacilityLicenseNumber
                );
                continue;
            }

            const transporterFacility = facilityMap.get(
                transporterFacilityLicense
            );

            if (
                transporterFacility &&
                !recentTransporterFacilitiesSet.has(transporterFacilityLicense)
            ) {
                recentTransporterFacilitiesSet.add(transporterFacilityLicense);

                recentTransporterFacilities.push(transporterFacility);
            }
        }
    }

    return recentTransporterFacilities;
}

export async function extractDriversAndVehiclesFromTransferHistory(): Promise<{ drivers: IMetrcDriverData[], vehicles: IMetrcVehicleData[] }> {
    const outgoingTransfers = await primaryDataLoader.outgoingTransfers();

    const drivers: IMetrcDriverData[] = [];
    const vehicles: IMetrcVehicleData[] = [];

    // Limit this to 25 requests
    for (let transfer of outgoingTransfers.slice(0, 25)) {
        const historyList: ITransferHistoryData[] = await primaryDataLoader.transferHistoryByOutGoingTransferId(transfer.Id);

        for (const history of historyList) {
            let vehicleMatch = null;
            let driverNameMatch = null;
            let driverEmployeeIdMatch = null;
            let driverLicenseNumberMatch = null;

            for (const description of history.Descriptions) {
                vehicleMatch = description.match(VEHICLE_MATCHER)

                if (vehicleMatch) {
                    const [VehicleMake, ...model] = vehicleMatch[1].split(/\s+/);

                    vehicles.push({
                        VehicleMake,
                        VehicleModel: model.join(' '),
                        VehicleLicensePlateNumber: vehicleMatch[2]
                    });

                    vehicleMatch = null

                    continue;
                }

                let currentDriverNameMatch;
                let currentDriverEmployeeIdMatch;
                let currentDriverLicenseNumberMatch;

                // This is designed to minimize regex tests
                if (currentDriverNameMatch = description.match(DRIVER_NAME_MATCHER)) {
                    driverNameMatch = currentDriverNameMatch;
                } else if (currentDriverEmployeeIdMatch = description.match(DRIVER_EMPLOYEE_ID_MATCHER)) {
                    driverEmployeeIdMatch = currentDriverEmployeeIdMatch;
                } else if (currentDriverLicenseNumberMatch = description.match(DRIVER_LICENSE_NUMBER_MATCHER)) {
                    driverLicenseNumberMatch = currentDriverLicenseNumberMatch;
                }

                if (driverNameMatch && driverEmployeeIdMatch && driverLicenseNumberMatch) {
                    drivers.push({
                        DriverName: driverNameMatch[1],
                        DriverOccupationalLicenseNumber: driverEmployeeIdMatch[1],
                        DriverVehicleLicenseNumber: driverLicenseNumberMatch[1],
                    });

                    driverNameMatch = null;
                    driverEmployeeIdMatch = null;
                    driverLicenseNumberMatch = null;

                    continue
                }
            }
        }
    }

    return { drivers, vehicles };
}