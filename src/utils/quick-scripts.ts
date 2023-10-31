import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import _, { zip } from "lodash-es";
import { setAutocompleteValueOrError, setFormInputValue } from "./metrc-form";

export interface IQuickScript {
  id: string;
  name: string;
  description: string;
  contextLink?: string;
  childOptions?: any[];
  quickScriptFunction: (childOption: any) => void;
}

export enum ColumnGroups {
  ALL = "All",
  MINIMUM = "ID Only",
  DEFAULT = "Reset",
  SIMPLE_PACKAGE = "Min Package",
}

export async function runQuickScript(quickScript: IQuickScript, childOption?: any) {
  analyticsManager.track(MessageType.RAN_QUICK_SCRIPT, { scriptId: quickScript.id });

  // Allow menu to collapse before running quick script
  await new Promise((resolve) => setTimeout(resolve, 0));

  quickScript.quickScriptFunction(childOption);
}

export const QUICK_SCRIPTS: IQuickScript[] = [
  {
    id: "EXPAND_GROWTH_PHASE_TAGS",
    name: "Expand Growth Phase Tags",
    description:
      "Automatically expand a tag range in the Change Growth Phase window to account for the Metrc tag range bug",
    contextLink: "https://track-trace-tools.talkyard.net/-71/metrc-bug-package-out-of-order-error",
    quickScriptFunction: expandGrowthPhaseTags,
  },
  {
    id: "AUTOFILL_TRANSFER_GROSS_WEIGHTS",
    name: "Autofill Transfer Gross Weight",
    description:
      "Automatically fills the Gross Weight and unit of measure fields for the current transfer",
    contextLink:
      "https://track-trace-tools.talkyard.net/-33/feature-request-auto-populate-gross-weights-in-a-transfer-template",
    quickScriptFunction: fillTransferWeights,
  },
  {
    id: "SUM_PACKAGE_QUANTITIES",
    name: "Autosum Package Quantities",
    description:
      "Automatically totals all the source package quantities in the New Packages window and enters it into the new package Quantity input",
    contextLink:
      "https://track-trace-tools.talkyard.net/-27/would-it-be-possible-to-add-a-sum-all-button-for-creating-new-packages",
    quickScriptFunction: sumPackageQuantities,
  },
  {
    id: "CHECK_ALL_PLANTS_FOR_HARVEST_RESTORE",
    name: "Check All Plants For Harvest Restore",
    description:
      "Automatically checks all the plant checkboxes in the Restore Harvested Plants window",
    contextLink:
      "https://track-trace-tools.talkyard.net/-28/auto-click-checkboxes-for-restore-harvest",
    quickScriptFunction: checkAllPlantsForHarvestRestore,
  },
  {
    id: "ADD_PACKAGE_CONTENTS",
    name: "Add Package Contents Fields",
    description: "Bulk add package content fields in the New Package window",
    childOptions: [5, 10, 15, 20, 25],
    quickScriptFunction: addPackageContents,
  },
  {
    id: "SHOW_COLUMNS",
    name: "Show Columns",
    description: "Makes certain Metrc table columns visible",
    quickScriptFunction: showColumns,
    childOptions: [
      ColumnGroups.ALL,
      ColumnGroups.DEFAULT,
      ColumnGroups.MINIMUM,
      ColumnGroups.SIMPLE_PACKAGE,
    ],
  },
  // {
  //   id: "SHOW_ALL_COLUMNS",
  //   name: "Show All Columns",
  //   description: "Makes all Metrc table columns visible",
  //   quickScriptFunction: showAllColumns,
  // },
  // {
  //   id: "SHOW_DEFAULT_COLUMNS",
  //   name: "Show Default Columns",
  //   description: "Resets Metrc table to default columns",
  //   quickScriptFunction: showDefaultColumns,
  // },
  // {
  //   id: "SHOW_ONLY_PRIMARY_COLUMN",
  //   name: "Show Only Primary Column",
  //   description: "Hides all Metrc table columns except for the primary one",
  //   quickScriptFunction: showOnlyPrimaryColumn,
  // },
];

