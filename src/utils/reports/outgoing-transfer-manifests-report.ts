import { IIndexedRichOutgoingTransferData, IPluginState, ITransferFilter } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportType, ReportsMutations } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";

interface IOutgoingTransferManifestsReportFormFilters {
  estimatedDepartureDateLt: string;
  estimatedDepartureDateGt: string;
  shouldFilterEstimatedDepartureDateLt: boolean;
  shouldFilterEstimatedDepartureDateGt: boolean;
  onlyWholesale: boolean;
  includeOutgoing: boolean;
  includeRejected: boolean;
  includeOutgoingInactive: boolean;
}

export const outgoingTransferManifestsFormFiltersFactory: () => IOutgoingTransferManifestsReportFormFilters =
  () => ({
    estimatedDepartureDateLt: todayIsodate(),
    estimatedDepartureDateGt: todayIsodate(),
    shouldFilterEstimatedDepartureDateLt: false,
    shouldFilterEstimatedDepartureDateGt: false,
    onlyWholesale: false,
    includeOutgoing: true,
    includeRejected: true,
    includeOutgoingInactive: false,
  });

export function addOutgoingTransferManifestsReport({
  reportConfig,
  outgoingTransferManifestsFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  outgoingTransferManifestsFormFilters: IOutgoingTransferManifestsReportFormFilters;
  fields: IFieldData[];
}) {
  const transferFilter: ITransferFilter = {};

  transferFilter.onlyWholesale = outgoingTransferManifestsFormFilters.onlyWholesale;
  transferFilter.includeOutgoing = outgoingTransferManifestsFormFilters.includeOutgoing;
  transferFilter.includeRejected = outgoingTransferManifestsFormFilters.includeRejected;
  transferFilter.includeOutgoingInactive =
    outgoingTransferManifestsFormFilters.includeOutgoingInactive;

  transferFilter.estimatedDepartureDateGt =
    outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt
      ? outgoingTransferManifestsFormFilters.estimatedDepartureDateGt
      : null;

  transferFilter.estimatedDepartureDateLt =
    outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
      ? outgoingTransferManifestsFormFilters.estimatedDepartureDateLt
      : null;

  reportConfig[ReportType.OUTGOING_TRANSFER_MANIFESTS] = {
    transferFilter,
    fields,
  };
}

export async function maybeLoadOutgoingTransferManifestsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const transferManifestConfig = reportConfig[ReportType.OUTGOING_TRANSFER_MANIFESTS];
  if (transferManifestConfig?.transferFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading transfer manifest packages...", level: "success" },
    });

    let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

    if (transferManifestConfig.transferFilter.includeOutgoing) {
      richOutgoingTransfers = [
        ...(await primaryDataLoader.outgoingTransfers()),
        ...richOutgoingTransfers,
      ];
    }

    if (transferManifestConfig.transferFilter.includeRejected) {
      richOutgoingTransfers = [
        ...(await primaryDataLoader.rejectedTransfers()),
        ...richOutgoingTransfers,
      ];
    }

    if (transferManifestConfig.transferFilter.includeOutgoingInactive) {
      richOutgoingTransfers = [
        ...(await primaryDataLoader.outgoingInactiveTransfers()),
        ...richOutgoingTransfers,
      ];
    }

    richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => {
      if (transferManifestConfig.transferFilter.estimatedDepartureDateLt) {
        if (
          transfer.CreatedDateTime > transferManifestConfig.transferFilter.estimatedDepartureDateLt
        ) {
          return false;
        }
      }

      if (transferManifestConfig.transferFilter.estimatedDepartureDateGt) {
        if (
          transfer.LastModified < transferManifestConfig.transferFilter.estimatedDepartureDateGt
        ) {
          return false;
        }
      }

      return true;
    });

    const promises: Promise<any>[] = [];

    for (const transfer of richOutgoingTransfers) {
      if (promises.length % 100 === 0) {
        await Promise.allSettled(promises);
      }

      promises.push(
        primaryDataLoader.transferDestinations(transfer.Id).then((outgoingDestinations) => {
          transfer.outgoingDestinations = outgoingDestinations;
        })
      );

      promises.push(
        primaryDataLoader.transferTransporterDetails(transfer.Id).then((transporterDetails) => {
          transfer.transporterDetails = transporterDetails;
        })
      );
    }

    await Promise.allSettled(promises);

    for (const transfer of richOutgoingTransfers) {
      for (const destination of transfer.outgoingDestinations!) {
        if (promises.length % 100 === 0) {
          await Promise.allSettled(promises);
        }

        promises.push(
          primaryDataLoader.destinationPackages(destination.Id).then((packages) => {
            destination.packages = packages;
          })
        );
        promises.push(
          primaryDataLoader.destinationTransporters(destination.Id).then((transporters) => {
            destination.transporters = transporters;
          })
        );
      }
    }

    await Promise.allSettled(promises);

    for (const transfer of richOutgoingTransfers) {
      transfer.outgoingDestinations = transfer.outgoingDestinations!.filter((destination) => {
        if (transferManifestConfig.transferFilter.onlyWholesale) {
          if (!destination.ShipmentTypeName.includes("Wholesale")) {
            return false;
          }
        }

        if (transferManifestConfig.transferFilter.estimatedDepartureDateLt) {
          if (
            destination.EstimatedDepartureDateTime >
            transferManifestConfig.transferFilter.estimatedDepartureDateLt
          ) {
            return false;
          }
        }

        if (transferManifestConfig.transferFilter.estimatedDepartureDateGt) {
          if (
            destination.EstimatedDepartureDateTime <
            transferManifestConfig.transferFilter.estimatedDepartureDateGt
          ) {
            return false;
          }
        }

        return true;
      });
    }

    richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => true);

    reportData[ReportType.OUTGOING_TRANSFER_MANIFESTS] = {
      richOutgoingTransfers,
    };
  }
}
