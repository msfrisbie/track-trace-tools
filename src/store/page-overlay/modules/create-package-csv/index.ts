import { PackageState } from "@/consts";
import {
  ICsvFile,
  IIndexedPackageData,
  IIndexedTagData,
  IItemData,
  ILocationData,
  IPluginState,
  IUnitOfMeasure,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import {
  convertMatrixIntoKeyValRows,
  downloadCsvFile,
  getIndexOfHeaderRowOrError,
} from "@/utils/csv";
import { todayIsodate } from "@/utils/date";
import { readCsvFile } from "@/utils/file";
import { fuzzyTrueFalseOrNull } from "@/utils/misc";
import { fuzzyUnitOrError, fuzzyUnitOrNull, fuzzyUnitsMatch } from "@/utils/units";
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
  IRowGroupMessage,
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

function mergeOrAddRowGroupMessage(messages: IRowGroupMessage[], newMessage: IRowGroupMessage) {
  // Merge if possible
  for (const msg of messages) {
    if (msg.text === newMessage.text) {
      for (const newCoordinate of newMessage.cellCoordinates) {
        if (
          !msg.cellCoordinates.find(
            ({ columnIndex, rowIndex }) =>
              columnIndex === newCoordinate.columnIndex && rowIndex === newCoordinate.rowIndex
          )
        ) {
          // Only add coordinate if it doesn't already exist
          msg.cellCoordinates.push(newCoordinate);
        }
      }
      return;
    }
  }

  // Otherwise, append
  messages.push(newMessage);
}

function checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
  rowGroup: ICreatePackageCsvRowGroup,
  key: CreatePackageCsvColumns,
  options: {
    errorIfEmptyString?: boolean;
  } = { errorIfEmptyString: true }
): string | null {
  const uniqueValues: string[] = [...new Set(rowGroup.dataRows.map((x) => x[key]))];

  const columnIndex = COLUMNS.indexOf(key);

  let shouldReturnValue = true;

  if (options?.errorIfEmptyString) {
    for (const dataRow of rowGroup.dataRows) {
      if (dataRow[key].length === 0) {
        shouldReturnValue = false;

        mergeOrAddRowGroupMessage(rowGroup.errors, {
          text: `Column '${key}' for output package ${rowGroup.destinationLabel} is empty`,
          cellCoordinates: rowGroup.dataRows.map((x) => ({ rowIndex: x.RealIndex, columnIndex })),
        });
      }
    }
  }

  if (uniqueValues.length !== 1) {
    shouldReturnValue = false;

    mergeOrAddRowGroupMessage(rowGroup.errors, {
      text: `Column '${key}' for output package ${rowGroup.destinationLabel} must match: ${[
        uniqueValues,
      ].join()}`,
      cellCoordinates: rowGroup.dataRows.map((x) => ({ rowIndex: x.RealIndex, columnIndex })),
    });
  }

  return shouldReturnValue ? uniqueValues[0] : null;
}