export async function addPackageContents(count: number) {
  let clicks = 0;

  for (let i = 0; i < count; ++i) {
    const button = pageManager.activeModal?.querySelector(
      `[ng-click*="addLine(null, line.Ingredients)"]`
    ) as HTMLButtonElement | null;

    if (button) {
      button.click();
      ++clicks;
    }
  }

  toastManager.openToast(`Added ${clicks} package fields`, {
    title: "Quick Script Success",
    autoHideDelay: 5000,
    variant: "success",
    appendToast: true,
    toaster: "ttt-toaster",
    solid: true,
  });
}

export async function checkAllPlantsForHarvestRestore() {
  const restoreHarvestCheckboxes: HTMLElement[] = [
    ...document.querySelectorAll('#restoreplants-harvest_form input[type="checkbox"]'),
  ] as HTMLElement[];

  restoreHarvestCheckboxes.map((input) => input.click());

  toastManager.openToast(`Checked ${restoreHarvestCheckboxes.length} boxes`, {
    title: "Quick Script Success",
    autoHideDelay: 5000,
    variant: "success",
    appendToast: true,
    toaster: "ttt-toaster",
    solid: true,
  });
}

export async function showColumns(columnGroup: ColumnGroups) {
  console.log(columnGroup);
  switch (columnGroup) {
    case ColumnGroups.MINIMUM:
      showOnlyPrimaryColumn();
      break;
    case ColumnGroups.DEFAULT:
      showDefaultColumns();
      break;
    case ColumnGroups.SIMPLE_PACKAGE:
      showSimplePackageColumns();
      break;
    case ColumnGroups.ALL:
    default:
      showAllColumns();
      break;
  }
}

