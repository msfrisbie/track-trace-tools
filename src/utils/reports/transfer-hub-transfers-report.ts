import {
  IIndexedRichOutgoingTransferData,
  IPluginState,
  IRichDestinationData,
  ITransferFilter,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { todayIsodate } from "../date";

interface ITransferHubTransfersReportFormFilters {
  estimatedDepartureDateLt: string;
  estimatedDepartureDateGt: string;
  shouldFilterEstimatedDepartureDateLt: boolean;
  shouldFilterEstimatedDepartureDateGt: boolean;
}

export const transferHubTransfersFormFiltersFactory: () => ITransferHubTransfersReportFormFilters =
  () => ({
    estimatedDepartureDateLt: todayIsodate(),
    estimatedDepartureDateGt: todayIsodate(),
    shouldFilterEstimatedDepartureDateLt: false,
    shouldFilterEstimatedDepartureDateGt: false,
  });

export function addTransferHubTransfersReport({
  reportConfig,
  transferHubTransfersFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  transferHubTransfersFormFilters: ITransferHubTransfersReportFormFilters;
  fields: IFieldData[];
}) {
  const transferFilter: ITransferFilter = {};

  transferFilter.estimatedDepartureDateGt =
    transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt
      ? (transferHubTransfersFormFilters.estimatedDepartureDateGt as string)
      : null;

  transferFilter.estimatedDepartureDateLt =
    transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateLt
      ? transferHubTransfersFormFilters.estimatedDepartureDateLt
      : null;

  reportConfig[ReportType.TRANSFER_HUB_TRANSFERS] = {
    transferFilter,
    fields,
  };
}

export async function maybeLoadTransferHubTransfersReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const transferHubTransferConfig = reportConfig[ReportType.TRANSFER_HUB_TRANSFERS];
  if (transferHubTransferConfig?.transferFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading layover transfers...", level: "success" },
    });

    let richTransferHubTransfers: IIndexedRichOutgoingTransferData[] = [];

    richTransferHubTransfers = [
      ...(await primaryDataLoader.layoverTransfers()),
      ...richTransferHubTransfers,
    ];

    richTransferHubTransfers = richTransferHubTransfers.filter((transfer) => {
      if (transferHubTransferConfig.transferFilter.estimatedDepartureDateLt) {
        if (
          transfer.CreatedDateTime >
          transferHubTransferConfig.transferFilter.estimatedDepartureDateLt
        ) {
          return false;
        }
      }

      if (transferHubTransferConfig.transferFilter.estimatedDepartureDateGt) {
        if (
          transfer.LastModified < transferHubTransferConfig.transferFilter.estimatedDepartureDateGt
        ) {
          return false;
        }
      }

      return true;
    });

    for (const transfer of richTransferHubTransfers) {
      const destinations: IRichDestinationData[] = (
        await primaryDataLoader.transferDestinations(transfer.Id)
      ).map((x) => ({ ...x, packages: [] }));

      transfer.outgoingDestinations = destinations.filter((destination) => {
        if (transferHubTransferConfig.transferFilter.estimatedDepartureDateLt) {
          if (
            destination.EstimatedDepartureDateTime >
            transferHubTransferConfig.transferFilter.estimatedDepartureDateLt
          ) {
            return false;
          }
        }

        if (transferHubTransferConfig.transferFilter.estimatedDepartureDateGt) {
          if (
            destination.EstimatedDepartureDateTime <
            transferHubTransferConfig.transferFilter.estimatedDepartureDateGt
          ) {
            return false;
          }
        }

        return true;
      });
    }

    richTransferHubTransfers = richTransferHubTransfers.filter((transfer) => {
      return true;
    });

    reportData[ReportType.TRANSFER_HUB_TRANSFERS] = {
      transferHubTransfers: richTransferHubTransfers,
    };
  }
}