const COLUMNS: string[] = CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value);

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
    [CreatePackageCsvGetters.ELIGIBLE_FOR_SUBMIT]: (
      state: ICreatePackageCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      let errorCount = 0;

      for (const rowGroup of state.rowGroups) {
        errorCount += rowGroup.errors.length;
      }

      return errorCount === 0;
    },
    [CreatePackageCsvGetters.TOTAL_ERROR_COUNT]: (
      state: ICreatePackageCsvState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      let errorCount = 0;

      for (const rowGroup of state.rowGroups) {
        errorCount += rowGroup.errors.length;
      }

      return errorCount;
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
      ctx.state.rowGroups = [];
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
        // Auto-strip empty rows
        ctx.state.csvData = (await readCsvFile(data.file)).filter((x) =>
          x.find((y) => y.length > 0)
        );
      } catch (e) {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = `Failed to load CSV data: ${(e as Error).toString()}`;
        return;
      }

      try {
        await ctx.dispatch(CreatePackageCsvActions.PARSE_CSV_DATA);
      } catch (e) {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = `Failed to parse CSV data: ${(e as Error).toString()}`;
      }
    },
    [CreatePackageCsvActions.PARSE_CSV_DATA]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {}
    ) => {
      if (!ctx.state.csvData) {
        throw new Error("Cannot parse null CSV data");
      }

      /* eslint-disable-next-line */
      // TODO use alternate load endpoints from new package window
      let packages: IIndexedPackageData[] | null = null;
      let tags: IIndexedTagData[] | null = null;
      let items: IItemData[] | null = null;
      let locations: ILocationData[] | null = null;

      ctx.state.statusMessage = "Loading data...";

      try {
        // 10 minute cache
        packages = await primaryDataLoader.activePackages(10 * 60 * 1000);
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

      const keyvalRows: ICreatePackageCsvRow[] = convertMatrixIntoKeyValRows<ICreatePackageCsvRow>({
        headerRowIndex,
        matrix: ctx.state.csvData,
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
          parsedData: null,
          mockPackage: null,
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
        /*
         *
         * Flow for each section:
         *
         * 1) SET DEFAULT
         * 2) CHECK
         * 3) ASSIGN PARSED VALUE
         *
         */

        // CHECK
        // Source package tags match active packages
        //
        // This check must come first - defaults are derived from the source package
        for (const dataRow of rowGroup.dataRows) {
          const srcTag = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.SOURCE_PACKAGE_TAG);

          if (!packageMap.has(srcTag)) {
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Source package ${srcTag} does not match an active package`,
              cellCoordinates: [{ rowIndex: dataRow.RealIndex, columnIndex }],
            });
          }
        }

        // CHECK
        // New package tag matches available package tag
        for (const dataRow of rowGroup.dataRows) {
          const newTag = dataRow[CreatePackageCsvColumns.NEW_PACKAGE_TAG];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.NEW_PACKAGE_TAG);

          if (!tagMap.has(newTag)) {
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `New package tag ${newTag} does not match an active tag`,
              cellCoordinates: [{ rowIndex: dataRow.RealIndex, columnIndex }],
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
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `New package tag ${newTag} is not the correct tag type: ${tag.TagTypeName}`,
              cellCoordinates: [{ rowIndex: dataRow.RealIndex, columnIndex }],
            });
          }
        }

        // CHECK
        // New package tags match
        const sharedTagOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.NEW_PACKAGE_TAG
          );

        // ASSIGN TAG VALUE
        const Tag: IIndexedTagData | null = sharedTagOrNull
          ? tagMap.get(sharedTagOrNull) ?? null
          : null;

        // SET DEFAULT
        // Packaged date
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.PACKAGED_DATE;
          if (!dataRow[key]) {
            dataRow[key] = todayIsodate();
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Used default value for packaged date: ${todayIsodate()}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // All dates within group match
        const sharedPackagedDateOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.PACKAGED_DATE
          );

        // CHECK
        // Date is valid isodate
        if (sharedPackagedDateOrNull) {
          const parsedPackagedDate = Date.parse(sharedPackagedDateOrNull);
          if (Number.isNaN(parsedPackagedDate)) {
            const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.PACKAGED_DATE);

            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Packaged date for output package ${rowGroup.destinationLabel} invalid: ${sharedPackagedDateOrNull}`,
              cellCoordinates: rowGroup.dataRows.map((x) => ({
                rowIndex: x.RealIndex,
                columnIndex,
              })),
            });
          }
        }

        // ASSIGN PARSED VALUE
        const ActualDate: string | null = sharedPackagedDateOrNull ?? null;

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
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Used default value for item: ${pkg.Item.Name}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
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
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Item ${itemName} does not match an active item`,
              cellCoordinates: [{ rowIndex: dataRow.RealIndex, columnIndex }],
            });
          }
        }

        // CHECK
        // All items match
        const sharedItemOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.ITEM_NAME
          );

        // ASSIGN PARSED VALUE
        const Item: IItemData | null = sharedItemOrNull
          ? itemMap.get(sharedItemOrNull) ?? null
          : null;

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
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Used default value for location: ${pkg.LocationName}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
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

          if (!locationMap.has(locationName)) {
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Location ${locationName} does not match an active location`,
              cellCoordinates: [{ rowIndex: dataRow.RealIndex, columnIndex }],
            });
          }
        }

        // CHECK
        // All locations match
        const sharedLocationOrNull = checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
          rowGroup,
          CreatePackageCsvColumns.LOCATION_NAME
        );

        // ASSIGN PARSED VALUE
        const Location: ILocationData | null = sharedLocationOrNull
          ? locationMap.get(sharedLocationOrNull) ?? null
          : null;

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
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Used default value for unit of measure: ${pkg.Item.UnitOfMeasureName}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
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

          if (
            !(await fuzzyUnitsMatch(
              srcPackageItem.UnitOfMeasureName,
              sourcePackageQuantityUnitOfMeasure
            ))
          ) {
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Source item unit and quantity used unit do not match`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex,
                },
              ],
            });
          }
        }

        // SET DEFAULT
        // Output quantity unit of measure
        for (const dataRow of rowGroup.dataRows) {
          const pkg = packageMap.get(
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE]
          );
          const item = itemMap.get(dataRow[CreatePackageCsvColumns.ITEM_NAME]);

          let defaultUnitOfMeasure: string | null = null;

          if (item) {
            defaultUnitOfMeasure = item?.UnitOfMeasureName ?? null;
          }

          if (!defaultUnitOfMeasure && pkg) {
            defaultUnitOfMeasure = pkg.UnitOfMeasureAbbreviation;
          }

          if (!defaultUnitOfMeasure) {
            continue;
          }

          const key = CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE;
          if (!dataRow[key]) {
            dataRow[key] = defaultUnitOfMeasure;
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Used default value for unit of measure: ${defaultUnitOfMeasure}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
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
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `New package unit and new package item unit do not match`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex: COLUMNS.indexOf(CreatePackageCsvColumns.ITEM_NAME),
                },
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex: COLUMNS.indexOf(CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE),
                },
              ],
            });
          }
        }

        // CHECK
        // All output units match
        const sharedOutputUnitOrNull = checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
          rowGroup,
          CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE
        );

        // ASSIGN PARSED VALUE
        const UnitOfMeasure: IUnitOfMeasure | null = sharedOutputUnitOrNull
          ? await fuzzyUnitOrError(sharedOutputUnitOrNull)
          : null;

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
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Used default output quantity: ${inputTotal} ${
                dataRow[CreatePackageCsvColumns.NEW_PACKAGE_UNIT_OF_MEASURE]
              }`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // Output quantity is valud
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY;

          if (Number.isNaN(parseFloat(dataRow[key]))) {
            mergeOrAddRowGroupMessage(rowGroup.messages, {
              text: `Output quantity is invalid: ${dataRow[key]}`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // CHECK
        // All output quantities match
        const sharedNewPackageQuantity: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY
          );

        // ASSIGN PARSED VALUE
        const Quantity: number | null = sharedNewPackageQuantity
          ? parseFloat(sharedNewPackageQuantity)
          : null;

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
            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Source package ${sourcePkg.Label} only contains ${sourcePkg.Quantity} ${sourcePkg.UnitOfMeasureAbbreviation} but ${sourcePkgUsedQuantity} is being used`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex: COLUMNS.indexOf(key),
                },
              ],
            });
          }
        }

        // SET DEFAULT
        // Expiration date defaults to maximum of parent packages
        const maxParentPackageExpirationDate: string =
          rowGroup.dataRows
            .map(
              (x) =>
                packageMap.get(x[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG])!.ExpirationDate ?? ""
            )
            .filter((x) => x.length > 0)
            .sort()[rowGroup.dataRows.length - 1] ?? "";

        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.EXPIRATION_DATE;

          // Don't override an existing date
          if (dataRow[key]) {
            continue;
          }

          if (maxParentPackageExpirationDate) {
            dataRow[key] = maxParentPackageExpirationDate;
          }
        }

        // CHECK
        // All expiration dates within group match
        const sharedExpirationDateOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.EXPIRATION_DATE,
            { errorIfEmptyString: false }
          );

        // CHECK
        // Expiration date is valid isodate
        if (sharedExpirationDateOrNull) {
          const parsedExpirationDate = Date.parse(sharedExpirationDateOrNull);
          if (Number.isNaN(parsedExpirationDate)) {
            const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.EXPIRATION_DATE);

            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `Expiration date for output package ${rowGroup.destinationLabel} invalid: ${sharedExpirationDateOrNull}`,
              cellCoordinates: rowGroup.dataRows.map((x) => ({
                rowIndex: x.RealIndex,
                columnIndex,
              })),
            });
          }
        }

        // ASSIGN PARSED VALUE
        const ExpirationDate: string | null = sharedExpirationDateOrNull ?? null;

        // CHECK
        // All note values match
        const sharedNoteOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.NOTE,
            { errorIfEmptyString: false }
          );

        // ASSIGN PARSED VALUE
        const Note = sharedNoteOrNull;

        // CHECK
        // All production batch values match
        const sharedProductionBatchOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER,
            { errorIfEmptyString: false }
          );

        // ASSIGN PARSED VALUE
        const ProductionBatchNumber: string | null = sharedProductionBatchOrNull;

        // ASSIGN PARSED VALUE
        // This must occur after other defauls are set
        const Ingredients: {
          pkg: IIndexedPackageData | null;
          Quantity: number | null;
          UnitOfMeasure: IUnitOfMeasure | null;
        }[] = [];

        for (const dataRow of rowGroup.dataRows) {
          const pkg = packageMap.get(dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG]) ?? null;
          const Quantity =
            parseFloat(dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED]) ?? null;
          const UnitOfMeasure = await fuzzyUnitOrNull(
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE]
          );

          Ingredients.push({
            pkg,
            Quantity,
            UnitOfMeasure,
          });
        }

        // SET DEFAULT
        // IsDonation
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.IS_DONATION;

          // Don't override an existing date
          if (dataRow[key]) {
            continue;
          }

          dataRow[key] = "false";
        }

        // CHECK AND NORMALIZE
        // Valid
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.IS_DONATION;

          const fuzzyBoolean = fuzzyTrueFalseOrNull(dataRow[key]);

          if (fuzzyBoolean === null) {
            const columnIndex = COLUMNS.indexOf(key);

            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `${key} value "${dataRow[key]}" for ${rowGroup.destinationLabel} is invalid`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex,
                },
              ],
            });
          } else {
            dataRow[key] = fuzzyBoolean.toString();
          }
        }

        // CHECK
        // All IsDonation values match
        const sharedIsDonationOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.IS_DONATION
          );

        // ASSIGN PARSED VALUE
        const IsDonation: boolean | null =
          sharedIsDonationOrNull === null
            ? sharedIsDonationOrNull
            : sharedIsDonationOrNull === "true";

        // SET DEFAULT
        // IsTradeSample
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.IS_TRADE_SAMPLE;

          // Don't override an existing date
          if (dataRow[key]) {
            continue;
          }

          dataRow[key] = "false";
        }

        // CHECK AND NORMALIZE
        // Valid
        for (const dataRow of rowGroup.dataRows) {
          const key = CreatePackageCsvColumns.IS_TRADE_SAMPLE;

          const fuzzyBoolean = fuzzyTrueFalseOrNull(dataRow[key]);

          if (fuzzyBoolean === null) {
            const columnIndex = COLUMNS.indexOf(key);

            mergeOrAddRowGroupMessage(rowGroup.errors, {
              text: `${key} value "${dataRow[key]}" for ${rowGroup.destinationLabel} is invalid`,
              cellCoordinates: [
                {
                  rowIndex: dataRow.RealIndex,
                  columnIndex,
                },
              ],
            });
          } else {
            dataRow[key] = fuzzyBoolean.toString();
          }
        }

        // CHECK
        // All IsTradeSample values match
        const sharedIsTradeSampleOrNull: string | null =
          checkAllValuesMatchAndAreNonEmptyAndReturnSharedValueOrNull(
            rowGroup,
            CreatePackageCsvColumns.IS_TRADE_SAMPLE
          );

        // ASSIGN PARSED VALUE
        const IsTradeSample: boolean | null =
          sharedIsTradeSampleOrNull === null
            ? sharedIsTradeSampleOrNull
            : sharedIsTradeSampleOrNull === "true";

        // Merge Parsed
        rowGroup.parsedData = {
          ActualDate,
          Ingredients,
          Item,
          Location,
          Note,
          Quantity,
          ProductionBatchNumber,
          Tag,
          UnitOfMeasure,
          UseSameItem: false,
          IsDonation,
          IsTradeSample,
          ExpirationDate,
        };

        // Fill in these values as much as possible, but
        const mockPackage: IIndexedPackageData = {
          Id: -1,
          PackageState: PackageState.ACTIVE,
          LicenseNumber: (await authManager.authStateOrError()).license,
          TagMatcher: "",
          ExpirationDate,
          Note: Note ?? "",
          Label: Tag?.Label ?? "",
          LocationName: Location?.Name ?? "",
          ProductionBatchNumber: ProductionBatchNumber ?? "",
          Quantity: Quantity ?? 0,
          PackagedDate: ActualDate ?? "",
          UnitOfMeasureAbbreviation: UnitOfMeasure?.Abbreviation ?? "g",
          UnitOfMeasureId: UnitOfMeasure?.Id ?? 0,
          UnitOfMeasureQuantityType: UnitOfMeasure?.QuantityType ?? "WeightBased",
          Item: Item ?? {
            Id: -1,
            AdministrationMethod: "",
            ApprovalStatusDateTime: "",
            ApprovalStatusName: "Approved",
            DefaultLabTestingStateName: "NotRequired",
            Description: "",
            FacilityLicenseNumber: null,
            FacilityName: null,
            IsArchived: false,
            IsUsed: false,
            ItemBrandId: 0,
            ItemBrandName: null,
            LabelImages: [], // Assuming an empty array
            Name: "",
            NumberOfDoses: null,
            PackagingImages: [], // Assuming an empty array
            ProductCategoryName: "",
            ProductCategoryTypeName: "",
            ProductImages: [], // Assuming an empty array
            PublicIngredients: "",
            QuantityTypeName: "WeightBased",
            ServingSize: "",
            StrainName: null,
            SupplyDurationDays: null,
            UnitCbdContent: null,
            UnitCbdContentDose: null,
            UnitCbdContentDoseUnitOfMeasureAbbreviation: null,
            UnitCbdContentUnitOfMeasureAbbreviation: null,
            UnitCbdPercent: null,
            UnitOfMeasureId: 0,
            UnitOfMeasureName: "",
            UnitQuantity: null,
            UnitQuantityUnitOfMeasureAbbreviation: null,
            UnitThcContent: null,
            UnitThcContentDose: null,
            UnitThcContentDoseUnitOfMeasureAbbreviation: null,
            UnitThcContentUnitOfMeasureAbbreviation: null,
            UnitThcPercent: null,
            UnitVolume: null,
            UnitVolumeUnitOfMeasureAbbreviation: null,
            UnitWeight: null,
            UnitWeightUnitOfMeasureAbbreviation: null,
            UnitWeightUnitOfMeasureId: null,
            ExpirationDateConfiguration: "Off",
            SellByDateConfiguration: "Off",
            UseByDateConfiguration: "Off",
          },
          // Empty values
          ArchivedDate: null,
          ContainsRemediatedProduct: false,
          DonationFacilityLicenseNumber: null,
          DonationFacilityName: null,
          FacilityLicenseNumber: null,
          FacilityName: null,
          FinishedDate: null,
          InitialLabTestingState: "NotRequired",
          IsArchived: false,
          IsDonation: false,
          IsDonationPersistent: false,
          IsFinished: false,
          IsInTransit: false,
          IsOnHold: false,
          IsProcessValidationTestingSample: false,
          IsProductionBatch: false,
          IsTestingSample: false,
          IsTradeSample: false,
          IsTradeSamplePersistent: false,
          ItemFromFacilityLicenseNumber: "",
          ItemFromFacilityName: "",
          LabTestingStateDate: "",
          LabTestingStateName: "",
          LastModified: "",
          LocationTypeName: null,
          MultiHarvest: false,
          MultiPackage: false,
          MultiProductionBatch: false,
          PackageType: "ImmaturePlant",
          PackagedByFacilityLicenseNumber: "",
          PackagedByFacilityName: "",
          PatientLicenseNumber: "",
          ProductRequiresRemediation: false,
          ReceivedDateTime: null,
          ReceivedFromFacilityLicenseNumber: null,
          ReceivedFromFacilityName: null,
          ReceivedFromManifestNumber: null,
          RemediationDate: null,
          SourceHarvestNames: "",
          SourcePackageIsDonation: false,
          SourcePackageIsTradeSample: false,
          SourcePackageLabels: "",
          SourceProductionBatchNumbers: "",
          TradeSampleFacilityName: null,
          TradeSampleFacilityLicenseNumber: null,
          TransferManifestNumber: "",
          TransferPackageStateName: null,
          SourceHarvestCount: 0,
          SourcePackageCount: 0,
          SourceProcessingJobCount: 0,
          SourceProcessingJobNumbers: "",
          SourceProcessingJobNames: "",
          MultiProcessingJob: false,
          SellByDate: null,
          UseByDate: null,
          LabTestResultDocumentFileId: null,
          IsOnTrip: false,
          IsOnRetailerDelivery: false,
          PackageForProductDestruction: null,
          Trip: null,
          HasPartial: false,
          IsPartial: false,
        };

        rowGroup.mockPackage = mockPackage;
      }

      ctx.state.rowGroups = rowGroups;

      // Parsed just means finished with no critical errors.
      /* eslint-disable-next-line no-warning-comments */
      // TODO: check that all error fields are empty before enabling
      // a submit button.
      ctx.state.status = PackageCsvStatus.PARSED;

      ctx.state.statusMessage = "Finished parsing CSV";
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
