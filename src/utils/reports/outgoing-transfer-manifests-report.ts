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

export const outgoingTransferManifestsFormFiltersFactory: () => IOutgoingTransferManifestsReportFormFilters = () => ({
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
  transferFilter.includeOutgoingInactive = outgoingTransferManifestsFormFilters.includeOutgoingInactive;

  transferFilter.estimatedDepartureDateGt = outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt
    ? outgoingTransferManifestsFormFilters.estimatedDepartureDateGt
    : null;

  transferFilter.estimatedDepartureDateLt = outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
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
      statusMessage: { text: 'Loading transfer manifest packages...', level: 'success' },
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

    for (const transfer of richOutgoingTransfers) {
      const destinations: IRichDestinationData[] = (
        await primaryDataLoader.transferDestinations(transfer.Id)
      ).map((x) => ({ ...x, packages: [] }));

      for (const destination of destinations) {
        destination.packages = await primaryDataLoader.destinationPackages(destination.Id);
      }
      transfer.outgoingDestinations = destinations;

      transfer.outgoingDestinations = destinations.filter((destination) => {
        if (transferManifestConfig.transferFilter.onlyWholesale) {
          if (!destination.ShipmentTypeName.includes('Wholesale')) {
            return false;
          }
        }

        if (transferManifestConfig.transferFilter.estimatedDepartureDateLt) {
          if (
            destination.EstimatedDepartureDateTime
            > transferManifestConfig.transferFilter.estimatedDepartureDateLt
          ) {
            return false;
          }
        }

        if (transferManifestConfig.transferFilter.estimatedDepartureDateGt) {
          if (
            destination.EstimatedDepartureDateTime
            < transferManifestConfig.transferFilter.estimatedDepartureDateGt
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
