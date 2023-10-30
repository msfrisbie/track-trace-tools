import {
  IIndexedRichIncomingTransferData,
  IPluginState,
  ITransferFilter,
  ITransporterData,
} from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { ReportsMutations, ReportType } from '@/store/page-overlay/modules/reports/consts';
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from '@/store/page-overlay/modules/reports/interfaces';
import { ActionContext } from 'vuex';
import { todayIsodate } from '../date';

interface IIncomingTransfersReportFormFilters {
  estimatedArrivalDateLt: string;
  estimatedArrivalDateGt: string;
  shouldFilterEstimatedArrivalDateLt: boolean;
  shouldFilterEstimatedArrivalDateGt: boolean;
  onlyWholesale: boolean;
  includeIncoming: boolean;
  includeIncomingInactive: boolean;
}

export const incomingTransfersFormFiltersFactory: () => IIncomingTransfersReportFormFilters = () => ({
  estimatedArrivalDateLt: todayIsodate(),
  estimatedArrivalDateGt: todayIsodate(),
  shouldFilterEstimatedArrivalDateLt: false,
  shouldFilterEstimatedArrivalDateGt: false,
  onlyWholesale: false,
  includeIncoming: true,
  includeIncomingInactive: false,
});

export function addIncomingTransfersReport({
  reportConfig,
  incomingTransfersFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  incomingTransfersFormFilters: IIncomingTransfersReportFormFilters;
  fields: IFieldData[];
}) {
  const transferFilter: ITransferFilter = {};

  transferFilter.onlyWholesale = incomingTransfersFormFilters.onlyWholesale;
  transferFilter.includeIncoming = incomingTransfersFormFilters.includeIncoming;
  transferFilter.includeIncomingInactive = incomingTransfersFormFilters.includeIncomingInactive;

  transferFilter.estimatedArrivalDateGt = incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateGt
    ? incomingTransfersFormFilters.estimatedArrivalDateGt
    : null;

  transferFilter.estimatedArrivalDateLt = incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateLt
    ? incomingTransfersFormFilters.estimatedArrivalDateLt
    : null;

  reportConfig[ReportType.INCOMING_TRANSFERS] = {
    transferFilter,
    fields,
  };
}

export async function maybeLoadIncomingTransfersReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const incomingTransferConfig = reportConfig[ReportType.INCOMING_TRANSFERS];
  if (incomingTransferConfig?.transferFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Loading incoming transfers...', level: 'success' },
    });

    let richIncomingTransfers: IIndexedRichIncomingTransferData[] = [];

    if (incomingTransferConfig.transferFilter.includeIncoming) {
      richIncomingTransfers = [
        ...(await primaryDataLoader.incomingTransfers()),
        ...richIncomingTransfers,
      ];
    }

    if (incomingTransferConfig.transferFilter.includeIncomingInactive) {
      richIncomingTransfers = [
        ...(await primaryDataLoader.incomingInactiveTransfers()),
        ...richIncomingTransfers,
      ];
    }

    richIncomingTransfers = richIncomingTransfers.filter((transfer) => {
      if (incomingTransferConfig.transferFilter.onlyWholesale) {
        if (!transfer.ShipmentTypeName.includes('Wholesale')) {
          return false;
        }
      }

      if (incomingTransferConfig.transferFilter.estimatedArrivalDateLt) {
        if (
          transfer.EstimatedDepartureDateTime
          > incomingTransferConfig.transferFilter.estimatedArrivalDateLt
        ) {
          return false;
        }
      }

      if (incomingTransferConfig.transferFilter.estimatedArrivalDateGt) {
        if (
          transfer.EstimatedDepartureDateTime
          < incomingTransferConfig.transferFilter.estimatedArrivalDateGt
        ) {
          return false;
        }
      }

      return true;
    });

    for (const transfer of richIncomingTransfers) {
      const transporters: ITransporterData[] = await primaryDataLoader.destinationTransporters(
        transfer.DeliveryId,
      );

      transfer.incomingTransporters = transporters;
    }

    reportData[ReportType.INCOMING_TRANSFERS] = {
      incomingTransfers: richIncomingTransfers,
    };
  }
}
