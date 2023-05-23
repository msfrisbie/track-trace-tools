import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";

export interface IQuickScript {
  id: string;
  name: string;
  description: string;
  contextLink?: string;
  childOptions?: any[];
  quickScriptFunction: (childOption: any) => void;
}

export async function runQuickScript(quickScript: IQuickScript, childOption?: any) {
  analyticsManager.track(MessageType.RAN_QUICK_SCRIPT, { scriptId: quickScript.id });

  quickScript.quickScriptFunction(childOption);
}

export const QUICK_SCRIPTS: IQuickScript[] = [
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

    if (!grossWeightInput || !unitOfMeasureSelect) {
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

          grossWeightInput.value = quantity.toString();

          unitOfMeasureSelect.value = `number:${packageData.Item.UnitWeightUnitOfMeasureId}`;

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

        grossWeightInput.value = quantity.toString();

        unitOfMeasureSelect.value = `number:${packageData.UnitOfMeasureId}`;

        quantities.push(quantity);
        unitOfWeightIds.push(packageData.UnitOfMeasureId);
      }

      unitOfMeasureSelect.dispatchEvent(new Event("change"));

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
    const normalizedGrossWeight: number[] = [];
    const baseUnitOfMeasureId: number = unitsOfMeasure.find(
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
      for (const [idx, quantity] of quantities.entries()) {
        const unitOfMeasure = unitsOfMeasure.find((x) => x.Id === unitOfWeightIds[idx]);

        if (!unitOfMeasure) {
          skippedCount++;
          continue;
        }

        normalizedGrossWeight.push(quantity * unitOfMeasure.ToBaseFactor);
      }
    }

    grossWeightInput.value = normalizedGrossWeight.reduce((a, b) => a + b, 0).toString();
    unitOfMeasureSelect.value = `number:${baseUnitOfMeasureId}`;
    unitOfMeasureSelect.dispatchEvent(new Event("change"));
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

    output.value = inputs
      .map((input) => parseFloat(input.value))
      .filter((x) => !isNaN(x))
      .reduce((a, b) => a + b, 0)
      .toString();
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
