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
  FORM_RENDER_DELAY_MS,
  HIDDEN_ROW_ATTRIBUTES,
} from "./consts";
import { ICsvFillToolState } from "./interfaces";
import {
  buildT3CsvGridData,
  getSecondaryAttribute,
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
        await buildT3CsvGridData(modal);

      const topLevelSections = modal.querySelectorAll(`[ng-repeat="${ngRepeatSelectors[0]}"]`);

      const csvCellRows: string[][] = [];

      for (const section of topLevelSections) {
        const queues: string[][] = columns.map(() => []);

        for (const [xIndex, columnName] of columns.entries()) {
          const ngRepeat = ngRepeatSelectors[xIndex];
          const ngModel = ngModelSelectors[xIndex];

          // Either ng-model or data-type (if file input)
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
                  queues[xIndex].push(match.getAttribute("label") ?? "");
                } else {
                  queues[xIndex].push(match.getAttribute("value") ?? "");
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

              queues[xIndex].push(value);
            }
          }
        }

        while (queues.some((arr) => arr.length > 0)) {
          const row = queues.map((x) => x.shift() ?? "");

          csvCellRows.push(row);
        }
      }

      const matrix = [ngRepeatSelectors, ngModelSelectors, columns, ...csvCellRows];

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
        await buildT3CsvGridData(modal);

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
      const csvCellRows: string[][] = filteredCsvData.slice(3);

      for (const [yIndex, csvCellRow] of csvCellRows.entries()) {
        if (!hasPlusImpl() && yIndex > 4) {
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

        // Track ng repeat values that are "full rows"
        const ngRepeats: Set<string> = new Set();

        for (const [xIndex, csvCellValue] of csvCellRow.entries()) {
          const ngRepeat = headerRows[0][xIndex];

          // Note a non-null value in this ng repeat
          if (csvCellValue.trim() !== "") {
            ngRepeats.add(ngRepeat);
          }
        }

        const allAddButtons = [...modal.querySelectorAll(`[ng-click^="addLine("]`)];

        console.log({ ngRepeats });
        // debugger;

        if (yIndex > 0) {
          // Start a new top-level row
          if (ngRepeats.has("line in repeaterLines")) {
            allAddButtons[allAddButtons.length - 1].dispatchEvent(new Event("click"));
          } else {
            for (const ngRepeat of ngRepeats) {
              // line.Ingredients
              const id = ngRepeat.split(" in ")[1].trim();

              const buttons = allAddButtons.filter((x) => x.getAttribute("ng-click")!.includes(id));

              const targetButton = buttons[buttons.length - 1];

              // let clickToOpenFirst = false;
              // let requiresRenderDelay = false;

              let skip = false;

              for (const hiddenRowAttribute of HIDDEN_ROW_ATTRIBUTES) {
                if (targetButton.getAttribute('ng-click')!.includes(hiddenRowAttribute.ngClickPartial)) {
                  skip = true;
                  break;
                }
              }

              if (skip) {
                continue;
              }

              // The default state of a Metrc form usually has at least one row,
              // exceptions to this are handled in the next if block
              // if (yIndex > 0 || clickToOpenFirst) {
              console.log("clicking button");
              targetButton.dispatchEvent(new Event("click"));

              // if (requiresRenderDelay) {
              //   await new Promise((resolve) => setTimeout(resolve, FORM_RENDER_DELAY_MS));
              // }
              // }
            }
          }
        }

        let delay = false;

        for (const [xIndex, csvCellValue] of csvCellRow.entries()) {
          // const ngRepeat = headerRows[0][xIndex];
          const ngModel = headerRows[1][xIndex];

          const hiddenMatch = HIDDEN_ROW_ATTRIBUTES.find((x) => x.ngModel === ngModel);

          if (csvCellValue.trim() !== "" && !!hiddenMatch) {
            const addModelButtons = [...modal.querySelectorAll(`[ng-click^="addLine("]`)].filter(
              (x) => x.getAttribute("ng-click")?.includes(hiddenMatch.ngClickPartial)
            );

            if (addModelButtons.length === 0) {
              continue;
            }

            const addModelButton = addModelButtons[addModelButtons.length - 1] as HTMLElement;
            console.log(`click2 ${hiddenMatch.ngClickPartial}`);
            addModelButton.click();

            delay = delay || hiddenMatch.requiresRenderDelay;
          }
        }

        if (delay) {
          // Allow the selects to render
          await new Promise((resolve) => setTimeout(resolve, FORM_RENDER_DELAY_MS));
        }

        // Rows are now initialized, fill cell data into corresponding inputs
        for (const [xIndex, csvCellValue] of csvCellRow.entries()) {
          const ngRepeat = headerRows[0][xIndex];
          const ngModel = headerRows[1][xIndex];

          if (csvCellValue.trim() === "") {
            continue;
          }

          const secondaryAttribute = getSecondaryAttribute(ngModel);

          // Locate the form field corresponding to this value
          const formInputFieldElements = modal.querySelectorAll(
            `[ng-repeat="${ngRepeat}"] [${secondaryAttribute}="${ngModel}"]`
          );

          // Select the last one
          const formInputFieldElement = formInputFieldElements[formInputFieldElements.length - 1];

          if (formInputFieldElement.nodeName === "INPUT") {
            if (formInputFieldElement.getAttribute("type") === "checkbox") {
              await setCheckboxValue(formInputFieldElement as HTMLInputElement, csvCellValue);
              continue;
            }

            if (formInputFieldElement.getAttribute("data-role") === "upload") {
              await setImageInputValue(
                formInputFieldElement as HTMLInputElement,
                csvCellValue,
                data.preloadedFiles
              );
              continue;
            }

            // Regular text input OR autocomplete input
            await setTextInputValue(formInputFieldElement as HTMLInputElement, csvCellValue);
            continue;
          }

          if (formInputFieldElement.nodeName === "SELECT") {
            await setSelectValue(formInputFieldElement as HTMLSelectElement, csvCellValue);
            continue;
          }

          if (formInputFieldElement.nodeName === "TEXTAREA") {
            await setTextareaValue(formInputFieldElement as HTMLTextAreaElement, csvCellValue);
            continue;
          }

          console.log("Unsupported input type, skipping");
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
