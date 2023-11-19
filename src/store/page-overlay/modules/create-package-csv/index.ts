import { ICsvFile, IPluginState } from '@/interfaces';
import { downloadCsvFile } from '@/utils/csv';
import { readCsvFile } from '@/utils/file';
import { ActionContext } from 'vuex';
import {
  CreatePackageCsvActions,
  CreatePackageCsvGetters,
  CreatePackageCsvMutations,
  CREATE_PACKAGE_CSV_COLUMNS,
  PackageCsvStatus
} from './consts';
import { ICreatePackageCsvState } from './interfaces';

const inMemoryState = {
  status: PackageCsvStatus.INITIAL,
  statusMessage: null,
  rows: [],
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
    [CreatePackageCsvActions.IMPORT_CSV]: async (
      ctx: ActionContext<ICreatePackageCsvState, IPluginState>,
      data: {
        file: File
      },
    ) => {
      ctx.state.csvData = await readCsvFile(data.file);
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
