import { ICsvFile, IPluginState } from "@/interfaces";
import { downloadCsvFile } from "@/utils/csv";
import { readCsvFile } from "@/utils/file";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import { ActionContext } from "vuex";
import { CsvFillToolActions, CsvFillToolGetters, CsvFillToolMutations } from "./consts";
import { ICsvFillToolState } from "./interfaces";
import { buildHierarchy, collectInputs } from "./utils";

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

      // dump(root);

      // console.log(root);
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

      [...modal.querySelectorAll("[typeahead-wait-ms]")].map((x) => {
        x.removeAttribute("typeahead-wait-ms");
      });

      const csvData = await readCsvFile(data.file);

      console.log({ csvData });

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

      console.log({ dataRows });

      for (const [rowIdx, dataRow] of dataRows.entries()) {
        // There will never be less than one of each
        if (rowIdx > 0) {
          // Track ng repeat values that are "full rows"
          const ngRepeats: Set<string> = new Set();

          console.log({ dataRow });

          for (const [colIdx, cellValue] of dataRow.entries()) {
            const ngRepeat = headerRows[0][colIdx];

            // Note a non-null value in this ng repeat
            if (cellValue.trim() !== "") {
              ngRepeats.add(ngRepeat);
            }
          }

          const allAddButtons = [...modal.querySelectorAll(`[ng-click^="addLine("]`)];

          console.log({ ngRepeats });

          // Start a new top-level row
          if (ngRepeats.has("line in repeaterLines")) {
            allAddButtons[allAddButtons.length - 1].dispatchEvent(new Event("click"));
          } else {
            for (const ngRepeat of ngRepeats) {
              // line.Ingredients
              const id = ngRepeat.split(" in ")[1].trim();

              const buttons = allAddButtons.filter((x) => x.getAttribute("ng-click")!.includes(id));

              const targetButton = buttons[buttons.length - 1];

              console.log(id, targetButton.getAttribute("ng-click"));
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

          console.log({ cellValue, el, ngRepeat, ngModel });

          if (el.nodeName === "INPUT") {
            (el as HTMLInputElement).value = cellValue;
            el.dispatchEvent(new Event("input"));

            if (el.hasAttribute("uib-typeahead")) {
              let attempts = 0;
              const interval = 50; // milliseconds
              const maxTime = 500; // milliseconds
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
          }
        }
      }

      // initialize all sections to proper length
      // for (let i = 0; i < dataRows.length - currentRowCount; ++i) {
      //   root.addSectionButton.dispatchEvent(new Event("click", { bubbles: false }));
      // }

      // fill all inputs
      // for (const [rowIdx, dataRow] of dataRows.entries()) {
      //   for (const [colIdx, cellValue] of dataRow.entries()) {
      //     const ngRepeat = headerRows[0][colIdx];
      //     const ngModel = headerRows[1][colIdx];

      //     const els = modal.querySelectorAll(`[ng-repeat="${ngRepeat}"] [ng-model="${ngModel}"]`);
      //     const el = els[rowIdx];

      //     if (!el) {
      //       debugger;
      //     }

      //     if (el.nodeName === "INPUT") {
      //       (el as HTMLInputElement).value = cellValue;
      //       el.dispatchEvent(new Event("input"));

      //       if (el.hasAttribute("uib-typeahead")) {
      //         let attempts = 0;
      //         const interval = 50; // milliseconds
      //         const maxTime = 500; // milliseconds
      //         const maxAttempts = maxTime / interval;

      //         const tryDispatchClick = async () => {
      //           const success = (() => {
      //             try {
      //               // @ts-ignore
      //               el.nextSibling!.children[0].dispatchEvent(new Event("click"));
      //               return true;
      //             } catch (error) {
      //               return false;
      //             }
      //           })();

      //           if (success || attempts >= maxAttempts) {
      //             return;
      //           }

      //           attempts++;
      //           await new Promise((r) => setTimeout(r, interval));
      //           await tryDispatchClick();
      //         };

      //         await tryDispatchClick();
      //       }
      //     } else if (el.nodeName === "SELECT") {
      //       try {
      //         (el as HTMLSelectElement).value = [...el.querySelectorAll("option")].filter(
      //           (x) =>
      //             x.textContent?.trim().toLocaleLowerCase() === cellValue.trim().toLocaleLowerCase()
      //         )[0].value;
      //         el.dispatchEvent(new Event("change", { bubbles: false }));
      //       } catch (e) {
      //         // Failed to set
      //       }
      //     }
      //   }
      // }

      // end

      const mutationData: Partial<ICsvFillToolState> = {};

      ctx.commit(CsvFillToolMutations.CSV_FILL_TOOL_MUTATION, mutationData);
    },
  },
};

export const csvFillToolReducer = (state: ICsvFillToolState): ICsvFillToolState => ({
  ...state,
  ...inMemoryState,
});
