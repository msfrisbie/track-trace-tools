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
import { readCsvFile } from "@/utils/file";
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
          parsedData: null,
        })
      );

      // Preprocess values between rowGroups
      const aggregatePackageData: Map<
        string,
        {
          quantityUsed: number;
        }
      > = new Map();

      for (const rowGroup of rowGroups) {
        for (const dataRow of rowGroup.dataRows) {
          const key = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];

          if (!aggregatePackageData.has(key)) {
            aggregatePackageData.set(key, {
              quantityUsed: 0,
            });
          }

          aggregatePackageData.get(key)!.quantityUsed += parseFloat(
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_USED]
          );
        }
      }

      // Validate each rowgroup
      for (const rowGroup of rowGroups) {
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

        // CHECK
        // Source package tags match active packages
        for (const dataRow of rowGroup.dataRows) {
          const SRC_TAG = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.SOURCE_PACKAGE_TAG);

          if (!packages.find((x) => x.Label === SRC_TAG)) {
            rowGroup.errors.push({
              text: `Source package ${SRC_TAG} does not match an active package`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // CHECK
        // Item exists
        for (const dataRow of rowGroup.dataRows) {
          const ITEM_NAME = dataRow[CreatePackageCsvColumns.ITEM_NAME];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.ITEM_NAME);

          if (!items.find((x) => x.Name === ITEM_NAME)) {
            rowGroup.errors.push({
              text: `Item ${ITEM_NAME} does not match an active item`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // CHECK
        // Location exists
        for (const dataRow of rowGroup.dataRows) {
          const LOCATION_NAME = dataRow[CreatePackageCsvColumns.LOCATION_NAME];
          const columnIndex = COLUMNS.indexOf(CreatePackageCsvColumns.LOCATION_NAME);

          if (!items.find((x) => x.Name === LOCATION_NAME)) {
            rowGroup.errors.push({
              text: `Location ${LOCATION_NAME} does not match an active location`,
              cellCoordinates: [{ rowIndex: dataRow.Index, columnIndex }],
            });
          }
        }

        // CHECK
        // Source package item unit of measure matches quantity used unit of measure
        for (const dataRow of rowGroup.dataRows) {
          const SOURCE_PACKAGE_TAG = dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_TAG];
          const SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE =
            dataRow[CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE];
          const columnIndex = COLUMNS.indexOf(
            CreatePackageCsvColumns.SOURCE_PACKAGE_QUANTITY_UNIT_OF_MEASURE
          );

          // const srcPackageItem = packages.find((x) => x.Label === SOURCE_PACKAGE_TAG)!.U;

          const item = items.find((x) => x.Name === dataRow[CreatePackageCsvColumns.ITEM_NAME]);

          if (!item) {
            // This error will surface elsewhere, just fall through
            continue;
          }

          // if (item.UnitOfMeasureName !== )
        }

        // CHECK
        // Source package quantity used does not exceed total

        if (rowGroup.errors.length > 0) {
          continue;
        }
        // If no errors, generate parsed data
        const ActualDate = packageDate;

        // rowGroup.parsedData = {
        //   ActualDate
        // }
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
