import { SheetTitles } from "@/consts";
import {
  IDestinationData,
  IIndexedDestinationPackageData,
  IIndexedHarvestData,
  IIndexedPackageData,
  IIndexedPlantBatchData,
  IIndexedPlantData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IIndexedTagData,
  IIndexedTransferData,
  ITransferData,
  ITransporterData,
} from "@/interfaces";
import { ReportType } from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig, IReportData } from "@/store/page-overlay/modules/reports/interfaces";

export function shouldGenerateReport({
  reportConfig,
  reportData,
  reportType,
}: {
  reportConfig: IReportConfig;
  reportData: IReportData;
  reportType: ReportType;
}): boolean {
  return !!reportConfig[reportType] && !!reportData[reportType];
}

export function extractNestedData({
  reportData,
  reportType,
}: {
  reportData: IReportData;
  reportType: ReportType;
}) {
  switch (reportType) {
    case ReportType.PACKAGES:
      return reportData[reportType]?.packages as IIndexedPackageData[];
    case ReportType.TAGS:
      return reportData[reportType]?.tags as IIndexedTagData[];
    case ReportType.HARVESTS:
      return reportData[reportType]?.harvests as IIndexedHarvestData[];
    case ReportType.IMMATURE_PLANTS:
      return reportData[reportType]?.immaturePlants as IIndexedPlantBatchData[];
    case ReportType.MATURE_PLANTS:
      return reportData[reportType]?.maturePlants as IIndexedPlantData[];
    case ReportType.INCOMING_TRANSFERS:
      return reportData[reportType]?.incomingTransfers as IIndexedRichIncomingTransferData[];
    case ReportType.OUTGOING_TRANSFERS:
      return reportData[reportType]?.outgoingTransfers as IIndexedRichOutgoingTransferData[];
    case ReportType.OUTGOING_TRANSFER_MANIFESTS:
      return reportData[reportType]?.richOutgoingTransfers as IIndexedRichOutgoingTransferData[];
    case ReportType.TRANSFER_HUB_TRANSFERS:
      return reportData[reportType]?.transferHubTransfers as IIndexedRichOutgoingTransferData[];
    case ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS:
      return reportData[reportType]?.richTransferHubTransfers as IIndexedRichOutgoingTransferData[];
    case ReportType.STRAGGLER_PACKAGES:
      return reportData[reportType]?.stragglerPackages as IIndexedPackageData[];
    default:
      throw new Error("Bad reportType " + reportType);
  }
}

export function extractFlattenedData({
  flattenedCache,
  reportType,
  reportData,
}: {
  flattenedCache: Map<ReportType, any[]>;
  reportType: ReportType;
  reportData: IReportData;
}): any[] {
  if (flattenedCache.has(reportType)) {
    return flattenedCache.get(reportType) as any[];
  }

  const value = (() => {
    switch (reportType) {
      case ReportType.PACKAGES:
      case ReportType.STRAGGLER_PACKAGES:
      case ReportType.MATURE_PLANTS:
      case ReportType.IMMATURE_PLANTS:
      case ReportType.HARVESTS:
      case ReportType.TAGS:
        return extractNestedData({ reportType, reportData });
      case ReportType.INCOMING_TRANSFERS:
        let flattenedIncomingTransfers: {
          Transporter: ITransporterData;
          Transfer: IIndexedTransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichIncomingTransferData[]) {
          for (const transporter of transfer?.incomingTransporters ?? []) {
            flattenedIncomingTransfers.push({
              Transporter: transporter,
              Transfer: transfer,
            });
          }
        }

        return flattenedIncomingTransfers;
      case ReportType.OUTGOING_TRANSFERS:
        let flattenedOutgoingTransfers: {
          Destination: IDestinationData;
          Transfer: ITransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichOutgoingTransferData[]) {
          for (const destination of transfer?.outgoingDestinations ?? []) {
            flattenedOutgoingTransfers.push({
              Destination: destination,
              Transfer: transfer,
            });
          }
        }

        return flattenedOutgoingTransfers;
      case ReportType.OUTGOING_TRANSFER_MANIFESTS:
        let flattenedOutgoingPackages: {
          Package: IIndexedDestinationPackageData;
          Destination: IDestinationData;
          Transfer: ITransferData;
        }[] = [];

        for (const transfer of extractNestedData({
          reportType,
          reportData,
        }) as IIndexedRichOutgoingTransferData[]) {
          for (const destination of transfer?.outgoingDestinations ?? []) {
            for (const pkg of destination.packages ?? []) {
              flattenedOutgoingPackages.push({
                Package: pkg,
                Destination: destination,
                Transfer: transfer,
              });
            }
          }
        }
        return flattenedOutgoingPackages;
      default:
        throw new Error("Bad reportType " + reportType);
    }
  })();

  flattenedCache.set(reportType, value);

  return value;
}

export function getSheetTitle({ reportType }: { reportType: ReportType }): SheetTitles {
  switch (reportType) {
    case ReportType.PACKAGES:
      return SheetTitles.PACKAGES;
    case ReportType.STRAGGLER_PACKAGES:
      return SheetTitles.STRAGGLER_PACKAGES;
    case ReportType.HARVESTS:
      return SheetTitles.HARVESTS;
    case ReportType.TAGS:
      return SheetTitles.TAGS;
    case ReportType.IMMATURE_PLANTS:
      return SheetTitles.IMMATURE_PLANTS;
    case ReportType.MATURE_PLANTS_QUICKVIEW:
      return SheetTitles.MATURE_PLANTS_QUICKVIEW;
    case ReportType.MATURE_PLANTS:
      return SheetTitles.MATURE_PLANTS;
    case ReportType.INCOMING_TRANSFERS:
      return SheetTitles.INCOMING_TRANSFERS;
    case ReportType.OUTGOING_TRANSFERS:
      return SheetTitles.OUTGOING_TRANSFERS;
    case ReportType.OUTGOING_TRANSFER_MANIFESTS:
      return SheetTitles.OUTGOING_TRANSFER_MANIFESTS;
      case ReportType.TRANSFER_HUB_TRANSFERS:
        return SheetTitles.TRANSFER_HUB_TRANSFERS;
      case ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS:
        return SheetTitles.TRANSFER_HUB_TRANSFER_MANIFESTS;
    default:
      throw new Error("Bad reportType " + reportType);
  }
}
