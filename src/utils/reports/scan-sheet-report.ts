import { MessageType, SHEETS_API_MESSAGE_TIMEOUT_MS } from "@/consts";
import {
  IIndexedIncomingTransferData,
  IIndexedOutgoingTransferData,
  IIndexedRichIncomingTransferData,
  IIndexedRichOutgoingTransferData,
  IPluginState,
  ISpreadsheet,
  ITransferFilter,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { messageBus } from "@/modules/message-bus.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import {
  addRowsRequestFactory,
  autoResizeDimensionsRequestFactory,
  conditionalFormattingRequestFactory,
  freezeTopRowRequestFactory,
  styleTopRowRequestFactory,
} from "../sheets";

export interface IScanSheetReportFormFilters {
  allIncomingTransfers: IIndexedIncomingTransferData[];
  selectedIncomingTransfers: IIndexedIncomingTransferData[];
  allOutgoingTransfers: IIndexedOutgoingTransferData[];
  selectedOutgoingTransfers: IIndexedOutgoingTransferData[];
  allRejectedTransfers: IIndexedIncomingTransferData[];
  selectedRejectedTransfers: IIndexedIncomingTransferData[];
}

export const scanSheetFormFiltersFactory: () => IScanSheetReportFormFilters = () => ({
  allIncomingTransfers: [],
  selectedIncomingTransfers: [],
  allOutgoingTransfers: [],
  selectedOutgoingTransfers: [],
  allRejectedTransfers: [],
  selectedRejectedTransfers: [],
});

export function addScanSheetReport({
  reportConfig,
}: {
  reportConfig: IReportConfig;
  scanSheetFormFilters: IScanSheetReportFormFilters;
  fields: IFieldData[];
}) {
  const incomingTransferFilter: ITransferFilter = {};
  const outgoingTransferFilter: ITransferFilter = {};
  const rejectedTransferFilter: ITransferFilter = {};

  const formFilters = store.state.reports.reportFormFilters[ReportType.SCAN_SHEET];

  incomingTransferFilter.idMatches = formFilters.selectedIncomingTransfers.map((x) => x.Id);
  outgoingTransferFilter.idMatches = formFilters.selectedOutgoingTransfers.map((x) => x.Id);
  rejectedTransferFilter.idMatches = formFilters.selectedRejectedTransfers.map((x) => x.Id);

  reportConfig[ReportType.SCAN_SHEET] = {
    incomingTransferFilter,
    outgoingTransferFilter,
    rejectedTransferFilter,
    fields: null,
  };
}

export async function maybeLoadScanSheetReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const transferManifestConfig = reportConfig[ReportType.SCAN_SHEET];
  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading transfer manifest packages...", level: "success" },
  });

  let richIncomingTransfers: IIndexedRichIncomingTransferData[] = [];
  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];
  let richRejectedTransfers: IIndexedRichIncomingTransferData[] = [];

  richIncomingTransfers = [
    ...(await primaryDataLoader.incomingTransfers()),
    ...richIncomingTransfers,
  ];
  richOutgoingTransfers = [
    ...(await primaryDataLoader.outgoingTransfers()),
    ...richOutgoingTransfers,
  ];
  richRejectedTransfers = [
    ...(await primaryDataLoader.rejectedTransfers()),
    ...richRejectedTransfers,
  ];

  richIncomingTransfers = richIncomingTransfers.filter((transfer) => {
    if (transferManifestConfig?.incomingTransferFilter.idMatches !== null) {
      if (!transferManifestConfig!.incomingTransferFilter.idMatches!.includes(transfer.Id)) {
        return false;
      }
    }

    return true;
  });

  richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => {
    if (transferManifestConfig?.outgoingTransferFilter.idMatches !== null) {
      if (!transferManifestConfig!.outgoingTransferFilter.idMatches!.includes(transfer.Id)) {
        return false;
      }
    }

    return true;
  });

  richRejectedTransfers = richRejectedTransfers.filter((transfer) => {
    if (transferManifestConfig?.rejectedTransferFilter.idMatches !== null) {
      if (!transferManifestConfig!.rejectedTransferFilter.idMatches!.includes(transfer.Id)) {
        return false;
      }
    }

    return true;
  });

  for (const transfer of richIncomingTransfers) {
    transfer.incomingPackages = await primaryDataLoader.destinationPackages(transfer.DeliveryId);
    transfer.incomingTransporters = await primaryDataLoader.destinationTransporters(
      transfer.DeliveryId
    );
  }

  for (const transfer of richOutgoingTransfers) {
    transfer.outgoingDestinations = await primaryDataLoader.transferDestinations(transfer.Id);

    for (const destination of transfer.outgoingDestinations) {
      destination.packages = await primaryDataLoader.destinationPackages(destination.Id);
    }
  }

  for (const transfer of richRejectedTransfers) {
    transfer.incomingPackages = await primaryDataLoader.destinationPackages(transfer.DeliveryId);
    transfer.incomingTransporters = await primaryDataLoader.destinationTransporters(
      transfer.DeliveryId
    );
  }

  reportData[ReportType.SCAN_SHEET] = {
    richIncomingTransfers,
    richOutgoingTransfers,
    richRejectedTransfers,
  };
}

