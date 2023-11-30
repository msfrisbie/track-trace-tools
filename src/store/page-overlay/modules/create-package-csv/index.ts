import {
  ICsvFile,
  IIndexedPackageData,
  IIndexedTagData,
  IItemData,
  ILocationData,
  IPluginState,
  IUnitOfMeasure,
} from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import {
  convertMatrixIntoKeyValRows,
  downloadCsvFile,
  getIndexOfHeaderRowOrError,
} from "@/utils/csv";
import { todayIsodate } from "@/utils/date";
import { readCsvFile } from "@/utils/file";
import { fuzzyUnitsMatch } from "@/utils/units";
import { ActionContext } from "vuex";
import {
  CREATE_PACKAGE_CSV_COLUMNS,
  CreatePackageCsvActions,
  CreatePackageCsvColumns,
  CreatePackageCsvGetters,
  CreatePackageCsvMutations,
  PackageCsvStatus,
} from "./consts";
import {
  ICreatePackageCsvRow,
  ICreatePackageCsvRowGroup,
  ICreatePackageCsvState,
} from "./interfaces";

const inMemoryState = {
  status: PackageCsvStatus.INITIAL,
  statusMessage: null,
  rowGroups: [],
  csvData: null,
};

const persistedState = {};

const defaultState: ICreatePackageCsvState = {
  ...inMemoryState,
  ...persistedState,
};

