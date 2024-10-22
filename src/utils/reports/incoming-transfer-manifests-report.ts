import { IIndexedRichIncomingTransferData, IPluginState, ITransferFilter } from "@/interfaces";
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

interface IIncomingTransferManifestsReportFormFilters {
  estimatedArrivalDateLt: string;
  estimatedArrivalDateGt: string;
  shouldFilterEstimatedArrivalDateLt: boolean;
  shouldFilterEstimatedArrivalDateGt: boolean;
  onlyWholesale: boolean;
  includeIncoming: boolean;
  includeIncomingInactive: boolean;
}

export const incomingTransferManifestsFormFiltersFactory: () => IIncomingTransferManifestsReportFormFilters =
  () => ({
    estimatedArrivalDateLt: todayIsodate(),
    estimatedArrivalDateGt: todayIsodate(),
    includeIncoming: true,
    includeIncomingInactive: false,
    onlyWholesale: false,
    shouldFilterEstimatedArrivalDateLt: false,
    shouldFilterEstimatedArrivalDateGt: false,
  });

export function addIncomingTransferManifestsReport({
  reportConfig,
  incomingTransferManifestsFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  incomingTransferManifestsFormFilters: IIncomingTransferManifestsReportFormFilters;
  fields: IFieldData[];
}) {
  const transferFilter: ITransferFilter = {};

  transferFilter.onlyWholesale = incomingTransferManifestsFormFilters.onlyWholesale;
  transferFilter.includeIncoming = incomingTransferManifestsFormFilters.includeIncoming;
  transferFilter.includeIncomingInactive =
    incomingTransferManifestsFormFilters.includeIncomingInactive;

  transferFilter.estimatedArrivalDateGt =
    incomingTransferManifestsFormFilters.shouldFilterEstimatedArrivalDateGt
      ? incomingTransferManifestsFormFilters.estimatedArrivalDateGt
      : null;

  transferFilter.estimatedArrivalDateLt =
    incomingTransferManifestsFormFilters.shouldFilterEstimatedArrivalDateLt
      ? incomingTransferManifestsFormFilters.estimatedArrivalDateLt
      : null;

  reportConfig[ReportType.INCOMING_TRANSFER_MANIFESTS] = {
    transferFilter,
    fields,
  };
}

export async function maybeLoadIncomingTransferManifestsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const transferManifestConfig = reportConfig[ReportType.INCOMING_TRANSFER_MANIFESTS];
  if (transferManifestConfig?.transferFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading transfer manifest packages...", level: "success" },
    });

    let richIncomingTransfers: IIndexedRichIncomingTransferData[] = [];

    if (transferManifestConfig.transferFilter.includeIncoming) {
      richIncomingTransfers = [
        ...(await primaryDataLoader.incomingTransfers()),
        ...richIncomingTransfers,
      ];
    }

    if (transferManifestConfig.transferFilter.includeIncomingInactive) {
      richIncomingTransfers = [
        ...(await primaryDataLoader.incomingInactiveTransfers()),
        ...richIncomingTransfers,
      ];
    }

    richIncomingTransfers = richIncomingTransfers.filter((transfer) => {
      if (transferManifestConfig.transferFilter.onlyWholesale) {
        if (!transfer.ShipmentTypeName.includes("Wholesale")) {
          return false;
        }
      }

      if (transferManifestConfig.transferFilter.estimatedArrivalDateLt) {
        if (
          transfer.CreatedDateTime > transferManifestConfig.transferFilter.estimatedArrivalDateLt
        ) {
          return false;
        }
      }

      if (transferManifestConfig.transferFilter.estimatedArrivalDateGt) {
        if (transfer.LastModified < transferManifestConfig.transferFilter.estimatedArrivalDateGt) {
          return false;
        }
      }

      return true;
    });

    const promises: Promise<any>[] = [];

    for (const transfer of richIncomingTransfers) {
      if (promises.length % 100 === 0) {
        await Promise.allSettled(promises);
      }

      promises.push(
        primaryDataLoader
          .destinationTransporters(transfer.DeliveryId)
          .then((incomingTransporters) => {
            transfer.incomingTransporters = incomingTransporters;
          })
      );

      promises.push(
        primaryDataLoader.destinationPackages(transfer.DeliveryId).then((incomingPackages) => {
          transfer.incomingPackages = incomingPackages;
        })
      );
    }

    await Promise.allSettled(promises);

    reportData[ReportType.INCOMING_TRANSFER_MANIFESTS] = {
      richIncomingTransfers,
    };
  }
}