export function extractScanSheetData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  const headers = [
    "License",
    "Transfer Type",
    "Manifest Number",
    "Origin",
    "Destination",
    "Package Contents",
    "Package Tag",
    "Scanned Tags",
  ];

  const matrix: string[][] = [];

  matrix.push(headers);

  for (const richIncomingTransfer of reportData[ReportType.SCAN_SHEET]!.richIncomingTransfers ??
    []) {
    for (const pkg of richIncomingTransfer.incomingPackages!) {
      matrix.push([
        richIncomingTransfer.LicenseNumber,
        "INCOMING",
        richIncomingTransfer.ManifestNumber,
        `${richIncomingTransfer.ShipperFacilityLicenseNumber} (${richIncomingTransfer.ShipperFacilityLicenseNumber})`,
        `${richIncomingTransfer.DeliveryFacilities}`,
        `${pkg.ShippedQuantity} ${pkg.ShippedUnitOfMeasureAbbreviation} ${pkg.ProductName}`,
        pkg.PackageLabel,
      ]);
    }
  }

  for (const richOutgoingTransfer of reportData[ReportType.SCAN_SHEET]!.richOutgoingTransfers ??
    []) {
    for (const destination of richOutgoingTransfer.outgoingDestinations!) {
      for (const pkg of destination.packages!) {
        matrix.push([
          richOutgoingTransfer.LicenseNumber,
          "REJECTED",
          richOutgoingTransfer.ManifestNumber,
          `${richOutgoingTransfer.ShipperFacilityLicenseNumber} (${richOutgoingTransfer.ShipperFacilityLicenseNumber})`,
          `${destination.RecipientFacilityLicenseNumber} (${destination.RecipientFacilityName})`,
          `${pkg.ShippedQuantity} ${pkg.ShippedUnitOfMeasureAbbreviation} ${pkg.ProductName}`,
          pkg.PackageLabel,
        ]);
      }
    }
  }

  for (const richRejectedTransfer of reportData[ReportType.SCAN_SHEET]!.richRejectedTransfers ??
    []) {
    for (const pkg of richRejectedTransfer.incomingPackages!) {
      matrix.push([
        richRejectedTransfer.LicenseNumber,
        "REJECTED",
        richRejectedTransfer.ManifestNumber,
        `${richRejectedTransfer.ShipperFacilityLicenseNumber} (${richRejectedTransfer.ShipperFacilityLicenseNumber})`,
        `${richRejectedTransfer.DeliveryFacilities}`,
        `${pkg.ShippedQuantity} ${pkg.ShippedUnitOfMeasureAbbreviation} ${pkg.ProductName}`,
        pkg.PackageLabel,
      ]);
    }
  }

  return matrix;
}

export async function createScanSheetSpreadsheetOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<ISpreadsheet> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.SCAN_SHEET]) {
    throw new Error("Missing scan sheet data");
  }

  const SHEET_TITLE = `Scan Sheet (${totalTransferCount(reportData)} transfers)`;

  const response: {
    data: {
      success: boolean;
      result: ISpreadsheet;
    };
  } = await messageBus.sendMessageToBackground(
    MessageType.CREATE_SPREADSHEET,
    {
      title: `Scan Sheet (${totalTransferCount(reportData)} transfers)`,
      sheetTitles: [SHEET_TITLE],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SHEET_TITLE}'`,
      values: extractScanSheetData({ reportType: ReportType.SCAN_SHEET, reportConfig, reportData }),
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  const sheetId = 0;
  const matchColumn = {
    index: 6,
    identifier: "G",
  };

  const inputColumn = {
    index: 7,
    identifier: "H",
  };

  const formattingRequests = [
    addRowsRequestFactory({ sheetId, length: totalPackageCount(reportData) + 2 }),
    styleTopRowRequestFactory({ sheetId }),
    freezeTopRowRequestFactory({ sheetId }),
    autoResizeDimensionsRequestFactory({
      sheetId,
    }),
    // First column: turn green if tag appears exactly twice anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: matchColumn.index,
        endColumnIndex: matchColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF(${matchColumn.identifier}$2:${inputColumn.identifier},${matchColumn.identifier}2)=2`,
      backgroundColor: { green: 1 },
    }),
    // Second column: turn red if tag appears exactly once anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: matchColumn.index,
        endColumnIndex: matchColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF(${matchColumn.identifier}$2:${inputColumn.identifier},${matchColumn.identifier}2)=1`,
      backgroundColor: { red: 1 },
    }),
    // First column: turn yellow if tag appears more than twice anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: matchColumn.index,
        endColumnIndex: matchColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF($${matchColumn.identifier}$2:${inputColumn.identifier},${matchColumn.identifier}2)>2`,
      backgroundColor: { red: 1, green: 1 },
    }),
    // Second column: turn yellow if tag appears more than once in the 2nd column
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: inputColumn.index,
        endColumnIndex: inputColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF($${inputColumn.identifier}$2:${inputColumn.identifier},${inputColumn.identifier}2)>1`,
      backgroundColor: { red: 1, green: 1 },
    }),
    // Second column: turn orange if tag appears exactly once anywhere
    conditionalFormattingRequestFactory({
      sheetId,
      range: {
        startColumnIndex: inputColumn.index,
        endColumnIndex: inputColumn.index + 1,
        startRowIndex: 1,
      },
      customFormula: `=COUNTIF($${matchColumn.identifier}$2:${inputColumn.identifier},${inputColumn.identifier}2)=1`,
      backgroundColor: { red: 1, green: 0.64 },
    }),
  ];

  await messageBus.sendMessageToBackground(
    MessageType.BATCH_UPDATE_SPREADSHEET,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      requests: formattingRequests,
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  await messageBus.sendMessageToBackground(
    MessageType.WRITE_SPREADSHEET_VALUES,
    {
      spreadsheetId: response.data.result.spreadsheetId,
      range: `'${SHEET_TITLE}'!A${totalPackageCount(reportData) + 3}`,
      values: [[`Created with Track & Trace Tools @ ${Date().toString()}`]],
    },
    undefined,
    SHEETS_API_MESSAGE_TIMEOUT_MS
  );

  return response.data.result;
}

function totalTransferCount(reportData: IReportData): number {
  const scanSheetData = reportData[ReportType.SCAN_SHEET]!;

  return (
    scanSheetData.richIncomingTransfers!.length +
    scanSheetData.richOutgoingTransfers!.length +
    scanSheetData.richRejectedTransfers!.length
  );
}

function totalPackageCount(reportData: IReportData): number {
  const scanSheetData = reportData[ReportType.SCAN_SHEET]!;

  let count = 0;

  for (const richIncomingTransfer of scanSheetData.richIncomingTransfers!) {
    count += richIncomingTransfer.PackageCount;
  }
  for (const richOutgoingTransfer of scanSheetData.richOutgoingTransfers!) {
    count += richOutgoingTransfer.PackageCount;
  }
  for (const richRejectedTransfer of scanSheetData.richRejectedTransfers!) {
    count += richRejectedTransfer.PackageCount;
  }

  return count;
}
