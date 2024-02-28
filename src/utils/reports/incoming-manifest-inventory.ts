import { IIndexedRichIncomingTransferData, IPluginState, ITransferFilter } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";

export interface IIncomingManifestInventoryReportFormFilters {
  allTransfers: IIndexedRichIncomingTransferData[];
  selectedTransfers: IIndexedRichIncomingTransferData[];
}

export function addIncomingManifestInventoryReport({
  reportConfig,
}: {
  reportConfig: IReportConfig;
}) {
  const transferFilter: ITransferFilter = {};

  const formFilters = store.state.reports.reportFormFilters[ReportType.INCOMING_MANIFEST_INVENTORY];

  transferFilter.idMatches = formFilters.selectedTransfers.map((x) => x.Id);

  reportConfig[ReportType.INCOMING_MANIFEST_INVENTORY] = {
    transferFilter,
    fields: store.state.reports.selectedFields[ReportType.INCOMING_MANIFEST_INVENTORY],
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
      // Only select specific transfers
      if (transferManifestConfig.transferFilter.idMatches !== null) {
        if (!transferManifestConfig.transferFilter.idMatches!.includes(transfer.Id)) {
          return false;
        }
      }

      return true;
    });

    for (const transfer of richIncomingTransfers) {
      transfer.incomingPackages = await primaryDataLoader.destinationPackages(transfer.DeliveryId);
      transfer.incomingTransporters = await primaryDataLoader.destinationTransporters(transfer.DeliveryId);
    }

    reportData[ReportType.INCOMING_MANIFEST_INVENTORY] = {
      richIncomingTransfers,
    };
  }
}
