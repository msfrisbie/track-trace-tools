import { TransferState } from "@/consts";
import { IIndexedTransferData, IPluginState } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
    IReportConfig,
    IReportData,
    IReportsState
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import {
    getGrossWeightOrError,
    getItemCategoryOrError,
    getItemNameOrError,
    getItemStrainOrError, getLabelOrError, getLabTestingStateOrError, getQuantityOrError,
    getSourceHarvestNamesOrError,
    getSourcePackageLabelsOrError,
    getUnitOfMeasureAbbreviationOrError,
    getWholesalePriceOrError
} from "../package";
import { generateTransferMetadata } from "../transfer";

export async function maybeLoadSingleTransferReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const config = reportConfig[ReportType.SINGLE_TRANSFER];

  if (config) {
    let matchedTransfer: IIndexedTransferData | null = null;

    const handler = (transfer: IIndexedTransferData) => {
      console.log({ transfer });
      if (transfer && !matchedTransfer) {
        matchedTransfer = transfer;
      }
    };

    await Promise.allSettled([
      primaryDataLoader.incomingTransfer(config.manifestNumber).then(handler),
      primaryDataLoader.incomingInactiveTransfer(config.manifestNumber).then(handler),
      primaryDataLoader.outgoingTransfer(config.manifestNumber).then(handler),
      primaryDataLoader.outgoingInactiveTransfer(config.manifestNumber).then(handler),
      primaryDataLoader.rejectedTransfer(config.manifestNumber).then(handler),
    ]);

    // For some reason
    if (!matchedTransfer) {
      await primaryDataLoader.layoverTransfer(config.manifestNumber).then(handler);
    }

    if (!matchedTransfer) {
      toastManager.error("Could not match manifest number");
      return;
    }

    // The ts compiler doesn't understand the handler assigns a value
    const transfer: IIndexedTransferData = matchedTransfer;

    const singleTransferMatrix: any[][] = [];

    const transferMetadata = await generateTransferMetadata({
      transfer,
      loadPackageTestData: false,
    });

    switch (transfer.TransferState) {
      case TransferState.INCOMING:
      case TransferState.INCOMING_INACTIVE:
        singleTransferMatrix.push(
          ["Manifest", transfer.ManifestNumber],
          ["Origin", transfer.ShipperFacilityName],
          ["Origin License", transfer.ShipperFacilityLicenseNumber],
          ["Destination", transfer.RecipientFacilityName],
          ["Destination License", transfer.RecipientFacilityLicenseNumber],
          ["Total Packages", transferMetadata.packages.length],
          [
            "Total Wholesale Value",
            transferMetadata.packages
              .map((x) => getWholesalePriceOrError(x) ?? 0)
              .reduce((a, b) => a + b, 0),
          ],
          [],
          [
            "Package",
            "Source Harvest(s)",
            "Source Package(s)",
            "Item Name",
            "Item Category",
            "Item Strain",
            "Lab Testing State",
            "Quantity",
            "Unit of Measure",
            "Gross Weight",
            "Wholesale Price",
          ]
        );

        // Packages is complete list, no destination
        for (const pkg of transferMetadata.packages) {
          singleTransferMatrix.push([
            getLabelOrError(pkg),
            getSourceHarvestNamesOrError(pkg),
            getSourcePackageLabelsOrError(pkg),
            getItemNameOrError(pkg),
            getItemCategoryOrError(pkg),
            getItemStrainOrError(pkg),
            getLabTestingStateOrError(pkg),
            getQuantityOrError(pkg),
            getUnitOfMeasureAbbreviationOrError(pkg),
            getGrossWeightOrError(pkg),
            getWholesalePriceOrError(pkg),
          ]);
        }

        break;
      case TransferState.OUTGOING:
      case TransferState.REJECTED:
      case TransferState.OUTGOING_INACTIVE:
        // Destination-by-destination

        singleTransferMatrix.push(
          ["Manifest", transfer.ManifestNumber],
          ["Origin", transfer.ShipperFacilityName],
          ["Origin License", transfer.ShipperFacilityLicenseNumber],
          ["Total Packages", transferMetadata.packages.length],
          [
            "Total Wholesale Value",
            transferMetadata.packages
              .map((x) => getWholesalePriceOrError(x) ?? 0)
              .reduce((a, b) => a + b, 0),
          ],
          [],
          [
            "Destination",
            "Destination License",
            "Package",
            "Source Harvest(s)",
            "Source Package(s)",
            "Item Name",
            "Item Category",
            "Item Strain",
            "Lab Testing State",
            "Quantity",
            "Unit of Measure",
            "Gross Weight",
            "Wholesale Price",
          ]
        );

        for (const destination of transferMetadata.destinations) {
          for (const pkg of destination.packages!) {
            singleTransferMatrix.push([
              destination.RecipientFacilityName,
              destination.RecipientFacilityLicenseNumber,
              getLabelOrError(pkg),
              getSourceHarvestNamesOrError(pkg),
              getSourcePackageLabelsOrError(pkg),
              getItemNameOrError(pkg),
              getItemCategoryOrError(pkg),
              getItemStrainOrError(pkg),
              getLabTestingStateOrError(pkg),
              getQuantityOrError(pkg),
              getUnitOfMeasureAbbreviationOrError(pkg),
              getGrossWeightOrError(pkg),
              getWholesalePriceOrError(pkg),
            ]);
          }
        }
        break;
      case TransferState.LAYOVER:
      default:
        throw new Error(`Bad transfer type: ${transfer.TransferState}`);
    }

    reportData[ReportType.SINGLE_TRANSFER] = {
      singleTransferMatrix,
    };
  }
}

export function extractSingleTransferData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  return reportData[ReportType.SINGLE_TRANSFER]!.singleTransferMatrix;
}

export async function createSingleTransferReportOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<any> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.SINGLE_TRANSFER]) {
    throw new Error("Missing single transfer data");
  }
}
