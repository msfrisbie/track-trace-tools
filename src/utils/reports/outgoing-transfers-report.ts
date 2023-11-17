import {
  IIndexedRichOutgoingTransferData,
  IPluginState,
  IRichDestinationData,
  ITransferFilter,
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

interface IOutgoingTransfersReportFormFilters {
  estimatedDepartureDateLt: string;
  estimatedDepartureDateGt: string;
  shouldFilterEstimatedDepartureDateLt: boolean;
  shouldFilterEstimatedDepartureDateGt: boolean;
  onlyWholesale: boolean;
  includeOutgoing: boolean;
  includeRejected: boolean;
  includeOutgoingInactive: boolean;
}

export const outgoingTransfersFormFiltersFactory: () => IOutgoingTransfersReportFormFilters = () => ({
  estimatedDepartureDateLt: todayIsodate(),
  estimatedDepartureDateGt: todayIsodate(),
  shouldFilterEstimatedDepartureDateLt: false,
  shouldFilterEstimatedDepartureDateGt: false,
  onlyWholesale: false,
  includeOutgoing: true,
  includeRejected: true,
  includeOutgoingInactive: false,
});

export function addOutgoingTransfersReport({
  reportConfig,
  outgoingTransfersFormFilters,
  fields,
}: {
  reportConfig: IReportConfig;
  outgoingTransfersFormFilters: IOutgoingTransfersReportFormFilters;
  fields: IFieldData[];
}) {
  const transferFilter: ITransferFilter = {};

  transferFilter.onlyWholesale = outgoingTransfersFormFilters.onlyWholesale;
  transferFilter.includeOutgoing = outgoingTransfersFormFilters.includeOutgoing;
  transferFilter.includeRejected = outgoingTransfersFormFilters.includeRejected;
  transferFilter.includeOutgoingInactive = outgoingTransfersFormFilters.includeOutgoingInactive;

  transferFilter.estimatedDepartureDateGt = outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateGt
    ? (outgoingTransfersFormFilters.estimatedDepartureDateGt as string)
    : null;

  transferFilter.estimatedDepartureDateLt = outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateLt
    ? outgoingTransfersFormFilters.estimatedDepartureDateLt
    : null;

  reportConfig[ReportType.OUTGOING_TRANSFERS] = {
    transferFilter,
    fields,
  };
}

export async function maybeLoadOutgoingTransfersReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const outgoingTransferConfig = reportConfig[ReportType.OUTGOING_TRANSFERS];
  if (outgoingTransferConfig?.transferFilter) {
    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: 'Loading outgoing transfers...', level: 'success' },
    });

    let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

    if (outgoingTransferConfig.transferFilter.includeOutgoing) {
      richOutgoingTransfers = [
        ...(await primaryDataLoader.outgoingTransfers()),
        ...richOutgoingTransfers,
      ];
    }

    if (outgoingTransferConfig.transferFilter.includeRejected) {
      richOutgoingTransfers = [
        ...(await primaryDataLoader.rejectedTransfers()),
        ...richOutgoingTransfers,
      ];
    }

    if (outgoingTransferConfig.transferFilter.includeOutgoingInactive) {
      richOutgoingTransfers = [
        ...(await primaryDataLoader.outgoingInactiveTransfers()),
        ...richOutgoingTransfers,
      ];
    }

    richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => {
      if (outgoingTransferConfig.transferFilter.estimatedDepartureDateLt) {
        if (
          transfer.CreatedDateTime > outgoingTransferConfig.transferFilter.estimatedDepartureDateLt
        ) {
          return false;
        }
      }

      if (outgoingTransferConfig.transferFilter.estimatedDepartureDateGt) {
        if (
          transfer.LastModified < outgoingTransferConfig.transferFilter.estimatedDepartureDateGt
        ) {
          return false;
        }
      }

      return true;
    });

    for (const transfer of richOutgoingTransfers) {
      const destinations: IRichDestinationData[] = (
        await primaryDataLoader.transferDestinations(transfer.Id)
      ).map((x) => ({ ...x, packages: [] }));

      transfer.outgoingDestinations = destinations.filter((destination) => {
        if (outgoingTransferConfig.transferFilter.onlyWholesale) {
          if (!destination.ShipmentTypeName.includes('Wholesale')) {
            return false;
          }
        }

        if (outgoingTransferConfig.transferFilter.estimatedDepartureDateLt) {
          if (
            destination.EstimatedDepartureDateTime
            > outgoingTransferConfig.transferFilter.estimatedDepartureDateLt
          ) {
            return false;
          }
        }

        if (outgoingTransferConfig.transferFilter.estimatedDepartureDateGt) {
          if (
            destination.EstimatedDepartureDateTime
            < outgoingTransferConfig.transferFilter.estimatedDepartureDateGt
          ) {
            return false;
          }
        }

        return true;
      });
    }

    richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => true);

    reportData[ReportType.OUTGOING_TRANSFERS] = {
      outgoingTransfers: richOutgoingTransfers,
    };
  }
}
