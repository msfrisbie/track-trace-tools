import { ICsvFile, IPluginState } from "@/interfaces";
import { downloadCsvFile } from "@/utils/csv";
import { readCsvFile } from "@/utils/file";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import { ActionContext } from "vuex";
import { CsvFillToolActions, CsvFillToolGetters, CsvFillToolMutations } from "./consts";
import { ICsvFillToolState } from "./interfaces";
import { buildHierarchy, collectInputs, dump } from "./utils";

const inMemoryState = {};

const persistedState = {};

const defaultState: ICsvFillToolState = {
  ...inMemoryState,
  ...persistedState,
};

export const csvFillToolModule = {
  state: () => defaultState,
  mutations: {
    [CsvFillToolMutations.CSV_FILL_TOOL_MUTATION](
      state: ICsvFillToolState,
      data: Partial<ICsvFillToolState> = {}
    ) {
      (Object.keys(data) as Array<keyof ICsvFillToolState>).forEach((key) => {
        const value = data[key];
        if (typeof value !== "undefined") {
          // @ts-ignore
          state[key] = value;
        }
      });
    },
  },
  getters: {
    [CsvFillToolGetters.CSV_FILL_TOOL_GETTER]: (
      state: ICsvFillToolState,
      getters: any,
      rootState: any,
      rootGetters: any
    ) => {
      // return state.data
    },
  },
  actions: {
    [CsvFillToolActions.ANALYZE]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {}
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        throw new Error("Cannot access modal");
      }

      const root = buildHierarchy({ modal });

      dump(root);

      console.log(root);
    },
    [CsvFillToolActions.DOWNLOAD_TEMPLATE]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {}
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        throw new Error("Cannot access modal");
      }

      // const root = buildHierarchy({ modal });

      const inputData = collectInputs(modal);

      const title = modal.querySelector(".k-window-title")!.textContent!.trim();
      const filename = `${title.replaceAll(/\s+/g, "_").toLocaleLowerCase()}_autofill_template.csv`;

      const ngRepeatSelectors: string[] = [];
      const ngModelSelectoprs: string[] = [];
      const columns: string[] = [];

      // let node: IHierarchyNode = root;
      for (const input of inputData) {
        ngRepeatSelectors.push(input.ngRepeat);
        ngModelSelectoprs.push(input.ngModel);
        columns.push(input.name);
      }

      const csvFile: ICsvFile = {
        filename,
        data: [ngRepeatSelectors, ngModelSelectoprs, columns],
      };

      downloadCsvFile({ csvFile });
    },
    [CsvFillToolActions.FILL_CSV_INTO_MODAL_FORM]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {
        file: File;
      }
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        throw new Error("Cannot access modal");
      }

      const csvData = await readCsvFile(data.file);

      // Remove empty rows:
      // [], [""], ["  "]
      const filteredCsvData = csvData.filter(
        (arr) => arr.length > 0 && !arr.every((str) => str.trim() === "")
      );

      const rowCount: number = filteredCsvData.length - 1;

      const root = buildHierarchy({ modal });

      const currentRowCount = root.childSections.length;

      if (!root.addSectionButton) {
        throw new Error("Missing top-level add section button");
      }

      for (let i = 0; i < rowCount - currentRowCount; ++i) {
        root.addSectionButton.dispatchEvent(new Event("click"));
      }

      const mutationData: Partial<ICsvFillToolState> = {};

      ctx.commit(CsvFillToolMutations.CSV_FILL_TOOL_MUTATION, mutationData);
    },
  },
};

export const csvFillToolReducer = (state: ICsvFillToolState): ICsvFillToolState => ({
  ...state,
  ...inMemoryState,
});
