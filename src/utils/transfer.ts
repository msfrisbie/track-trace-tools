import { TransferPackageSearchAlgorithm, TransferState } from "@/consts";
import {
  IDestinationData,
  IDestinationPackageData,
  IIndexedRichOutgoingTransferData,
  IIndexedTransferData,
  IMetrcDriverData,
  IMetrcFacilityData,
  IMetrcVehicleData,
  IRichDestinationData,
  ITransferHistoryData,
  ITransferMetadata,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import {
  getDataLoaderByLicense,
  primaryDataLoader,
} from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { OAuthState } from "@/store/page-overlay/modules/plugin-auth/consts";
import {
  getIdOrError,
  getItemNameOrError,
  getLabTestResultsFromPackage,
  getLabelOrError,
} from "./package";
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

  for (const outgoingTransfer of outgoingTransfers) {
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

  for (const outgoingTransfer of outgoingTransfers) {
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
  for (const transfer of outgoingTransfers.slice(0, 25)) {
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
          const [Make, ...model] = vehicleMatch[1].split(/\s+/);

          vehicles.push({
            Make,
            Model: model.join(" "),
            LicensePlateNumber: vehicleMatch[2],
            Id: -1,
            FacilityId: -1,
            IsArchived: false,
            LastModified: "",
          });

          vehicleMatch = null;

          continue;
        }

        let currentDriverNameMatch;
        let currentDriverEmployeeIdMatch;
        let currentDriverLicenseNumberMatch;

        // This is designed to minimize regex tests
        if (currentDriverNameMatch === description.match(DRIVER_NAME_MATCHER)) {
          driverNameMatch = currentDriverNameMatch;
        } else if (currentDriverEmployeeIdMatch === description.match(DRIVER_EMPLOYEE_ID_MATCHER)) {
          driverEmployeeIdMatch = currentDriverEmployeeIdMatch;
        } else if (
          currentDriverLicenseNumberMatch === description.match(DRIVER_LICENSE_NUMBER_MATCHER)
        ) {
          driverLicenseNumberMatch = currentDriverLicenseNumberMatch;
        }

        if (driverNameMatch && driverEmployeeIdMatch && driverLicenseNumberMatch) {
          drivers.push({
            Name: driverNameMatch[1],
            EmployeeId: driverEmployeeIdMatch[1],
            DriversLicenseNumber: driverLicenseNumberMatch[1],
            Id: -1,
            FacilityId: -1,
            IsArchived: false,
            LastModified: "",
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
  if (!store.state.client.values.ENABLE_T3PLUS && !store.state.client.t3plus) {
    toastManager.openToast(
      "This feature is only availble for T3+ users. Click here to learn more.",
      {
        title: "T3+",
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
    autoHideDelay: 10000,
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

        await Promise.allSettled([
          primaryDataLoader.incomingTransfer(manifestNumber).then((transfer) => {
            incomingTransfer = transfer;
          }),
          primaryDataLoader.incomingInactiveTransfer(manifestNumber).then((transfer) => {
            incomingTransfer = transfer;
          }),
          primaryDataLoader.layoverTransfer(manifestNumber).then((transfer) => {
            incomingTransfer = transfer;
          }),
        ]);

        if (!incomingTransfer) {
          throw new Error("Unable to match incoming transfer");
        }

        packages = packages.concat(
          // @ts-ignore
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

export async function findMatchingTransferPackages({
  queryString,
  startDate,
  licenses,
  signal,
  algorithm,
  updateFn,
}: {
  queryString: string;
  startDate: string | null;
  licenses: string[];
  signal: AbortSignal;
  algorithm: TransferPackageSearchAlgorithm;
  updateFn?: (transfers: IIndexedRichOutgoingTransferData[]) => void;
}): Promise<IIndexedRichOutgoingTransferData[]> {
  let allTransfers: IIndexedTransferData[] = [];
  let matchingRichTransfers: IIndexedRichOutgoingTransferData[] = [];

  let promises: Promise<any>[] = [];

  for (const license of licenses) {
    if (signal.aborted) {
      return matchingRichTransfers;
    }

    const dataLoader = await getDataLoaderByLicense(license);

    promises.push(
      dataLoader.outgoingInactiveTransfers().then((transfers) => {
        allTransfers = [...allTransfers, ...transfers];
      })
    );

    promises.push(
      dataLoader.rejectedTransfers().then((transfers) => {
        allTransfers = [...allTransfers, ...transfers];
      })
    );
  }

  await Promise.allSettled(promises);

  promises = [];

  if (startDate) {
    allTransfers = allTransfers.filter((transfer) => transfer.CreatedDateTime >= startDate);
  }

  allTransfers.sort((a, b) => a.CreatedDateTime.localeCompare(b.CreatedDateTime));

  switch (algorithm) {
    case TransferPackageSearchAlgorithm.NEW_TO_OLD:
      allTransfers.reverse();
      break;
    case TransferPackageSearchAlgorithm.OLD_TO_NEW:
      break;
    default:
      break;
  }

  let pageIdx = 0;
  const PAGE_SIZE = 10;

  while (true) {
    const richTransferPage: IIndexedRichOutgoingTransferData[] = allTransfers.slice(
      pageIdx,
      pageIdx + PAGE_SIZE
    );
    if (richTransferPage.length === 0) {
      break;
    }
    pageIdx += PAGE_SIZE;

    for (const transfer of richTransferPage) {
      if (signal.aborted) {
        return matchingRichTransfers;
      }

      const dataLoader = await getDataLoaderByLicense(transfer.LicenseNumber);

      promises.push(
        dataLoader.transferDestinations(transfer.Id).then((destinations) => {
          transfer.outgoingDestinations = (destinations as IRichDestinationData[]).map((x) => {
            x.packages = [];
            return x;
          });
        })
      );
    }

    await Promise.allSettled(promises);

    promises = [];

    for (const transfer of richTransferPage) {
      for (const destination of transfer.outgoingDestinations!) {
        if (signal.aborted) {
          return matchingRichTransfers;
        }

        const dataLoader = await getDataLoaderByLicense(transfer.LicenseNumber);

        promises.push(
          dataLoader.destinationPackages(destination.Id).then((packages) => {
            destination.packages = packages.filter((pkg) => {
              const normalizedQueryString = queryString.toLocaleLowerCase();

              if (getLabelOrError(pkg).toLocaleLowerCase().includes(normalizedQueryString)) {
                return true;
              }

              if (getItemNameOrError(pkg).toLocaleLowerCase().includes(normalizedQueryString)) {
                return true;
              }

              return false;
            });
          })
        );
      }
    }

    await Promise.allSettled(promises);

    for (const transfer of richTransferPage) {
      transfer.outgoingDestinations = transfer.outgoingDestinations!.filter(
        (x) => x.packages!.length > 0
      );
    }

    matchingRichTransfers = [
      ...matchingRichTransfers,
      ...richTransferPage.filter((x) => x.outgoingDestinations!.length > 0),
    ];

    if (updateFn) {
      updateFn(matchingRichTransfers);
    }
  }

  return matchingRichTransfers;
}

export async function generateTransferMetadata({
  transfer,
  loadPackageTestData,
}: {
  transfer: IIndexedTransferData;
  loadPackageTestData: boolean;
}): Promise<ITransferMetadata> {
  const authState = await authManager.authStateOrError();

  const promises: Promise<any>[] = [];

  const transferMetadata: ITransferMetadata = {
    destinations: [],
    packages: [],
    packagesTestResults: [],
  };

  switch (transfer.TransferState) {
    case TransferState.INCOMING:
    case TransferState.INCOMING_INACTIVE:
      const packages = await primaryDataLoader.destinationPackages(transfer.DeliveryId);

      transferMetadata.packages.push(...packages);
      break;
    case TransferState.OUTGOING:
    case TransferState.REJECTED:
    case TransferState.OUTGOING_INACTIVE:
      transferMetadata.destinations = await primaryDataLoader.transferDestinations(transfer.Id);
      for (const destination of transferMetadata.destinations) {
        const packages = await primaryDataLoader.destinationPackages(destination.Id);

        destination.packages = packages;
        destination.transporters = await primaryDataLoader.destinationTransporters(destination.Id);

        transferMetadata.packages.push(...packages);
      }
      break;
    case TransferState.LAYOVER:
    default:
      return transferMetadata;
  }

  if (loadPackageTestData) {
    const fileIds = new Set<number>();

    for (const pkg of transferMetadata.packages) {
      promises.push(
        getLabTestResultsFromPackage({ pkg }).then((response) => {
          pkg.testResults = response;
        })
      );
    }

    await Promise.allSettled(promises);

    for (const pkg of transferMetadata.packages) {
      for (const testResult of pkg.testResults!) {
        if (testResult.LabTestResultDocumentFileId) {
          fileIds.add(testResult.LabTestResultDocumentFileId);
        }
      }

      const testResultPdfUrls: string[] = [...fileIds].map(
        (fileId) =>
          `${window.location.origin}/filesystem/${
            authState.license
          }/download/labtest/result/document?packageId=${getIdOrError(
            pkg
          )}&labTestResultDocumentFileId=${fileId}`
      );

      transferMetadata.packagesTestResults.push({
        pkg,
        testResults: pkg.testResults!,
        testResultPdfUrls,
      });
    }
  }

  return transferMetadata;
}