async function showAllColumns() {
  try {
    const menuButton = document.querySelector(`th .k-header-column-menu`) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

      if (animationContainer) {
        form = animationContainer.querySelector(".k-columns-item");
      }

      if (form) {
        for (const checkbox of form.querySelectorAll(
          `input[type="checkbox"]`
        ) as NodeListOf<HTMLInputElement>) {
          if (!checkbox.checked) {
            checkbox.click();
          }
        }
      }

      // Close the menu
      if (menuButton) {
        menuButton.click();
      }

      toastManager.openToast(`Checked all columns`, {
        title: "Quick Script Success",
        autoHideDelay: 5000,
        variant: "success",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      return;
    }
  } catch {}

  toastManager.openToast(
    `Couldn't find a Metrc table. This quick script only works on Metrc pages with tables.`,
    {
      title: "Quick Script Error",
      autoHideDelay: 5000,
      variant: "warning",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    }
  );
}

async function showDefaultColumns() {
  try {
    [...(document.querySelectorAll(`a[href="#"]`) as NodeListOf<HTMLAnchorElement>)]
      .find((x) => x.innerText.includes("Reset Settings"))!
      .click();
  } catch {
    toastManager.openToast(
      `Couldn't find a Metrc table. This quick script only works on Metrc pages with tables.`,
      {
        title: "Quick Script Error",
        autoHideDelay: 5000,
        variant: "warning",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      }
    );
  }
}

async function showSimplePackageColumns() {
  const simplePackageDataFields = ["Label", "Item.Name", "Item.ProductCategoryName", "Quantity"];

  try {
    const menuButton = document.querySelector(`th .k-header-column-menu`) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

      if (animationContainer) {
        form = animationContainer.querySelector(".k-columns-item");
      }

      if (form) {
        for (const checkbox of form.querySelectorAll(
          `input[type="checkbox"]`
        ) as NodeListOf<HTMLInputElement>) {
          if (simplePackageDataFields.includes(checkbox.getAttribute("data-field")!)) {
            if (!checkbox.checked) {
              checkbox.click();
            }
            continue;
          } else if (checkbox.checked) {
            checkbox.click();
            continue;
          }
        }
      }

      // Close the menu
      if (menuButton) {
        menuButton.click();
      }

      toastManager.openToast(`Checked simple package columns`, {
        title: "Quick Script Success",
        autoHideDelay: 5000,
        variant: "success",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      return;
    }
  } catch {}

  toastManager.openToast(
    `Couldn't find a Metrc table. This quick script only works on Metrc pages with tables.`,
    {
      title: "Quick Script Error",
      autoHideDelay: 5000,
      variant: "warning",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    }
  );
}

async function showOnlyPrimaryColumn() {
  try {
    const menuButton = document.querySelector(`th .k-header-column-menu`) as HTMLElement | null;

    if (menuButton) {
      pageManager.suppressAnimationContainer();

      // This opens the menu and creates the form
      menuButton.click();

      let form = null;
      const animationContainer = pageManager.getVisibleAnimationContainer("Sort Ascending");

      if (animationContainer) {
        form = animationContainer.querySelector(".k-columns-item");
      }

      if (form) {
        for (const [idx, checkbox] of [
          ...(form.querySelectorAll(`input[type="checkbox"]`) as NodeListOf<HTMLInputElement>),
        ].entries()) {
          if (idx === 0) {
            if (!checkbox.checked) {
              checkbox.click();
            }
          } else if (checkbox.checked) {
            checkbox.click();
          }
        }
      }

      // Close the menu
      if (menuButton) {
        menuButton.click();
      }

      toastManager.openToast(`Unchecked all columns`, {
        title: "Quick Script Success",
        autoHideDelay: 5000,
        variant: "success",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });

      return;
    }
  } catch {}

  toastManager.openToast(
    `Couldn't find a Metrc table. This quick script only works on Metrc pages with tables.`,
    {
      title: "Quick Script Error",
      autoHideDelay: 5000,
      variant: "warning",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    }
  );
}

export async function expandGrowthPhaseTags() {
  // Load existing tags

  const availablePlantTags = await dynamicConstsManager.availablePlantTags();

  // Find first row with >1 plantcount

  function getRowInputByNgModel(
    row: HTMLElement,
    ngModelExpression: RowNgModel
  ): HTMLInputElement | HTMLSelectElement | null {
    return row.querySelector(`[ng-model="${ngModelExpression}"]`);
  }

  enum RowNgModel {
    Id = "line.Id",
    PlantsCount = "line.PlantsCount",
    StartingTagId = "line.StartingTagId",
    GrowthPhase = "line.GrowthPhase",
    LocationId = "line.LocationId",
    GrowthDate = "line.GrowthDate",
  }

  let expandedRowCount = 0;
  let newRowCount = 0;

  while (true) {
    const initialRows: HTMLElement[] = [
      ...document.querySelectorAll(`tr[ng-repeat="line in repeaterLines"]`),
    ] as HTMLElement[];

    let targetRow: HTMLElement | null = null;

    let targetRowInitialCount: number = 0;

    // Search through existing rows, find the first one that has a plantCount value > 1
    for (const row of initialRows) {
      const rowPlantCountInput = getRowInputByNgModel(
        row,
        RowNgModel.PlantsCount
      )! as HTMLInputElement;
      const rowCountValue = parseInt(rowPlantCountInput.value, 10);

      if (typeof rowCountValue === "number" && rowCountValue > 1) {
        targetRow = row;
        targetRowInitialCount = rowCountValue;
        await setFormInputValue(rowPlantCountInput, "1");
        break;
      }
    }

    if (!targetRow) {
      break;
    }

    expandedRowCount++;

    const count = targetRowInitialCount - 1;

    for (let i = 0; i < count; ++i) {
      const button = pageManager.activeModal?.querySelector(
        `[ng-click*="addLine(newLinesCount)"]`
      ) as HTMLButtonElement | null;

      if (button) {
        button.click();
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Select tag in each

    const addedRows = [...document.querySelectorAll(`tr[ng-repeat="line in repeaterLines"]`)].slice(
      count * -1
    ) as HTMLElement[];

    // Acquire tags

    const initialTag = getRowInputByNgModel(targetRow, RowNgModel.StartingTagId)!.value;

    const initialIndex = availablePlantTags.findIndex((x) => x.Label === initialTag);

    const tagRange = availablePlantTags.slice(initialIndex, initialIndex + targetRowInitialCount);

    // Skip first tag since it already exists
    tagRange.shift();

    if (tagRange.length !== addedRows.length) {
      // TODO show error for bad tag # and exit
      toastManager.openToast(
        `Couldn't allocate enough tags in this range: needed ${addedRows.length}, found ${tagRange.length}`,
        {
          title: "Quick Script Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );

      return;
    }

    const targetRowPlantId: string = getRowInputByNgModel(targetRow, RowNgModel.Id)!
      .value as string;
    const targetRowGrowthPhase: string = getRowInputByNgModel(targetRow, RowNgModel.GrowthPhase)!
      .value as string;
    const targetRowGrowthDate: string = getRowInputByNgModel(targetRow, RowNgModel.GrowthDate)!
      .value as string;
    const targetRowLocation: string = getRowInputByNgModel(targetRow, RowNgModel.LocationId)!
      .value as string;

    for (const [idx, row] of addedRows.entries()) {
      newRowCount++;
      const tag: string = tagRange[idx].Label;

      await setAutocompleteValueOrError(
        getRowInputByNgModel(row, RowNgModel.Id)! as HTMLInputElement,
        targetRowPlantId
      );
      setFormInputValue(getRowInputByNgModel(row, RowNgModel.GrowthPhase)!, targetRowGrowthPhase);
      setFormInputValue(getRowInputByNgModel(row, RowNgModel.PlantsCount)!, "1");
      await setAutocompleteValueOrError(
        getRowInputByNgModel(row, RowNgModel.StartingTagId)! as HTMLInputElement,
        tag
      );
      setFormInputValue(getRowInputByNgModel(row, RowNgModel.GrowthDate)!, targetRowGrowthDate);
      setFormInputValue(getRowInputByNgModel(row, RowNgModel.LocationId)!, targetRowLocation);
    }
  }

  if (expandedRowCount === 0) {
    toastManager.openToast(`Couldn't find a valid input row`, {
      title: "Quick Script Error",
      autoHideDelay: 5000,
      variant: "danger",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  } else {
    toastManager.openToast(
      `Expanded ${expandedRowCount} tag ranges into ${newRowCount + expandedRowCount} single tags`,
      {
        title: "Quick Script Success",
        autoHideDelay: 5000,
        variant: "success",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      }
    );
  }
}

export async function fillTransferWeights() {
  const packageRows = [
    ...document.querySelectorAll(`tr[ng-repeat="package in destination.Packages"]`),
  ];

  let successCount = 0;
  let skippedCount = 0;

  const quantities: number[] = [];
  const unitOfWeightIds: number[] = [];

  const unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  for (const packageRow of packageRows) {
    const packageInput = packageRow.querySelector(
      `input[ng-model="package.Id"]`
    ) as HTMLInputElement | null;
    const grossWeightInput = packageRow.querySelector(
      `input[ng-model="package.GrossWeight"]`
    ) as HTMLInputElement | null;
    const unitOfMeasureSelect = packageRow.querySelector(
      `select[ng-model="package.GrossUnitOfWeightId"]`
    ) as HTMLSelectElement | null;

    if (!packageInput) {
      skippedCount++;
      continue;
    }

    const packageLabel = packageInput.value;

    if (!packageLabel) {
      skippedCount++;
      continue;
    }

    try {
      const packageData = await primaryDataLoader.activePackage(packageLabel);

      if (packageData.UnitOfMeasureQuantityType === "VolumeBased") {
        skippedCount++;

        toastManager.openToast(
          `Couldn't calculate a weight for package ${packageData.Label} because it is Volume Based`,
          {
            title: "Quick Script Warning",
            autoHideDelay: 5000,
            variant: "warning",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );

        continue;
      } else if (packageData.UnitOfMeasureQuantityType === "CountBased") {
        if (packageData.Item?.UnitWeight && packageData.Item?.UnitWeightUnitOfMeasureId) {
          const quantity: number = packageData.Quantity * packageData.Item.UnitWeight;

          if (grossWeightInput) {
            setFormInputValue(grossWeightInput, _.round(quantity, 3).toString());
          }

          if (unitOfMeasureSelect) {
            setFormInputValue(
              unitOfMeasureSelect,
              `number:${packageData.Item.UnitWeightUnitOfMeasureId}`
            );
          }

          quantities.push(quantity);
          unitOfWeightIds.push(packageData.Item.UnitWeightUnitOfMeasureId);
        } else {
          skippedCount++;

          toastManager.openToast(`Couldn't calculate a weight for package ${packageData.Label}`, {
            title: "Quick Script Warning",
            autoHideDelay: 5000,
            variant: "warning",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          });

          continue;
        }
      } else {
        const quantity: number = packageData.Quantity;

        if (grossWeightInput) {
          setFormInputValue(grossWeightInput, _.round(quantity, 3).toString());
        }

        if (unitOfMeasureSelect) {
          setFormInputValue(unitOfMeasureSelect, `number:${packageData.UnitOfMeasureId}`);
        }

        quantities.push(quantity);
        unitOfWeightIds.push(packageData.UnitOfMeasureId);
      }

      successCount++;
    } catch (e) {
      skippedCount++;
    }
  }

  const grossWeightInput = document.querySelector(
    `input[ng-model="destination.GrossWeight"]`
  ) as HTMLInputElement | null;
  const unitOfMeasureSelect = document.querySelector(
    `select[ng-model="destination.GrossUnitOfWeightId"]`
  ) as HTMLSelectElement | null;

  if (!grossWeightInput || !unitOfMeasureSelect) {
    toastManager.openToast(`Couldn't autofill the destination gross weight: inputs missing`, {
      title: "Quick Script Error",
      autoHideDelay: 5000,
      variant: "danger",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  } else {
    let normalizedGrossWeights: number[] = [];
    let baseUnitOfMeasureId: number = unitsOfMeasure.find(
      (x) => x.IsBaseUnit && x.QuantityType === "WeightBased"
    )!.Id;

    if (
      quantities.length !== unitOfWeightIds.length ||
      quantities.length === 0 ||
      unitOfWeightIds.length === 0
    ) {
      toastManager.openToast(
        `Couldn't autofill the destination gross weight: mismatched extracted data`,
        {
          title: "Quick Script Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        }
      );
    } else {
      for (const [quantity, unitOfWeightId] of zip(quantities, unitOfWeightIds) as [
        number,
        number
      ][]) {
        const unitOfMeasure = unitsOfMeasure.find((x) => x.Id === unitOfWeightId);

        if (!unitOfMeasure) {
          skippedCount++;
          continue;
        }

        normalizedGrossWeights.push(quantity * unitOfMeasure.ToBaseFactor);
      }
    }

    // Attempt conversion to Pounds
    const poundsUnitOfMeasure = unitsOfMeasure.find((x) => x.Name === "Pounds");
    if (poundsUnitOfMeasure) {
      normalizedGrossWeights = normalizedGrossWeights.map(
        (x) => x * poundsUnitOfMeasure.FromBaseFactor
      );
      baseUnitOfMeasureId = poundsUnitOfMeasure.Id;
    }

    setFormInputValue(
      grossWeightInput,
      _.round(
        normalizedGrossWeights.reduce((a, b) => a + b, 0),
        3
      ).toString()
    );
    setFormInputValue(unitOfMeasureSelect, `number:${baseUnitOfMeasureId}`);
  }

  toastManager.openToast(`Autofilled ${successCount} packages`, {
    title: "Quick Script Success",
    autoHideDelay: 5000,
    variant: "success",
    appendToast: true,
    toaster: "ttt-toaster",
    solid: true,
  });

  if (skippedCount > 0) {
    toastManager.openToast(
      `Skipped ${skippedCount} packages. This usually happens if a package input is empty, or the selected package does not have a weight unit of measure.`,
      {
        title: "Quick Script Warning",
        autoHideDelay: 5000,
        variant: "warning",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      }
    );
  }
}

export async function sumPackageQuantities() {
  const packageSets: HTMLElement[] = [
    ...document.querySelectorAll(`[ng-repeat="line in repeaterLines"]`),
  ] as HTMLElement[];

  for (const packageSet of packageSets) {
    const [output, ...inputs] = [
      ...packageSet.querySelectorAll(`input[name*="[Quantity]"]`),
    ] as HTMLInputElement[];

    if (!inputs.length) {
      toastManager.openToast(`0 source packages were found for a package`, {
        title: "Quick Script error",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
      continue;
    }

    setFormInputValue(
      output,
      _.round(
        inputs
          .map((input) => parseFloat(input.value))
          .filter((x) => !Number.isNaN(x))
          .reduce((a, b) => a + b, 0),
        3
      ).toString()
    );
  }

  toastManager.openToast(`Totaled ${packageSets.length} packages`, {
    title: "Quick Script Success",
    autoHideDelay: 5000,
    variant: "success",
    appendToast: true,
    toaster: "ttt-toaster",
    solid: true,
  });
}
