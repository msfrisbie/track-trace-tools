import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { toastManager } from "@/modules/toast-manager.module";

export interface IQuickScript {
    id: string;
    name: string;
    description: string;
    contextLink: string;
    quickScriptFunction: () => void;
  }

export async function runQuickScript(quickScript: IQuickScript) {
    analyticsManager.track(MessageType.RAN_QUICK_SCRIPT, { scriptId: quickScript.id });

    quickScript.quickScriptFunction();
    
}

export const QUICK_SCRIPTS: IQuickScript[] = [
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
];

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
      .reduce((a, b) => a + b)
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
