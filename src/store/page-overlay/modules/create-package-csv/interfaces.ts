import {
  IIndexedPackageData,
  IIndexedTagData,
  IItemData,
  ILocationData,
  IUnitOfMeasure,
} from "@/interfaces";
import { CreatePackageCsvColumns, PackageCsvStatus } from "./consts";

export interface IParsedRowGroupData {
  ActualDate: string | null; // Defaults to today
  Ingredients:
    | {
        pkg: IIndexedPackageData | null;
        Quantity: number | null;
        UnitOfMeasure: IUnitOfMeasure | null; // Defaults to item
      }[]
    | null;
  Item: IItemData | null; // Defaults to same item
  Location: ILocationData | null; // Defaults to parent location
  Note: string | null;
  ProductionBatchNumber: string | null;
  Quantity: number | null;
  Tag: IIndexedTagData | null;
  UnitOfMeasure: IUnitOfMeasure | null; // Defaults to item
  UseSameItem: boolean | null;
  IsDonation: boolean | null;
  ExpirationDate: string | null;
}

export interface IRowGroupMessage {
  text: string;
  cellCoordinates: { rowIndex: number; columnIndex: number }[];
}

export interface ICreatePackageCsvRowGroup {
  // Raw data, grouped by destination label
  // Corresponds to a single create package request
  destinationLabel: string;
  dataRows: ICreatePackageCsvRow[];
  messages: IRowGroupMessage[];
  warnings: IRowGroupMessage[];
  errors: IRowGroupMessage[];
  parsedData: IParsedRowGroupData | null;
  mockPackage: IIndexedPackageData | null;
}

export interface ICreatePackageCsvState {
  status: PackageCsvStatus;
  statusMessage: string | null;
  rowGroups: ICreatePackageCsvRowGroup[];
  csvData: string[][] | null;
}

export interface ICreatePackageCsvRow {
  RealIndex: number;
  Index: number;
  [CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]: string;
  [CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED]: string;
  [CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE]: string;
  [CreatePackageCsvColumns.NEW_PACKAGE_TAG]: string;
  [CreatePackageCsvColumns.LOCATION_NAME]: string;
  [CreatePackageCsvColumns.ITEM_NAME]: string;
  [CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY]: string;
  [CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE]: string;
  [CreatePackageCsvColumns.PACKAGED_DATE]: string;
  [CreatePackageCsvColumns.NOTE]: string;
  [CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER]: string;
  [CreatePackageCsvColumns.IS_DONATION]: string;
  [CreatePackageCsvColumns.IS_TRADE_SAMPLE]: string;
  [CreatePackageCsvColumns.EXPIRATION_DATE]: string;
}
