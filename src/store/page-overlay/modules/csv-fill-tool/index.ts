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
  DELAY_SECTION_GROUP_NAMES,
  FORM_RENDER_DELAY_MS
} from "./consts";
import { ICsvFillToolState } from "./interfaces";
import {
  buildT3CsvGridData,
  getSecondaryAttribute,
  parseNgRepeat,
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

        for (const [colIdx, columnName] of columns.entries()) {
          const ngRepeat = ngRepeatSelectors[colIdx];
          const ngModel = ngModelSelectors[colIdx];

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

      for (const [rowIdx, csvCellRow] of csvCellRows.entries()) {
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

        // Track ng repeat values that are "full rows",
        // Meaning that at least one cell value is filled. This means
        // that a new "row" must be created for that ng-repeat
        const ngRepeats: Set<string> = new Set();

        for (const [colIdx, csvCellValue] of csvCellRow.entries()) {
          const ngRepeat = headerRows[0][colIdx];

          // Note a non-null value in this ng repeat
          if (csvCellValue.trim() !== "") {
            ngRepeats.add(ngRepeat);
          }
        }

        // Special logic for handling new top-level rows
        if (ngRepeats.has("line in repeaterLines")) {
          // The default state of a Metrc form begins with one top-level row
          if (rowIdx > 0) {
            // The last add section button in the form adds new top-level sections
            const topLevelSectionAddButton = [...modal.querySelectorAll(`[ng-click^="addLine("]`)].at(-1)!;

            // Start a new top-level row
            topLevelSectionAddButton.dispatchEvent(new Event("click"));
          }
        }

        // The CSV is parsed from top to bottom, and the form is filled from top to bottom
        // We only care about the last section
        const lastTopLevelSection = [...modal.querySelectorAll(`[ng-repeat="line in repeaterLines"]`)].at(-1)!;

        for (const ngRepeat of ngRepeats) {
          // Example values:
          //
          // ng-repeat="itemIngredient in line.ItemIngredients"
          // ng-click="addLine(line.newLinesCount, line.LabelPhotos); preload.methods.createNewControls('.js-upload-control-label');"
          // ng-click="addLine(line.newLinesCount, line.ItemIngredients); preload.methods.createNewControls();"
          const { sectionName, sectionGroupName } = parseNgRepeat(ngRepeat);

          // This was already handled above
          if (sectionGroupName === 'repeaterLines') {
            continue;
          }

          // Find the add line button for the current ngRepeat value
          const targetButton = [...lastTopLevelSection.querySelectorAll(`[ng-click^="addLine("]`)].filter((x) => x.getAttribute("ng-click")!.includes(sectionGroupName)).at(-1)!;

          // We start at the add button element, and traverse upwards
          // to locate the enclosing ng-repeat section
          let sectionElement: Element | null = targetButton.parentElement;
          while (true) {
            sectionElement = sectionElement?.parentElement!;
            if (sectionElement.hasAttribute('ng-repeat')) {
              break;
            }
            if (sectionElement.nodeName === 'FORM') {
              sectionElement = null;
              break;
            }
          }

          // With this section, we can find all the untagged ng-repeat elements with a selector
          const untaggedSections = [...sectionElement!.querySelectorAll(`[ng-repeat]:not([t3-autofill-used])`)];

          // If the section was initialized with 1 row, this will be untagged,
          // and no action needs to be taken. If there is no initialized row,
          // or the other rows were tagged, it will be 0.
          if (untaggedSections.filter((x) => x.getAttribute('ng-repeat') === ngRepeat).length === 0) {
            targetButton.dispatchEvent(new Event("click"));

            // Photo inputs require a delay to render
            if (DELAY_SECTION_GROUP_NAMES.includes(sectionGroupName)) {
              await new Promise((resolve) => setTimeout(resolve, FORM_RENDER_DELAY_MS));
            }
          }
        }

        // We have now initialized the form so that there is one empty form field
        // for every non-empty CSV cell value.
        //
        // Re-iterate through the CSV and fill cell data into corresponding inputs
        for (const [colIdx, csvCellValue] of csvCellRow.entries()) {
          const ngRepeat = headerRows[0][colIdx];
          const ngModel = headerRows[1][colIdx];

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

        // Tag all ng-repeat elements as used
        [...modal.querySelectorAll('[ng-repeat')].map((x) => x.setAttribute('t3-autofill-used', '1'));
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
