import { ICsvFile, IPluginState } from "@/interfaces";
import { toastManager } from "@/modules/toast-manager.module";
import { downloadCsvFile } from "@/utils/csv";
import { readCsvFile } from "@/utils/file";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import { hasPlusImpl } from "@/utils/plus";
import { ActionContext } from "vuex";
import {
  CsvFillToolActions,
  CsvFillToolGetters,
  CsvFillToolMutations,
  PER_ROW_DELAY_MS,
} from "./consts";
import { ICsvFillToolState } from "./interfaces";
import {
  buildT3CsvGridData,
  getSecondaryAttribute,
  maybeHandleAutocomplete,
  setCheckboxValue,
  setImageInputValue,
  setSelectValue,
  setTextareaValue,
  setTextInputValue,
} from "./utils";

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
    [CsvFillToolActions.DUMP_FORM]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {}
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        throw new Error("Cannot access modal");
      }

      const { title, filename, ngRepeatSelectors, ngModelSelectors, columns } =
        buildT3CsvGridData(modal);

      const topLevelSections = modal.querySelectorAll(`[ng-repeat="${ngRepeatSelectors[0]}"]`);

      const dataRows: string[][] = [];

      for (const section of topLevelSections) {
        const queues: string[][] = columns.map(() => []);

        for (const [colIdx, columnName] of columns.entries()) {
          const ngRepeat = ngRepeatSelectors[colIdx];
          const ngModel = ngModelSelectors[colIdx];

          const secondaryAttribute = getSecondaryAttribute(ngModel);

          const inputs = [
            ...section.querySelectorAll(
              `[ng-repeat="${ngRepeat}"] [${secondaryAttribute}="${ngModel}"]`
            ),
          ];

          for (const input of inputs) {
            if (input.nodeName === "SELECT") {
              const match = [...(input as HTMLSelectElement).querySelectorAll("option")].find(
                (x) => x.value === (input as HTMLSelectElement).value
              );
              if (match) {
                if (match.hasAttribute("label")) {
                  queues[colIdx].push(match.getAttribute("label") ?? "");
                } else {
                  queues[colIdx].push(match.getAttribute("value") ?? "");
                }
              }
            } else {
              let value: string = (input as HTMLInputElement).value;

              if (input.getAttribute("type") === "checkbox") {
                if ((input as HTMLInputElement).checked) {
                  value = "yes";
                } else {
                  value = "";
                }
              }

              queues[colIdx].push(value);
            }
          }
        }

        while (queues.some((arr) => arr.length > 0)) {
          const row = queues.map((x) => x.shift() ?? "");

          dataRows.push(row);
        }
      }

      const matrix = [ngRepeatSelectors, ngModelSelectors, columns, ...dataRows];

      const csvFile: ICsvFile = {
        filename,
        data: matrix,
      };

      downloadCsvFile({ csvFile });
    },
    [CsvFillToolActions.DOWNLOAD_TEMPLATE]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {}
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        throw new Error("Cannot access modal");
      }

      const { title, filename, ngRepeatSelectors, ngModelSelectors, columns } =
        buildT3CsvGridData(modal);

      const csvFile: ICsvFile = {
        filename,
        data: [ngRepeatSelectors, ngModelSelectors, columns],
      };

      downloadCsvFile({ csvFile });
    },
    [CsvFillToolActions.FILL_CSV_INTO_MODAL_FORM]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {
        file: File;
        preloadedFiles: File[];
      }
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        throw new Error("Cannot access modal");
      }

      // Disable autocomplete delay by removing attribute
      [...modal.querySelectorAll("[typeahead-wait-ms]")].map((x) => {
        x.removeAttribute("typeahead-wait-ms");
      });

      const csvData = await readCsvFile(data.file);

      // Remove empty rows:
      // [], [""], ["  "]
      const filteredCsvData = csvData.filter(
        (arr) => arr.length > 0 && !arr.every((str) => str.trim() === "")
      );

      // 3 header rows:
      // - ngRepeat
      // - ngModel
      // - column name
      const headerRows: string[][] = filteredCsvData.slice(0, 3);
      const dataRows: string[][] = filteredCsvData.slice(3);

      for (const [rowIdx, dataRow] of dataRows.entries()) {
        if (!hasPlusImpl() && rowIdx > 4) {
          toastManager.openToast(
            "Autofill is limited to 5 rows with the free plan. For unlimited autofills, subscribe to T3+ at trackandtrace.tools/plus",
            {
              title: "Row limit reached",
              autoHideDelay: 3000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );

          break;
        }

        // The default state of a Metrc form always has at least one row
        if (rowIdx > 0) {
          // Track ng repeat values that are "full rows"
          const ngRepeats: Set<string> = new Set();

          for (const [colIdx, cellValue] of dataRow.entries()) {
            const ngRepeat = headerRows[0][colIdx];

            // Note a non-null value in this ng repeat
            if (cellValue.trim() !== "") {
              ngRepeats.add(ngRepeat);
            }
          }

          const allAddButtons = [...modal.querySelectorAll(`[ng-click^="addLine("]`)];

          // Start a new top-level row
          if (ngRepeats.has("line in repeaterLines")) {
            allAddButtons[allAddButtons.length - 1].dispatchEvent(new Event("click"));
          } else {
            for (const ngRepeat of ngRepeats) {
              // line.Ingredients
              const id = ngRepeat.split(" in ")[1].trim();

              const buttons = allAddButtons.filter((x) => x.getAttribute("ng-click")!.includes(id));

              const targetButton = buttons[buttons.length - 1];

              targetButton.dispatchEvent(new Event("click"));
            }
          }
        }

        // Rows are now initialized, fill cell data into corresponding inputs
        for (const [colIdx, cellValue] of dataRow.entries()) {
          // Uploading images requires a brief delay in between rows
          let requiresTimeout = false;

          const ngRepeat = headerRows[0][colIdx];
          const ngModel = headerRows[1][colIdx];

          if (cellValue.trim() === "") {
            continue;
          }

          const secondaryAttribute = getSecondaryAttribute(ngModel);

          if (secondaryAttribute === "data-type") {
            requiresTimeout = true;
            break;
          }

          // Apply per-row delay
          if (requiresTimeout) {
            // Wait for select buttons to render
            await new Promise((resolve) => setTimeout(resolve, PER_ROW_DELAY_MS));
          }

          // Locate the form field corresponding to this value
          const formInputFieldElements = modal.querySelectorAll(
            `[ng-repeat="${ngRepeat}"] [${secondaryAttribute}="${ngModel}"]`
          );
          const formInputFieldElement = formInputFieldElements[formInputFieldElements.length - 1];

          debugger;

          // Undefined
          console.log(formInputFieldElement);

          if (formInputFieldElement.nodeName === "INPUT") {
            if (formInputFieldElement.getAttribute("type") === "checkbox") {
              setCheckboxValue(formInputFieldElement as HTMLInputElement, cellValue);
            } else if (formInputFieldElement.getAttribute("data-role") === "upload") {
              setImageInputValue(
                formInputFieldElement as HTMLInputElement,
                cellValue,
                data.preloadedFiles
              );
            } else {
              setTextInputValue(formInputFieldElement as HTMLInputElement, cellValue);
            }

            await maybeHandleAutocomplete(formInputFieldElement);
          } else if (formInputFieldElement.nodeName === "SELECT") {
            setSelectValue(formInputFieldElement as HTMLSelectElement, cellValue);
          } else if (formInputFieldElement.nodeName === "TEXTAREA") {
            setTextareaValue(formInputFieldElement as HTMLTextAreaElement, cellValue);
          } else {
            console.log("Unsupported input type, skipping");
          }
        }
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
