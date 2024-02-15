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

interface IIncomingManifestInventoryReportFormFilters {
  estimatedArrivalDateLt: string;
  estimatedArrivalDateGt: string;
  shouldFilterEstimatedArrivalDateLt: boolean;
  shouldFilterEstimatedArrivalDateGt: boolean;
}

export const incomingManifestInventoryFormFiltersFactory: () => IIncomingManifestInventoryReportFormFilters =
  () => ({
    estimatedArrivalDateLt: todayIsodate(),
    estimatedArrivalDateGt: todayIsodate(),
    shouldFilterEstimatedArrivalDateLt: false,
    shouldFilterEstimatedArrivalDateGt: false,
  });

export function addIncomingManifestInventoryReport({
  reportConfig,
  incomingManifestInventoryFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  incomingManifestInventoryFormFilters: IIncomingManifestInventoryReportFormFilters;
  fields: IFieldData[];
}) {
  const transferFilter: ITransferFilter = {};

  transferFilter.estimatedArrivalDateGt =
    incomingManifestInventoryFormFilters.shouldFilterEstimatedArrivalDateGt
      ? incomingManifestInventoryFormFilters.estimatedArrivalDateGt
      : null;

  transferFilter.estimatedArrivalDateLt =
    incomingManifestInventoryFormFilters.shouldFilterEstimatedArrivalDateLt
      ? incomingManifestInventoryFormFilters.estimatedArrivalDateLt
      : null;

  reportConfig[ReportType.INCOMING_MANIFEST_INVENTORY] = {
    transferFilter,
    fields,
  };
}

export async function maybeLoadIncomingManifestInventoryReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const transferManifestConfig = reportConfig[ReportType.INCOMING_MANIFEST_INVENTORY];
  if (transferManifestConfig?.transferFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: "Loading transfer manifest packages...", level: "success" },
    });

    let richIncomingTransfers: IIndexedRichIncomingTransferData[] = [];

    richIncomingTransfers = [
      ...(await primaryDataLoader.incomingTransfers()),
      ...richIncomingTransfers,
    ];

    richIncomingTransfers = richIncomingTransfers.filter((transfer) => {
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

    for (const transfer of richIncomingTransfers) {
      transfer.incomingPackages = await primaryDataLoader.destinationPackages(transfer.DeliveryId);
    }

    reportData[ReportType.INCOMING_MANIFEST_INVENTORY] = {
      richIncomingTransfers,
    };
  }
}
