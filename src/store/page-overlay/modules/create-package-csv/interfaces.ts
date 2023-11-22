import { IIndexedPackageData, IIndexedTagData, IItemData, ILocationData, IUnitOfMeasure } from "@/interfaces";
import { CreatePackageCsvColumns, PackageCsvStatus } from "./consts";

export interface ICreatePackageCsvRowGroup {
    // Raw data, grouped by destination label
    dataRows: ICreatePackageCsvRow[]
    messages: string[],
    warnings: string[],
    errors: string[],
    parsedData: {
        ActualDate: string; // Defaults to today
        Ingredients: {
            pkg: IIndexedPackageData,
            Quantity: number,
            UnitOfMeasure: IUnitOfMeasure; // Defaults to item
        }[],
        Item: IItemData; // Defaults to same item
        Location: ILocationData; // Defaults to parent location
        Note: string;
        ProductionBatchNumber: string;
        Quantity: number;
        Tag: IIndexedTagData;
        UnitOfMeasure: IUnitOfMeasure; // Defaults to item
        UseSameItem: boolean;
        IsDonation: boolean;
        ExpirationDate: string | null;
    }
}

export interface ICreatePackageCsvState {
    status: PackageCsvStatus,
    statusMessage: string | null,
    rowGroups: ICreatePackageCsvRowGroup[],
    csvData: string[][] | null
}

export interface ICreatePackageCsvRow {
    [CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]: string;
    [CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED]: string;
    [CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE]: string;
    [CreatePackageCsvColumns.NEW_PACKAGE_TAG]: string;
    [CreatePackageCsvColumns.LOCATION_NAME]: string;
    [CreatePackageCsvColumns.ITEM_NAME]: string;
    [CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY]: string;
    [CreatePackageCsvColumns.NEW_PACKAGE_UNIT]: string;
    [CreatePackageCsvColumns.PACKAGED_DATE]: string;
    [CreatePackageCsvColumns.NOTE]: string;
    [CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER]: string;
    [CreatePackageCsvColumns.IS_DONATION]: string;
    [CreatePackageCsvColumns.IS_TRADE_SAMPLE]: string;
    [CreatePackageCsvColumns.EXPIRATION_DATE]: string;
}
