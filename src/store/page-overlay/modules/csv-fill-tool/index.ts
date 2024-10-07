import { ICsvFile, IPluginState } from "@/interfaces";
import { toastManager } from "@/modules/toast-manager.module";
import { downloadCsvFile } from "@/utils/csv";
import { readCsvFile } from "@/utils/file";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import { hasPlusImpl } from "@/utils/plus";
import { ActionContext } from "vuex";
import { CsvFillToolActions, CsvFillToolGetters, CsvFillToolMutations } from "./consts";
import { ICsvFillToolState } from "./interfaces";
import { collectInputs } from "./utils";

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

      // const root = buildHierarchy({ modal });

      // dump(root);

      // console.log(root);
    },
    [CsvFillToolActions.DUMP_FORM]: async (
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
      const filename = `${title
        .replaceAll(/\s+/g, "_")
        .toLocaleLowerCase()}_autofill_${new Date().toISOString()}.t3.csv`;

      const ngRepeatSelectors: string[] = [];
      const ngModelSelectors: string[] = [];
      const columns: string[] = [];

      // let node: IHierarchyNode = root;
      for (const input of inputData) {
        ngRepeatSelectors.push(input.ngRepeat);
        ngModelSelectors.push(input.ngModel);
        columns.push(input.name);
      }
      const topLevelSections = modal.querySelectorAll(`[ng-repeat="${ngRepeatSelectors[0]}"]`);

      const dataRows: string[][] = [];

      for (const section of topLevelSections) {
        const queues: string[][] = columns.map(() => []);

        for (const [colIdx, columnName] of columns.entries()) {
          const ngRepeat = ngRepeatSelectors[colIdx];
          const ngModel = ngModelSelectors[colIdx];

          const inputs = [
            ...section.querySelectorAll(`[ng-repeat="${ngRepeat}"] [ng-model="${ngModel}"]`),
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

      // const root = buildHierarchy({ modal });

      const inputData = collectInputs(modal);

      const title = modal.querySelector(".k-window-title")!.textContent!.trim();
      const filename = `${title
        .replaceAll(/\s+/g, "_")
        .toLocaleLowerCase()}_autofill_template.t3.csv`;

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

      // const root = buildHierarchy({ modal });

      // if (!root.addSectionButton) {
      //   throw new Error("Missing top-level add section button");
      // }

      // const ngRepeatIndex: Map<string, number> = new Map(
      //   [...new Set(headerRows[0])].map((x) => [x, 0])
      // );

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

        // There will never be less than one of each
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

        // Rows are now set, fill this data

        for (const [colIdx, cellValue] of dataRow.entries()) {
          const ngRepeat = headerRows[0][colIdx];
          const ngModel = headerRows[1][colIdx];

          if (cellValue.trim() === "") {
            continue;
          }

          const els = modal.querySelectorAll(`[ng-repeat="${ngRepeat}"] [ng-model="${ngModel}"]`);
          const el = els[els.length - 1];

          console.log(el.nodeName);

          if (el.nodeName === "INPUT") {
            if (el.getAttribute("type") === "checkbox") {
              const shouldBeChecked: boolean = cellValue.trim().length > 0;
              const isChecked: boolean = (el as HTMLInputElement).checked;

              if (shouldBeChecked !== isChecked) {
                (el as HTMLInputElement).click();
              }
            } else {
              (el as HTMLInputElement).value = cellValue;
              el.dispatchEvent(new Event("input"));
            }

            if (el.hasAttribute("uib-typeahead")) {
              let attempts = 0;
              const interval = 50; // milliseconds
              const maxTime = 3000; // milliseconds
              const maxAttempts = maxTime / interval;

              const tryDispatchClick = async () => {
                const success = (() => {
                  try {
                    // @ts-ignore
                    el.nextSibling!.children[0].dispatchEvent(new Event("click"));
                    return true;
                  } catch (error) {
                    return false;
                  }
                })();

                if (success || attempts >= maxAttempts) {
                  return;
                }

                attempts++;
                await new Promise((r) => setTimeout(r, interval));
                await tryDispatchClick();
              };

              await tryDispatchClick();
            }
          } else if (el.nodeName === "SELECT") {
            try {
              (el as HTMLSelectElement).value = [...el.querySelectorAll("option")].filter(
                (x) =>
                  x.textContent?.trim().toLocaleLowerCase() === cellValue.trim().toLocaleLowerCase()
              )[0].value;
              el.dispatchEvent(new Event("change", { bubbles: false }));
            } catch (e) {
              // Failed to set
            }
          } else if (el.nodeName === "TEXTAREA") {
            (el as HTMLTextAreaElement).value = cellValue;
            el.dispatchEvent(new Event("input"));
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
