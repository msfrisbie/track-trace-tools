import { IHierarchyNode, IModalInput } from "./interfaces";

export function collectInputs(modal: HTMLElement): IModalInput[] {
  const inputData: IModalInput[] = [];

  const ngModelSet = new Set<string>();

  const templateRow = modal.querySelector(".template-row");
  const inputs = [...modal.querySelectorAll(`[ng-model]`)].filter((x) => {
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
    const ngModel = input.getAttribute("ng-model")!;

    if (ngModelSet.has(ngModel)) {
      continue;
    }

    let ngRepeat: string | null = null;
    let el = input;
    let count = 0;

    console.log("New input", input);

    while (true) {
      ngRepeat = el.getAttribute("ng-repeat");

      console.log(ngRepeat);

      if (ngRepeat) {
        break;
      }

      if (count++ > 12) {
        break;
      }

      if (!el.parentElement) {
        // console.log(`No parent element`, input);
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

    inputData.push({
      ngRepeat,
      ngModel,
      el: input,
      name,
    });
  }

  return inputData;
}

export function buildHierarchy(data: { modal: HTMLElement }): IHierarchyNode {
  console.log(data.modal);

  const objectName = data.modal
    .querySelector("legend")
    ?.textContent!.split("#")[0]
    .trim()
    .split(/\s+/)
    .join(" ");

  const sections: Element[] = [...data.modal.querySelectorAll(`[ng-repeat]`)].filter((x) => {
    if (x.tagName === "LABEL") {
      return false;
    }

    return true;
  });

  const root: IHierarchyNode = {
    el: data.modal,
    name: data.modal.querySelector(".k-window-title")!.textContent!.trim(),
    childSections: [],
    inputs: [],
    addSectionButton: null,
  };

  // BUILD HIERARCHY

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

    if (x.nodeName === "DIV") {
      return false;
    }

    if (templateRow && templateRow.contains(x)) {
      return false;
    }

    return true;
  });

  inputs.map((x: Element) => insertInput(root, x));

  // ADD SECTION BUTTONS

  const addSectionButtons = [...data.modal.querySelectorAll(`[ng-click^="addLine"]`)];

  //   console.log({ addSectionButtons });

  addSectionButtons.map((x: Element) => maybeInsertAddSectionButton(root, x));

  return root;
}

export function insertSection(hierarchy: IHierarchyNode, currentElement: Element) {
  for (const hierarchyNode of hierarchy.childSections) {
    if (hierarchyNode.el.contains(currentElement)) {
      insertSection(hierarchyNode, currentElement);

      return;
    }
  }

  const val = currentElement.getAttribute("ng-repeat")!;
  let name: string = val.split(" in ")[0];

  // if (name === "line") {
  //   if (objectName) {
  //     name = objectName;
  //   } else {
  //     name = data.modal.querySelector(".k-window-title")!.textContent!.trim();
  //   }
  // } else {
  name = name[0].toUpperCase() + name.slice(1);
  // }

  hierarchy.childSections.push({
    el: currentElement,
    name,
    childSections: [],
    inputs: [],
    addSectionButton: null,
  });
}

export function insertInput(hierarchy: IHierarchyNode, currentInput: Element): boolean {
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
          name = placeholder[2]
            .split(/\s+/)
            .map((x) => x[0].toUpperCase() + x.slice(1))
            .join(" ");
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

        // if (!name.startsWith('Template')) {
        node.inputs.push({
          name,
          ngModel,
          el: currentInput,
        });
        // }
      }

      return true;
    }
  }

  return false;
}

export function maybeInsertAddSectionButton(
  hierarchy: IHierarchyNode,
  currentAddSectionButton: Element
): boolean {
  if (!hierarchy.el.contains(currentAddSectionButton)) {
    return false;
  }

  let inserted: boolean = false;

  for (const node of hierarchy.childSections) {
    inserted = maybeInsertAddSectionButton(node, currentAddSectionButton);

    if (inserted) {
      break;
    }
  }

  if (!inserted) {
    hierarchy.addSectionButton = currentAddSectionButton;
  }

  return true;
}

export function dump(node: IHierarchyNode, depth: number = 0) {
  console.log(`${"  ".repeat(depth)}${node.name}`);
  console.log(`${"  ".repeat(depth)}(${node.inputs.map((x) => x.name).join(",")})`);
  node.childSections.map((h) => dump(h, depth + 1));
}