export const createPackageCsvModule = {
  state: () => defaultState,
  mutations: {
    [CreatePackageCsvMutations.CREATE_PACKAGE_CSV_MUTATION](
      state: ICreatePackageCsvState,
      data: any
    ) {
      // state.data = data;
    },
  },
  getters: {
    [CreatePackageCsvGetters.CREATE_PACKAGE_CSV_GETTER]: (
      state: ICreatePackageCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [CreatePackageCsvActions.RESET]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
        file: File;
      }
    ) => {
      ctx.state.status = PackageCsvStatus.INITIAL;
      ctx.state.csvData = null;
      ctx.state.statusMessage = "";
    },
    [CreatePackageCsvActions.IMPORT_CSV]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
        file: File;
      }
    ) => {
      ctx.state.status = PackageCsvStatus.INFLIGHT;

      try {
        ctx.state.csvData = await readCsvFile(data.file);
      } catch (e) {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = `Failed to load CSV data: ${(e as Error).toString()}`;
        return;
      }

      ctx.dispatch(CreatePackageCsvActions.PARSE_CSV_DATA);
    },
    [CreatePackageCsvActions.PARSE_CSV_DATA]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {}
    ) => {
      if (!ctx.state.csvData) {
        throw new Error("Cannot parse null CSV data");
      }

      let packages: IIndexedPackageData[];
      let tags: IIndexedTagData[];
      let items: IItemData[];
      let locations: ILocationData[];
      const unitsOfMeasure: IUnitOfMeasure[] = await dynamicConstsManager.unitsOfMeasure();

      ctx.state.statusMessage = "Loading data...";

      try {
        packages = await primaryDataLoader.activePackages();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage =
          "Unable to load packages. Ensure this Metrc account has package permissions.";
        return;
      }

      try {
        tags = await primaryDataLoader.availableTags();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage =
          "Unable to load tags. Ensure this Metrc account has tag permissions.";
        return;
      }

      try {
        locations = await primaryDataLoader.locations();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage =
          "Unable to load locations. Ensure this Metrc account has location permissions.";
        return;
      }

      try {
        items = await primaryDataLoader.items();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage =
          "Unable to load items. Ensure this Metrc account has item permissions.";
        return;
      }

      let headerRowIndex: number;

      try {
        // Check for header row
        headerRowIndex = getIndexOfHeaderRowOrError({
          headerRow: CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value),
          matrix: ctx.state.csvData!,
        });
      } catch (e) {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = `Failed to parse CSV data: ${(e as Error).toString()}`;
        return;
      }

      // Group rows
      const destinationRowMap: Map<string, ICreatePackageCsvRow[]> = new Map();

      const COLUMNS: string[] = CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value);

      const keyvalRows: ICreatePackageCsvRow[] = convertMatrixIntoKeyValRows<ICreatePackageCsvRow>({
        // Chop off everything that is not data and has nonzero length
        matrix: ctx.state.csvData.slice(headerRowIndex + 1).filter((x) => x.length > 0),
        columns: COLUMNS,
      });

      // Group all rows that dump into the same package
      for (const keyvalRow of keyvalRows) {
        const key = keyvalRow[CreatePackageCsvColumns.NEW_PACKAGE_TAG];
        if (!destinationRowMap.has(key)) {
          destinationRowMap.set(key, [keyvalRow]);
        } else {
          destinationRowMap.get(key)!.push(keyvalRow);
        }
      }

      const rowGroups: ICreatePackageCsvRowGroup[] = [...destinationRowMap.entries()].map(
        ([destinationLabel, dataRows]) => ({
          destinationLabel,
          dataRows,
          messages: [],
          warnings: [],
          errors: [],
          // TODO this might not be necessary
          parsedData: null,
        })
      );

      // Preprocess values between rowGroups
      const aggregateSourcePackageData: Map<
        string,
        {
          quantityUsed: number;
        }
      > = new Map();

      for (const rowGroup of rowGroups) {
        for (const dataRow of rowGroup.dataRows) {
          const key = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];

          if (!aggregateSourcePackageData.has(key)) {
            aggregateSourcePackageData.set(key, {
              quantityUsed: 0,
            });
          }

          aggregateSourcePackageData.get(key)!.quantityUsed += parseFloat(
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED]
          );
        }
      }

      // Lookup maps
      const packageMap: Map<string, IIndexedPackageData> = new Map(
        packages.map((x) => [x.Label, x])
      );
      const tagMap: Map<string, IIndexedTagData> = new Map(tags.map((x) => [x.Label, x]));
      const itemMap: Map<string, IItemData> = new Map(items.map((x) => [x.Name, x]));
      const locationMap: Map<string, ILocationData> = new Map(locations.map((x) => [x.Name, x]));

      // Validate each rowgroup and select default values if necessary
      for (const rowGroup of rowGroups) {
        // CHECK
        // Source package tags match active packages
        //
        // This check must come first - defaults are derived from the source package
        for (const dataRow of rowGroup.dataRows) {
          const srcTag = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.SOURCE_PACKAGE_TAG);

          if (!packageMap.has(srcTag)) {
            rowGroup.errors.push({
              text: `Source package ${srcTag} does not match an active package`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // CHECK
        // New package tag matches available package tag
        for (const dataRow of rowGroup.dataRows) {
          const newTag = dataRow[CreatePackageCsvColumns.NEW_PACKAGE_TAG];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.NEW_PACKAGE_TAG);

          if (!tagMap.has(newTag)) {
            rowGroup.errors.push({
              text: `New package tag ${newTag} does not match an active tag`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // CHECK
        // New package tag is of correct type
        for (const dataRow of rowGroup.dataRows) {
          const newTag = dataRow[CreatePackageCsvColumns.NEW_PACKAGE_TAG];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.NEW_PACKAGE_TAG);

          const tag = tagMap.get(newTag);

          if (!tag) {
            continue;
          }

          if (!tag.TagTypeName.includes("Package")) {
            rowGroup.errors.push({
              text: `New package tag ${newTag} is not the correct tag type: ${tag.TagTypeName}`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // SET DEFAULT
        // Packaged date
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.PACKAGED_DATE;
          if (!dataRow[key]) {
            dataRow[key] = todayIsodate();
            rowGroup.messages.push({
              text: `Used default value for packaged date: ${todayIsodate()}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // All dates within group match
        const uniquePackagedDates = new Set(
          rowGroup.dataRows.map((x) => x[CreatePackageCsvColumns.PACKAGED_DATE])
        );

        if (uniquePackagedDates.size !== 1) {
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.PACKAGED_DATE);

          rowGroup.errors.push({
            text: `Packaged dates for output package ${rowGroup.destinationLabel} must match: ${[
              ...uniquePackagedDates,
            ].join()}`,
            cellCoordinates: rowGroup.dataRows.map((x) => ({ rowIndex: x.Index, columnIndex })),
          });
        }

        const packageDate = [...uniquePackagedDates][0];

        // CHECK
        // Date is valid isodate
        const parsedPackagedDate = Date.parse(packageDate);
        if (Number.isNaN(parsedPackagedDate)) {
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.PACKAGED_DATE);

          rowGroup.errors.push({
            text: `Packaged date for output package ${rowGroup.destinationLabel} invalid: ${packageDate}`,
            cellCoordinates: rowGroup.dataRows.map((x) => ({ rowIndex: x.Index, columnIndex })),
          });
        }

        // SET DEFAULT
        // Item
        for (const dataRow of rowGroup.dataRows) {
          const pkg = packageMap.get(dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]);

          if (!pkg) {
            continue;
          }

          const key = CreatePackageCsvColumns.ITEM_NAME;
          if (!dataRow[key]) {
            dataRow[key] = pkg.Item.Name;
            rowGroup.messages.push({
              text: `Used default value for item: ${pkg.Item.Name}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // Item exists
        for (const dataRow of rowGroup.dataRows) {
          const itemName = dataRow[CreatePackageCsvColumns.ITEM_NAME];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.ITEM_NAME);

          if (!itemMap.has(itemName)) {
            rowGroup.errors.push({
              text: `Item ${itemName} does not match an active item`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // SET DEFAULT
        // Location
        for (const dataRow of rowGroup.dataRows) {
          const pkg = packageMap.get(dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]);

          if (!pkg) {
            continue;
          }

          const key = CreatePackageCsvColumns.LOCATION_NAME;
          if (!dataRow[key]) {
            dataRow[key] = pkg.LocationName || "";
            rowGroup.messages.push({
              text: `Used default value for location: ${pkg.LocationName}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // Location exists
        for (const dataRow of rowGroup.dataRows) {
          const locationName = dataRow[CreatePackageCsvColumns.LOCATION_NAME];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.LOCATION_NAME);

          if (!itemMap.has(locationName)) {
            rowGroup.errors.push({
              text: `Location ${locationName} does not match an active location`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // SET DEFAULT
        // Source package quantity unit of measure
        for (const dataRow of rowGroup.dataRows) {
          const pkg = packageMap.get(dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]);

          if (!pkg) {
            continue;
          }

          const key = CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE;
          if (!dataRow[key]) {
            dataRow[key] = pkg.Item.UnitOfMeasureName;
            rowGroup.messages.push({
              text: `Used default value for unit of measure: ${pkg.Item.UnitOfMeasureName}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // Source package item unit of measure matches quantity used unit of measure
        for (const dataRow of rowGroup.dataRows) {
          const srcPackageTag = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];
          const sourcePackageQuantityUnitOfMeasure =
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE];

          if (!packageMap.get(srcPackageTag)) {
            continue;
          }

          const srcPackageItem = packageMap.get(srcPackageTag)!.Item;
          const columnIndex = COLUMNS.indexOf(
            CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE
          );

          if (!(await fuzzyUnitsMatch(srcPackageItem.Name, sourcePackageQuantityUnitOfMeasure))) {
            rowGroup.errors.push({
              text: `Source item unit and quantity used unit do not match`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex,
                },
              ],
            });
          }
        }

        // SET DEFAULT
        // Output quantity unit of measure
        for (const dataRow of rowGroup.dataRows) {
          const item = itemMap.get(dataRow[CreatePackageCsvColumns.ITEM_NAME]);

          if (!item) {
            continue;
          }

          const key = CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE;
          if (!dataRow[key]) {
            dataRow[key] = item.Name;
            rowGroup.messages.push({
              text: `Used default value for item: ${item.Name}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // Output item unit matches output quantity unit
        for (const dataRow of rowGroup.dataRows) {
          const item = itemMap.get(dataRow[CreatePackageCsvColumns.ITEM_NAME]);

          if (!item) {
            continue;
          }

          if (
            !(await fuzzyUnitsMatch(
              item.UnitOfMeasureName,
              dataRow[CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE]
            ))
          ) {
            rowGroup.errors.push({
              text: `New package unit and new package item unit do not match`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(CreatePackageCsvColumns.ITEM_NAME),
                },
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE),
                },
              ],
            });
          }
        }

        // SET DEFAULT
        // Output quantity
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY;

          // If unit of measure does not match, fall through
          if (
            !(await fuzzyUnitsMatch(
              dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE],
              dataRow[CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE]
            ))
          ) {
            continue;
          }

          if (!dataRow[key]) {
            const inputTotal: number = rowGroup.dataRows
              .map((x) => parseFloat(x[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED]))
              .reduce((a, b) => a + b, 0);

            dataRow[key] = inputTotal.toString();
            rowGroup.messages.push({
              text: `Used default output quantity: ${inputTotal} ${
                dataRow[CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE]
              }`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // Source package quantity used does not exceed total
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED;

          // If unit of measure does not match, fall through
          if (
            !(await fuzzyUnitsMatch(
              dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE],
              dataRow[CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE]
            ))
          ) {
            continue;
          }

          const sourcePkg = packageMap.get(dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG])!;

          const sourcePkgUsedQuantity = aggregateSourcePackageData.get(
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]
          )!.quantityUsed;

          if (sourcePkgUsedQuantity > sourcePkg.Quantity) {
            rowGroup.errors.push({
              text: `Source package ${sourcePkg.Label} only contains ${sourcePkg.Quantity} ${sourcePkg.UnitOfMeasureAbbreviation} but ${sourcePkgUsedQuantity} is being used`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.Index,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // SET DEFAULT
        // Expiration date defaults to maximum of parent packages
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.EXPIRATION_DATE;

          const previousExpirationDate = dataRow[key];

          if (!dataRow[key] && !!previousExpirationDate) {
            // Default to the latest expiration date
            dataRow[key] = rowGroup.dataRows
              .map(
                (x) =>
                  packageMap.get(x[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG])!.ExpirationDate ??
                  ""
              )
              .sort()[rowGroup.dataRows.length - 1];
          }
        }

        // TODO flood fill empty values

        // CHECK
        // For each group, all output package values must match and be non-empty
        for (const dataRow of rowGroup.dataRows) {
          const keys: CreatePackageCsvColumns[] = [
            CreatePackageCsvColumns.NEW_PACKAGE_TAG,
            CreatePackageCsvColumns.LOCATION_NAME,
            CreatePackageCsvColumns.ITEM_NAME,
            CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY,
            CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE,
            CreatePackageCsvColumns.PACKAGED_DATE,
            CreatePackageCsvColumns.NOTE,
            CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER,
            CreatePackageCsvColumns.IS_DONATION,
            CreatePackageCsvColumns.IS_TRADE_SAMPLE,
            CreatePackageCsvColumns.EXPIRATION_DATE,
          ];

          for (const key of keys) {
            const set = new Set(rowGroup.dataRows.map((x) => x[key]));

            if (set.size > 1) {
              // TODO
            }
          }
        }
      }

      ctx.state.rowGroups = rowGroups;

      // Parsed just means finished with no critical errors.
      // TODO: check that all error fields are empty before enabling
      // a submit button.
      ctx.state.status = PackageCsvStatus.PARSED;
    },
    [CreatePackageCsvActions.GENERATE_CSV_TEMPLATE]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {}
    ) => {
      // await createPackageCsvTemplateSheetOrError(data.columns);
      const csvFile: ICsvFile = {
        filename: "t3_create_package_csv_template",
        data: [CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value)],
      };

      downloadCsvFile({ csvFile });
    },
  },
};

export const createPackageCsvReducer = (state: ICreatePackageCsvState): ICreatePackageCsvState => ({
  ...state,
  ...inMemoryState,
});
