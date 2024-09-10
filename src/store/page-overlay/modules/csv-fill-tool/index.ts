import { IPluginState } from "@/interfaces";
import { readCsvFile } from "@/utils/file";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import { ActionContext } from "vuex";
import { CsvFillToolActions, CsvFillToolGetters, CsvFillToolMutations } from "./consts";
import { ICsvFillToolState } from "./interfaces";

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
      data: {
        modal: HTMLElement;
      }
    ) => {
      console.log(data.modal);

      const objectName = data.modal
        .querySelector("legend")
        ?.textContent!.split("#")[0]
        .trim()
        .split(/\s+/)
        .join(" ");

      console.log({ objectName });

      const sections: Element[] = [...data.modal.querySelectorAll(`[ng-repeat]`)].filter((x) => {
        if (x.tagName === "LABEL") {
          return false;
        }

        return true;
      });

      interface IHierarchyNode {
        el: Element;
        name: string;
        childSections: IHierarchyNode[];
        inputs: {
          el: Element;
          ngModel: string;
          name: string;
        }[];
        addSectionButton: Element | null;
      }

      const root: IHierarchyNode = {
        el: data.modal,
        name: "Root",
        childSections: [],
        inputs: [],
        addSectionButton: null
      };

      // BUILD HIERARCHY

      function insertSection(hierarchy: IHierarchyNode, currentElement: Element) {
        for (const hierarchyNode of hierarchy.childSections) {
          if (hierarchyNode.el.contains(currentElement)) {
            insertSection(hierarchyNode, currentElement);

            return;
          }
        }

        const val = currentElement.getAttribute("ng-repeat")!;
        let name: string = val.split(" in ")[0];

        if (name === "line") {
          if (objectName) {
            name = objectName;
          } else {
            name = data.modal.querySelector(".k-window-title")!.textContent!.trim();
          }
        } else {
          name = name[0].toUpperCase() + name.slice(1);
        }

        hierarchy.childSections.push({
          el: currentElement,
          name,
          childSections: [],
          inputs: [],
          addSectionButton: null,
        });
      }

      sections.map((x: Element) => insertSection(root, x));

      // FORM INPUTS

      const templateRow = data.modal.querySelector(".template-row");
      const inputs = [...data.modal.querySelectorAll(`[ng-model]`)].filter((x) => {
        if (x.getAttribute("type") === "hidden") {
          return false;
        }

        if (x.hasAttribute("disabled")) {
          return false;
        }

        if (x.hasAttribute("readonly")) {
          return false;
        }

        if (x.nodeName === "BUTTON") {
          return false;
        }

        if (templateRow && templateRow.contains(x)) {
          return false;
        }

        return true;
      });

      function insertInput(hierarchy: IHierarchyNode, currentInput: Element): boolean {
        for (const node of hierarchy.childSections) {
          if (node.el.contains(currentInput)) {
            const inserted: boolean = insertInput(node, currentInput);

            if (!inserted) {
              const ngModel = currentInput.getAttribute("ng-model")!;

              // Backup name
              let name: string = ngModel;

              // An autocomplete indicates a good column title
              const placeholder = currentInput
                .getAttribute("placeholder")
                ?.match(/Type part of (the )?(.*)\.\.\./);

              if (placeholder) {
                name = placeholder[2].split(/\s+/)
                .map((x) => x[0].toUpperCase() + x.slice(1))
                .join(" ");
              } else {
              // ingredient.FinishDate becomes Ingredient Finish Date
              name = name
                .replaceAll(".", "")
                .split(/(?=[A-Z])/)
                .map((x) => x.trim())
                .map((x) => x[0].toUpperCase() + x.slice(1))
                .filter((x) => !["Id", 'Line'].includes(x))
                .join(" ");
              }

              if (!name.startsWith('Template')) {
                node.inputs.push({
                  name,
                  ngModel,
                  el: currentInput,
                });
              }
            }

            return true;
          }
        }

        return false;
      }

      inputs.map((x: Element) => insertInput(root, x));

      // ADD SECTION BUTTONS

      const addSectionButtons = [...data.modal.querySelectorAll(`[ng-click^="addLine"]`)];

      function maybeInsertAddSectionButton(
        hierarchy: IHierarchyNode,
        currentAddSectionButton: Element
      ): boolean {
        if (!hierarchy.el.contains(currentAddSectionButton)) {
          return false;
        }

        let inserted: boolean = false;

        for (const node of hierarchy.childSections) {
          inserted = maybeInsertAddSectionButton(
            node,
            currentAddSectionButton
          );

          if (inserted) {
            break;
          }
        }

        if (!inserted) {
          hierarchy.addSectionButton = currentAddSectionButton;
        }

        return true;
      }

      console.log({ addSectionButtons });

      addSectionButtons.map((x: Element) => maybeInsertAddSectionButton(root, x));

      function dump(node: IHierarchyNode, depth: number = 0) {
        console.log(`${"  ".repeat(depth)}${node.name}`);
        console.log(`${"  ".repeat(depth)}(${node.inputs.map((x) => x.name).join(",")}`);
        node.childSections.map((h) => dump(h, depth + 1));
      }

      dump(root);

      console.log(root);
    },
    [CsvFillToolActions.CSV_FILL_TOOL_ACTION]: async (
      ctx: ActionContext<ICsvFillToolState, IPluginState>,
      data: {
        file: File;
      }
    ) => {
      const modal = activeMetrcModalOrNull();

      if (!modal) {
        return;
      }

      const csvData = await readCsvFile(data.file);

      console.log(csvData);

      const mutationData: Partial<ICsvFillToolState> = {};

      ctx.commit(CsvFillToolMutations.CSV_FILL_TOOL_MUTATION, mutationData);
    },
  },
};

export const csvFillToolReducer = (state: ICsvFillToolState): ICsvFillToolState => ({
  ...state,
  ...inMemoryState,
});
