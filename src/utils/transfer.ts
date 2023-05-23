import {
  IDestinationData,
  IDestinationPackageData,
  IIndexedTransferData,
  IMetrcDriverData,
  IMetrcFacilityData,
  IMetrcVehicleData,
  ITransferHistoryData,
  ITransferPackageList,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { OAuthState } from "@/store/page-overlay/modules/plugin-auth/consts";
import { ITransferBuilderState } from "@/store/page-overlay/modules/transfer-builder/interfaces";
import { createScanSheetOrError } from "./sheets-export";

const DRIVER_NAME_MATCHER = /^- Driver Name: (.+)$/;
const DRIVER_EMPLOYEE_ID_MATCHER = /^- Driver Employee ID: (.+)$/;
const DRIVER_LICENSE_NUMBER_MATCHER = /^- Driver's License Number: (.+)$/;
const VEHICLE_MATCHER = /^- Vehicle Make Model \(Lic. No.\): (.+) \((.+)\)$/;

// export function getActiveTransferPackageListOrNull({
//   state,
//   identity,
//   license,
// }: {
//   state: ITransferBuilderState;
//   identity: string;
//   license: string;
// }): ITransferPackageList | null {
//   return (
//     state.transferPackageLists.find(
//       (list) => list.license === license && list.identity === identity
//     ) || null
//   );
// }

export async function extractRecentDestinationFacilitiesFromTransfers(): Promise<
  IMetrcFacilityData[]
> {
  const outgoingTransfers = await primaryDataLoader.outgoingTransfers();

  const facilityMap: Map<string, IMetrcFacilityData> = await dynamicConstsManager.facilityMap();

  const recentDestinationFacilities: IMetrcFacilityData[] = [];

  const recentDestinationFacilitiesSet = new Set<string>();

  for (let outgoingTransfer of outgoingTransfers) {
    // DeliveryFacilities: "CCL20-0002194 (QCSC, LLC)"
    const destinationFacilityLicenseMatch = outgoingTransfer.DeliveryFacilities.match(/^[^\s]+/);

    if (destinationFacilityLicenseMatch) {
      const destinationFacilityLicense: string = destinationFacilityLicenseMatch[0];

      if (!destinationFacilityLicense) {
        console.error("outgoingTransfer.DeliveryFacilities", outgoingTransfer.DeliveryFacilities);
        continue;
      }

      const destinationFacility = facilityMap.get(destinationFacilityLicense);

      if (destinationFacility && !recentDestinationFacilitiesSet.has(destinationFacilityLicense)) {
        recentDestinationFacilitiesSet.add(destinationFacilityLicense);

        recentDestinationFacilities.push(destinationFacility);
      }
    }
  }

  return recentDestinationFacilities;
}

export async function extractRecentTransporterFacilitiesFromTransfers(): Promise<
  IMetrcFacilityData[]
> {
  const outgoingTransfers = await primaryDataLoader.outgoingTransfers();

  const facilityMap: Map<string, IMetrcFacilityData> = await dynamicConstsManager.facilityMap();

  const recentTransporterFacilities: IMetrcFacilityData[] = [];

  const recentTransporterFacilitiesSet = new Set<string>();

  for (let outgoingTransfer of outgoingTransfers) {
    // ShipperFacilityLicenseNumber: "C12-0000020-LIC"
    const transporterFacilityLicenseMatch =
      outgoingTransfer.ShipperFacilityLicenseNumber.match(/^[^\s]+/);
    if (transporterFacilityLicenseMatch) {
      const transporterFacilityLicense: string = transporterFacilityLicenseMatch[0];

      if (!transporterFacilityLicense) {
        console.error(
          "outgoingTransfer.ShipperFacilityLicenseNumber",
          outgoingTransfer.ShipperFacilityLicenseNumber
        );
        continue;
      }

      const transporterFacility = facilityMap.get(transporterFacilityLicense);

      if (transporterFacility && !recentTransporterFacilitiesSet.has(transporterFacilityLicense)) {
        recentTransporterFacilitiesSet.add(transporterFacilityLicense);

        recentTransporterFacilities.push(transporterFacility);
      }
    }
  }

  return recentTransporterFacilities;
}

export async function extractDriversAndVehiclesFromTransferHistory(): Promise<{
  drivers: IMetrcDriverData[];
  vehicles: IMetrcVehicleData[];
}> {
  const outgoingTransfers = await primaryDataLoader.outgoingTransfers();

  const drivers: IMetrcDriverData[] = [];
  const vehicles: IMetrcVehicleData[] = [];

  // Limit this to 25 requests
  for (let transfer of outgoingTransfers.slice(0, 25)) {
    const historyList: ITransferHistoryData[] =
      await primaryDataLoader.transferHistoryByOutGoingTransferId(transfer.Id);

    for (const history of historyList) {
      let vehicleMatch = null;
      let driverNameMatch = null;
      let driverEmployeeIdMatch = null;
      let driverLicenseNumberMatch = null;

      for (const description of history.Descriptions) {
        vehicleMatch = description.match(VEHICLE_MATCHER);

        if (vehicleMatch) {
          const [VehicleMake, ...model] = vehicleMatch[1].split(/\s+/);

          vehicles.push({
            VehicleMake,
            VehicleModel: model.join(" "),
            VehicleLicensePlateNumber: vehicleMatch[2],
          });

          vehicleMatch = null;

          continue;
        }

        let currentDriverNameMatch;
        let currentDriverEmployeeIdMatch;
        let currentDriverLicenseNumberMatch;

        // This is designed to minimize regex tests
        if ((currentDriverNameMatch = description.match(DRIVER_NAME_MATCHER))) {
          driverNameMatch = currentDriverNameMatch;
        } else if ((currentDriverEmployeeIdMatch = description.match(DRIVER_EMPLOYEE_ID_MATCHER))) {
          driverEmployeeIdMatch = currentDriverEmployeeIdMatch;
        } else if (
          (currentDriverLicenseNumberMatch = description.match(DRIVER_LICENSE_NUMBER_MATCHER))
        ) {
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

          continue;
        }
      }
    }
  }

  return { drivers, vehicles };
}

export async function createScanSheet(transferId: number, manifestNumber: string) {
  if (!clientBuildManager.assertValues(["ENABLE_T3PLUS"])) {
    toastManager.openToast(
      "This feature is only availble for T3+ users. Learn more at trackandtrace.tools/plus",
      {
        title: "T3+ Required",
        autoHideDelay: 5000,
        variant: "warning",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
        href: "https://trackandtrace.tools/plus",
      }
    );

    return;
  }

  if (store.state.pluginAuth.oAuthState !== OAuthState.AUTHENTICATED) {
    toastManager.openToast(
      "You must sign in to your Google account to create scan sheets. Click the Track & Trace Tools icon in the browser toolbar to log in.",
      {
        title: "Google Sign-in Required",
        autoHideDelay: 5000,
        variant: "warning",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      }
    );

    return;
  }

  toastManager.openToast("Creating scan sheet...", {
    title: "T3",
    autoHideDelay: 2000,
    variant: "primary",
    appendToast: true,
    toaster: "ttt-toaster",
    solid: true,
  });

  try {
    const manifest: {
      pkg: IDestinationPackageData;
      destination?: IDestinationData;
      incomingTransfer?: IIndexedTransferData;
    }[] = await primaryDataLoader.transferDestinations(transferId).then(async (destinations) => {
      let packages: {
        pkg: IDestinationPackageData;
        destination?: IDestinationData;
        incomingTransfer?: IIndexedTransferData;
      }[] = [];

      // This is an incoming transfer, use the DeliveryId instead
      if (destinations.length === 0) {
        let incomingTransfer: IIndexedTransferData | null = null;

        incomingTransfer = await primaryDataLoader.incomingTransfer(manifestNumber);
        if (!incomingTransfer) {
          incomingTransfer = await primaryDataLoader.incomingInactiveTransfer(manifestNumber);
        }

        if (!incomingTransfer) {
          throw new Error("Unable to match incoming transfer");
        }

        packages = packages.concat(
          (await primaryDataLoader.destinationPackages(incomingTransfer!.DeliveryId)).map(
            (pkg) => ({
              pkg,
              incomingTransfer: incomingTransfer!,
            })
          )
        );
      } else {
        for (const destination of destinations) {
          packages = packages.concat(
            (await primaryDataLoader.destinationPackages(destination.Id)).map((pkg) => ({
              pkg,
              destination,
            }))
          );
        }
      }

      return packages;
    });

    if (manifest.find((x) => !x.destination && !x.incomingTransfer)) {
      throw new Error("Cannot generate scan sheet with no destination information");
    }

    const spreadsheet = await createScanSheetOrError(
      manifestNumber,
      (
        await authManager.authStateOrError()
      ).license,
      manifest
    );

    window.open(spreadsheet.spreadsheetUrl, "_blank");
  } catch (e) {
    toastManager.openToast((e as Error).toString(), {
      title: "Failed to create scan sheet",
      autoHideDelay: 2000,
      variant: "primary",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  }
}
