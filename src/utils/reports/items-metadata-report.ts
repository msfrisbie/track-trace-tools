import { IIndexedItemData, ILicenseFormFilters, IPluginState } from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { extractLicenseFields, licenseFilterFactory } from "./reports-shared";

export interface IItemsMetadataReportFormFilters extends ILicenseFormFilters {}

export const itemsMetadataReportFormFiltersFactory: () => IItemsMetadataReportFormFilters = () => ({
  ...licenseFilterFactory(),
});

export function addItemsMetadataReport({
  reportConfig,
  itemsMetadataReportFormFilters,
}: {
  reportConfig: IReportConfig;
  itemsMetadataReportFormFilters: IItemsMetadataReportFormFilters;
}) {
  reportConfig[ReportType.ITEMS_METADATA] = {
    ...extractLicenseFields(itemsMetadataReportFormFilters),
    fields: null,
  };
}

export async function maybeLoadItemsMetadataReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  if (!reportConfig[ReportType.ITEMS_METADATA]) {
    return;
  }

  const itemsMetadataReportConfig = reportConfig[ReportType.ITEMS_METADATA]!;

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: { text: "Loading items...", level: "success" },
  });

  let items: IIndexedItemData[] = [];

  for (const license of itemsMetadataReportConfig.licenses) {
    const dataLoader = await getDataLoaderByLicense(license);

    try {
      items = await dataLoader.items();
    } catch (e) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: "Failed to load items.", level: "warning" },
      });
    }
  }

  ctx.commit(ReportsMutations.SET_STATUS, {
    statusMessage: {
      text: "Loading history...",
      level: "success",
    },
  });

  // Load all lab data for each package
  const promises: Promise<any>[] = [];

  let dataLoader: DataLoader;

  for (const item of items) {
    dataLoader = await getDataLoaderByLicense(item.LicenseNumber);

    promises.push(
      dataLoader.itemHistoryByItemId(item.Id).then((history) => {
        item.history = history;
      })
    );

    if (promises.length % 100 === 0) {
      await Promise.allSettled(promises);
    }

    ctx.commit(ReportsMutations.SET_STATUS, {
      statusMessage: { text: `Loaded history for ${promises.length} items...`, level: "success" },
      prependMessage: false,
    });
  }

  await Promise.allSettled(promises);

  reportData[ReportType.ITEMS_METADATA] = {
    items,
  };
}

export function extractItemsMetadataReportData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  const matrix: any[][] = [];

  const headers = [
    "License",
    "Item Name",
    "Category",
    "Type",
    "Quantity Type",
    "Unit Of Measure",
    "Approval Status",
    "Approval Number",
    "Approval Date",
    "Strain",
    "Created Date",
  ];

  matrix.push(headers);

  for (const item of reportData[ReportType.ITEMS_METADATA]!.items) {
    const row: any[] = [
      item.LicenseNumber,
      item.Name,
      item.ProductCategoryName,
      item.ProductCategoryTypeName,
      item.QuantityTypeName,
      item.UnitOfMeasureName,
      item.ApprovalStatusName,
      (item.Name.match(/^M\d+/) || [""])[0],
      item.ApprovalStatusDateTime,
      item.StrainName,
      item.history![0].RecordedDateTime,
    ];

    matrix.push(row);
  }

  return matrix;
}
