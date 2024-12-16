import { toastManager } from "@/modules/toast-manager.module";
import { FORM_RENDER_DELAY_MS, HIDDEN_ROW_MODELS } from "./consts";
import { IHierarchyNode, IModalInput } from "./interfaces";

export async function collectInputs(modal: HTMLElement): Promise<IModalInput[]> {
  const inputData: IModalInput[] = [];

  const ngModelSet = new Set<string>();

  // Some Metrc forms have templates, ignore these entirely
  const templateRow = modal.querySelector(".template-row");

  const firstRow = modal.querySelector("form [ng-repeat]") as HTMLElement;

  let delay = false;

  for (const hiddenRowModel of HIDDEN_ROW_MODELS) {
    const addModelButtons = [...firstRow.querySelectorAll(`[ng-click^="addLine("]`)].filter((x) =>
      x.getAttribute("ng-click")?.includes(hiddenRowModel)
    );

    if (addModelButtons.length === 0) {
      continue;
    }

    const addModelButton = addModelButtons[addModelButtons.length - 1] as HTMLElement;
    addModelButton.click();

    delay = true;
  }

  if (delay) {
    await new Promise((resolve) => setTimeout(resolve, FORM_RENDER_DELAY_MS));
  }

  const inputs = [
    ...modal.querySelectorAll(`[ng-model]`),
    ...modal.querySelectorAll(`input[data-role="upload"]`),
  ].filter((x) => {
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

  for (const input of inputs) {
    const ngModel = (input.getAttribute("ng-model") || input.getAttribute("data-type")) as string;

    if (ngModelSet.has(ngModel)) {
      continue;
    }

    ngModelSet.add(ngModel);

    let ngRepeat: string | null = null;
    let el = input;
    let count = 0;

    while (true) {
      ngRepeat = el.getAttribute("ng-repeat");

      if (ngRepeat) {
        break;
      }

      if (count++ > 12) {
        break;
      }

      if (!el.parentElement) {
        continue;
      }

      el = el.parentElement!;
    }

    if (!ngRepeat) {
      continue;
      // throw new Error("Failed to match ngRepeat");
    }

    let name: string = ngModel;

    // An autocomplete indicates a good column title
    const placeholder = input.getAttribute("placeholder")?.match(/Type part of (the )?(.*)\.\.\./);

    if (placeholder) {
      name = placeholder[2]
        .split(/\s+/)
        .map((x) => x[0].toUpperCase() + x.slice(1))
        .join(" ");
    } else if (input.getAttribute("data-role") === "upload") {
      name = input.getAttribute("data-type")!;
    } else {
      // ingredient.FinishDate becomes Ingredient Finish Date
      name = name
        .replaceAll(".", "")
        .split(/(?=[A-Z])/)
        .map((x) => x.trim())
        .map((x) => x[0].toUpperCase() + x.slice(1))
        .filter((x) => !["Id", "Line"].includes(x))
        .join(" ");
    }

    try {
      if (input.getAttribute("type") === "checkbox") {
        const nameCandidate: string | undefined = input.parentElement?.textContent?.trim();

        if (nameCandidate && nameCandidate.length > 0) {
          name = nameCandidate;
        }
      }
    } catch (e) {}

    inputData.push({
      ngRepeat,
      ngModel,
      el: input,
      name,
    });
  }

  for (const hiddenRowModel of HIDDEN_ROW_MODELS) {
    const removeModelButtons = [...firstRow.querySelectorAll(`[ng-click^="removeLine("]`)].filter(
      (x) => x.getAttribute("ng-click")?.includes(hiddenRowModel)
    );

    if (removeModelButtons.length === 0) {
      continue;
    }

    const removeModelButton = removeModelButtons[removeModelButtons.length - 1] as HTMLElement;
    removeModelButton.click();
  }

  return inputData;
}

// export function buildHierarchy(data: { modal: HTMLElement }): IHierarchyNode {
//   const objectName = data.modal
//     .querySelector("legend")
//     ?.textContent!.split("#")[0]
//     .trim()
//     .split(/\s+/)
//     .join(" ");

//   const sections: Element[] = [...data.modal.querySelectorAll(`[ng-repeat]`)].filter((x) => {
//     if (x.tagName === "LABEL") {
//       return false;
//     }

//     return true;
//   });

//   const root: IHierarchyNode = {
//     el: data.modal,
//     name: data.modal.querySelector(".k-window-title")!.textContent!.trim(),
//     childSections: [],
//     inputs: [],
//     addSectionButton: null,
//   };

//   // BUILD HIERARCHY

//   sections.map((x: Element) => insertSection(root, x));

//   // FORM INPUTS

//   const templateRow = data.modal.querySelector(".template-row");
//   const inputs = [...data.modal.querySelectorAll(`[ng-model]`)].filter((x) => {
//     if (x.getAttribute("type") === "hidden") {
//       return false;
//     }

//     if (x.hasAttribute("disabled")) {
//       return false;
//     }

//     if (x.hasAttribute("readonly")) {
//       return false;
//     }

//     if (x.nodeName === "BUTTON") {
//       return false;
//     }

//     if (x.nodeName === "DIV") {
//       return false;
//     }

//     if (templateRow && templateRow.contains(x)) {
//       return false;
//     }

//     return true;
//   });

//   inputs.map((x: Element) => insertInput(root, x));

//   // ADD SECTION BUTTONS

//   const addSectionButtons = [...data.modal.querySelectorAll(`[ng-click^="addLine"]`)];

//   addSectionButtons.map((x: Element) => maybeInsertAddSectionButton(root, x));

//   return root;
// }

// export function insertSection(hierarchy: IHierarchyNode, currentElement: Element) {
//   for (const hierarchyNode of hierarchy.childSections) {
//     if (hierarchyNode.el.contains(currentElement)) {
//       insertSection(hierarchyNode, currentElement);

//       return;
//     }
//   }

//   const val = currentElement.getAttribute("ng-repeat")!;
//   let name: string = val.split(" in ")[0];

//   // if (name === "line") {
//   //   if (objectName) {
//   //     name = objectName;
//   //   } else {
//   //     name = data.modal.querySelector(".k-window-title")!.textContent!.trim();
//   //   }
//   // } else {
//   name = name[0].toUpperCase() + name.slice(1);
//   // }

//   hierarchy.childSections.push({
//     el: currentElement,
//     name,
//     childSections: [],
//     inputs: [],
//     addSectionButton: null,
//   });
// }

// export function insertInput(hierarchy: IHierarchyNode, currentInput: Element): boolean {
//   for (const node of hierarchy.childSections) {
//     if (node.el.contains(currentInput)) {
//       const inserted: boolean = insertInput(node, currentInput);

//       if (!inserted) {
//         const ngModel = currentInput.getAttribute("ng-model")!;

//         // Backup name
//         let name: string = ngModel;

//         // An autocomplete indicates a good column title
//         const placeholder = currentInput
//           .getAttribute("placeholder")
//           ?.match(/Type part of (the )?(.*)\.\.\./);

//         if (placeholder) {
//           name = placeholder[2]
//             .split(/\s+/)
//             .map((x) => x[0].toUpperCase() + x.slice(1))
//             .join(" ");
//         } else {
//           // ingredient.FinishDate becomes Ingredient Finish Date
//           name = name
//             .replaceAll(".", "")
//             .split(/(?=[A-Z])/)
//             .map((x) => x.trim())
//             .map((x) => x[0].toUpperCase() + x.slice(1))
//             .filter((x) => !["Id", "Line"].includes(x))
//             .join(" ");
//         }

//         // if (!name.startsWith('Template')) {
//         node.inputs.push({
//           name,
//           ngModel,
//           el: currentInput,
//         });
//         // }
//       }

//       return true;
//     }
//   }

//   return false;
// }

// export function maybeInsertAddSectionButton(
//   hierarchy: IHierarchyNode,
//   currentAddSectionButton: Element
// ): boolean {
//   if (!hierarchy.el.contains(currentAddSectionButton)) {
//     return false;
//   }

//   let inserted: boolean = false;

//   for (const node of hierarchy.childSections) {
//     inserted = maybeInsertAddSectionButton(node, currentAddSectionButton);

//     if (inserted) {
//       break;
//     }
//   }

//   if (!inserted) {
//     hierarchy.addSectionButton = currentAddSectionButton;
//   }

//   return true;
// }

// export function dump(node: IHierarchyNode, depth: number = 0) {
//   console.log(`${"  ".repeat(depth)}${node.name}`);
//   console.log(`${"  ".repeat(depth)}(${node.inputs.map((x) => x.name).join(",")})`);
//   node.childSections.map((h) => dump(h, depth + 1));
// }

export function getSecondaryAttribute(ngModel: string): string {
  if (ngModel.endsWith("FileSystemIds") || ngModel.endsWith("Photos")) {
    return "data-type";
  }

  return "ng-model";
}

export async function buildT3CsvGridData(modal: HTMLElement): Promise<{
  title: string;
  filename: string;
  ngRepeatSelectors: string[];
  ngModelSelectors: string[];
  columns: string[];
}> {
  const inputData = await collectInputs(modal);

  const title = modal.querySelector(".k-window-title")!.textContent!.trim();
  const filename = `${title.replaceAll(/\s+/g, "_").toLocaleLowerCase()}_autofill_template.t3.csv`;

  const ngRepeatSelectors: string[] = [];
  const ngModelSelectors: string[] = [];
  const columns: string[] = [];

  for (const input of inputData) {
    ngRepeatSelectors.push(input.ngRepeat);
    ngModelSelectors.push(input.ngModel);
    columns.push(input.name);
  }

  return {
    title,
    filename,
    ngRepeatSelectors,
    ngModelSelectors,
    columns,
  };
}

export async function setTextInputValue(inputElement: HTMLInputElement, value: string) {
  inputElement.value = value;
  inputElement.dispatchEvent(new Event("input"));

  await maybeHandleAutocomplete(inputElement);
}

export async function setImageInputValue(
  inputElement: HTMLInputElement,
  value: string,
  preloadedFiles: File[]
) {
  const dataTransfer = new DataTransfer();

  const filenameMatchers: string[] = value.split(",").map((x) => x.trim().toLocaleLowerCase());

  for (const filenameMatcher of filenameMatchers) {
    let matched = false;
    for (const file of preloadedFiles) {
      if (file.name.toLocaleLowerCase().startsWith(filenameMatcher)) {
        dataTransfer.items.add(file);
        matched = true;
        break;
      }
    }
    if (!matched) {
      toastManager.openToast(
        `'${filenameMatcher}' was not matched to a preloaded image, skipping.`,
        {
          title: "Unmatched image",
          autoHideDelay: 5000,
          variant: "warning",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );
    }
  }

  inputElement.files = dataTransfer.files;
  inputElement.dispatchEvent(new Event("change"));

  await new Promise((resolve) => setTimeout(resolve, FORM_RENDER_DELAY_MS));
}

export async function setCheckboxValue(inputElement: HTMLInputElement, value: string) {
  const shouldBeChecked: boolean = value.trim().length > 0;
  const isChecked: boolean = inputElement.checked;

  if (shouldBeChecked !== isChecked) {
    inputElement.click();
  }
}

export async function setSelectValue(inputElement: HTMLSelectElement, value: string) {
  try {
    inputElement.value = [...inputElement.querySelectorAll("option")].filter(
      (x) => x.textContent?.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase()
    )[0].value;
    inputElement.dispatchEvent(new Event("change", { bubbles: false }));
  } catch (e) {
    // Failed to set
  }
}

export async function setTextareaValue(inputElement: HTMLTextAreaElement, value: string) {
  inputElement.value = value;
  inputElement.dispatchEvent(new Event("input"));
}

export async function maybeHandleAutocomplete(inputElement: Element) {
  if (inputElement.hasAttribute("uib-typeahead")) {
    let attempts = 0;
    const interval = 50; // milliseconds
    const maxTime = 3000; // milliseconds
    const maxAttempts = maxTime / interval;

    const tryDispatchClick = async () => {
      const success = (() => {
        try {
          (inputElement.nextSibling! as HTMLElement).children[0].dispatchEvent(new Event("click"));
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
}
