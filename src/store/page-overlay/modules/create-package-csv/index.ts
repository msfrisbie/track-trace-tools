import { ICsvFile, IIndexedPackageData, IIndexedTagData, IItemData, ILocationData, IPluginState } from '@/interfaces';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { convertMatrixIntoKeyValRows, downloadCsvFile, getIndexOfHeaderRowOrError } from '@/utils/csv';
import { readCsvFile } from '@/utils/file';
import { ActionContext } from 'vuex';
import {
  CreatePackageCsvActions,
  CreatePackageCsvColumns,
  CreatePackageCsvGetters,
  CreatePackageCsvMutations,
  CREATE_PACKAGE_CSV_COLUMNS,
  PackageCsvStatus
} from './consts';
import { ICreatePackageCsvRow, ICreatePackageCsvState } from './interfaces';

const inMemoryState = {
  status: PackageCsvStatus.INITIAL,
  statusMessage: null,
  rowGroups: [],
  csvData: null
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
      data: any,
    ) {
      // state.data = data;
    },
  },
  getters: {
    [CreatePackageCsvGetters.CREATE_PACKAGE_CSV_GETTER]: (
      state: ICreatePackageCsvState,
      getters: any,
      rootState: any,
      rootGetters: any,
    ) => {
      // return state.data
    },
  },
  actions: {
    [CreatePackageCsvActions.RESET]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
        file: File
      },
    ) => {
      ctx.state.status = PackageCsvStatus.INITIAL;
      ctx.state.csvData = null;
      ctx.state.statusMessage = "";
    },
    [CreatePackageCsvActions.IMPORT_CSV]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
        file: File
      },
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
      data: {
      },
    ) => {
      if (!ctx.state.csvData) {
        throw new Error('Cannot parse null CSV data');
      }

      let packages: IIndexedPackageData[];
      let tags: IIndexedTagData[];
      let items: IItemData[];
      let locations: ILocationData[];

      ctx.state.statusMessage = 'Loading data...';

      try {
        packages = await primaryDataLoader.activePackages();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = 'Unable to load packages. Ensure this Metrc account has package permissions.';
        return;
      }

      try {
        tags = await primaryDataLoader.availableTags();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = 'Unable to load tags. Ensure this Metrc account has tag permissions.';
        return;
      }

      try {
        locations = await primaryDataLoader.locations();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = 'Unable to load locations. Ensure this Metrc account has location permissions.';
        return;
      }

      try {
        items = await primaryDataLoader.items();
      } catch {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = 'Unable to load items. Ensure this Metrc account has item permissions.';
        return;
      }

      let headerRowIndex: number;

      try {
        // Check for header row
        headerRowIndex = getIndexOfHeaderRowOrError({
          headerRow: CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value),
          matrix: ctx.state.csvData!
        });
      } catch (e) {
        ctx.state.status = PackageCsvStatus.ERROR;
        ctx.state.statusMessage = `Failed to parse CSV data: ${(e as Error).toString()}`;
        return;
      }

      // Group rows
      const destinationRowMap: Map<string, ICreatePackageCsvRow[]> = new Map();

      const keyvalRows: ICreatePackageCsvRow[] = convertMatrixIntoKeyValRows<ICreatePackageCsvRow>({
        // Chop off everything that is not data and has nonzero length
        matrix: ctx.state.csvData.slice(headerRowIndex + 1).filter((x) => x.length > 0),
        columns: CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value)
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

      const rowGroups = [...destinationRowMap.entries()].map(([destinationLabel, dataRows]) => ({
        dataRows,
        messages: [],
        warnings: [],
        errors: [],
      }));

      // Validate each rowgroup
      for (const rowGroup of rowGroups) {

      }

      ctx.state.rowGroups = rowGroups;

      ctx.state.status = PackageCsvStatus.PARSED;
    },
    [CreatePackageCsvActions.GENERATE_CSV_TEMPLATE]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
      },
    ) => {
      // await createPackageCsvTemplateSheetOrError(data.columns);
      const csvFile: ICsvFile = {
        filename: 't3_create_package_csv_template',
        data: [CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value)]
      };

      downloadCsvFile({ csvFile });
    },
  },
};

export const createPackageCsvReducer = (state: ICreatePackageCsvState): ICreatePackageCsvState => ({
  ...state,
  ...inMemoryState,
});
