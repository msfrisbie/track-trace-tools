import {
  IIndexedOutgoingTransferData,
  IIndexedRichOutgoingTransferData,
  IPluginState,
  ITransferFilter
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IFieldData,
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { formatAddress } from "../address";
import { shipperWholesalePriceToDollarString } from "../money";
import { formatPhoneNumber } from "../phone";

export interface IInvoiceReportFormFilters {
  allOutgoingTransfers: IIndexedOutgoingTransferData[];
  selectedOutgoingTransfer: IIndexedOutgoingTransferData | null;
}

export const invoiceFormFiltersFactory: () => IInvoiceReportFormFilters = () => ({
  allOutgoingTransfers: [],
  selectedOutgoingTransfer: null,
});

export function addInvoiceReport({
  reportConfig,
}: {
  reportConfig: IReportConfig;
  invoiceFormFilters: IInvoiceReportFormFilters;
  fields: IFieldData[];
}) {
  const outgoingTransferFilter: ITransferFilter = {};

  const formFilters = store.state.reports.reportFormFilters[ReportType.INVOICE];

  outgoingTransferFilter.idMatches = [formFilters.selectedOutgoingTransfer!.Id];

  reportConfig[ReportType.INVOICE] = {
    outgoingTransferFilter,
    fields: null,
  };
}

export async function maybeLoadInvoiceReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const transferManifestConfig = reportConfig[ReportType.INVOICE];

  if (!transferManifestConfig) {
    return;
  }

  if (
      transferManifestConfig!.outgoingTransferFilter!.idMatches!.length ===
    0
  ) {
    throw new Error("Must select at least one transfer");
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading transfer manifest packages...", level: "success" },
  });

  let richOutgoingTransfers: IIndexedRichOutgoingTransferData[] = [];

  richOutgoingTransfers = [
    ...(await primaryDataLoader.outgoingTransfers()),
    ...richOutgoingTransfers,
  ];

  richOutgoingTransfers = richOutgoingTransfers.filter((transfer) => {
    if (transferManifestConfig?.outgoingTransferFilter.idMatches !== null) {
      if (!transferManifestConfig!.outgoingTransferFilter.idMatches!.includes(transfer.Id)) {
        return false;
      }
    }

    return true;
  });

  for (const transfer of richOutgoingTransfers) {
    transfer.outgoingDestinations = await primaryDataLoader.transferDestinations(transfer.Id);

    for (const destination of transfer.outgoingDestinations) {
      destination.packages = await primaryDataLoader.destinationPackages(destination.Id);
    }
  }

  const transporterFacilities = await primaryDataLoader.transferTransporterFacilities();
  const destinationFacilities = await primaryDataLoader.transferDestinationFacilities();

  reportData[ReportType.INVOICE] = {
    transporterFacilities,
    destinationFacilities,
    richOutgoingTransfers,
  };
}

export function extractInvoiceData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  const matrix: string[][] = [];

  const richOutgoingTransfer = reportData[ReportType.INVOICE]!.richOutgoingTransfers![0];
  const originData = reportData[ReportType.INVOICE]!.destinationFacilities.find(
    (x) => x.LicenseNumber === richOutgoingTransfer.LicenseNumber
  )!;
  const destinationData = reportData[ReportType.INVOICE]!.destinationFacilities.find(
    (x) => x.LicenseNumber === richOutgoingTransfer.outgoingDestinations![0].RecipientFacilityLicenseNumber
  )!;

  matrix.push(["INVOICE", "", "", "Created with T3 -> useT3.com"]);
  matrix.push([]);
  matrix.push(["Date:", new Date().toLocaleDateString("en-CA")]);
  matrix.push(["Payment terms:", "Net 30"]);
  matrix.push([]);

  matrix.push(["FROM", "", "TO"]);
  matrix.push([
    originData.FacilityName,
    "",
    destinationData.FacilityName,
  ]);
  matrix.push([
    `License: ${originData.LicenseNumber}`,
    "",
    `License: ${destinationData.LicenseNumber}`,
  ]);

  const fromAddress = formatAddress(originData.PhysicalAddress);
  const toAddress = formatAddress(destinationData.PhysicalAddress);

  for (let i = 0; i < Math.max(fromAddress.length, toAddress.length); i++) {
    matrix.push([
      fromAddress[i] || "",
      "",
      toAddress[i] || "",
    ]);
  }

  matrix.push([
    formatPhoneNumber(originData.MainPhoneNumber || originData.MobilePhoneNumber),
    "",
    formatPhoneNumber(destinationData.MainPhoneNumber || destinationData.MobilePhoneNumber),
  ]);
  matrix.push([]);

  // Header row
  matrix.push([
    "Package Tag",
    "Package Description",
    "Quantity",
    "Price",
  ]);

  // Track where line items start
  const lineItemStartRow = matrix.length + 1;

  for (const destination of richOutgoingTransfer.outgoingDestinations!) {
    for (const pkg of destination.packages!) {
      const priceStr = shipperWholesalePriceToDollarString(pkg.ShipperWholesalePrice);

      matrix.push([
        pkg.PackageLabel,
        pkg.ProductName,
        `${pkg.ShippedQuantity} ${pkg.ShippedUnitOfMeasureAbbreviation}`,
        priceStr,
      ]);
    }
  }

  const lineItemEndRow = matrix.length;

  // Excel uses 1-based indexing, column H = 8
  const subtotalCell = `D${lineItemEndRow + 2}`;
  const creditsCell = `D${lineItemEndRow + 3}`;
  const totalDueCell = `D${lineItemEndRow + 4}`;
  const priceRange = `D${lineItemStartRow}:E${lineItemEndRow}`;

  // Insert formulas
  matrix.push([]);
  matrix.push([
    "", "", "SUBTOTAL",
    `=TEXT(SUMPRODUCT(VALUE(${priceRange})), "$0.00")`
  ]);
  matrix.push([
    "", "", "CREDITS",
    "" // leave empty for user
  ]);
  matrix.push([
    "", "", "TOTAL DUE",
    `=TEXT(VALUE(${subtotalCell}) - VALUE(${creditsCell}), "$0.00")`
  ]);
  return matrix;
}

export function totalInvoiceTransferCount(reportData: IReportData): number {
  const invoiceData = reportData[ReportType.INVOICE]!;

  return (
    invoiceData.richOutgoingTransfers!.length
  );
}

export function totalInvoicePackageCount(reportData: IReportData): number {
  const invoiceData = reportData[ReportType.INVOICE]!;

  let count = 0;

  for (const richOutgoingTransfer of invoiceData.richOutgoingTransfers!) {
    count += richOutgoingTransfer.PackageCount;
  }

  return count;
}
