<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-center gap-8">
      <b-card class="max-w-lg">
        <div class="flex flex-col items-center gap-3">
          <div class="text-md font-bold">What are Quick Scripts?</div>
          <div>Quick Scripts are common Metrc actions that can be done in a single click.</div>
          <div>
            Need a quick script made? Post on the
            <a
              href="https://track-trace-tools.talkyard.net/"
              target="_blank"
              class="underline text-purple-500"
              >community forum!</a
            >
          </div>
        </div>
      </b-card>
      <div class="grid grid-cols-3 gap-8">
        <div
          v-bind:key="quickScript.id"
          v-for="quickScript of quickScripts"
          class="flex flex-col items-center gap-4"
        >
          <b-button variant="outline-primary" @click="runScript(quickScript.id)">{{
            quickScript.name
          }}</b-button>
          <div class="text-gray-600 text-sm">{{ quickScript.description }}</div>
          <a
            v-if="quickScript.contextLink"
            :href="quickScript.contextLink"
            target="_blank"
            class="underline text-purple-500"
            >Context</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "QuickScripts",
  store,
  data() {
    return {
      quickScripts: [
        {
          id: "SUM_PACKAGE_QUANTITIES",
          name: "Autosum Package Quantities",
          description:
            "Automatically totals all the source package quantities in the New Packages window and enters it into the new package Quantity input",
          contextLink:
            "https://track-trace-tools.talkyard.net/-27/would-it-be-possible-to-add-a-sum-all-button-for-creating-new-packages",
        },
        {
          id: "CHECK_ALL_PLANTS_FOR_HARVEST_RESTORE",
          name: "Check All Plants For Harvest Restore",
          description:
            "Automatically checks all the plant checkboxes in the Restore Harvested Plants window",
          contextLink:
            "https://track-trace-tools.talkyard.net/-28/auto-click-checkboxes-for-restore-harvest",
        },
      ],
    };
  },
  mounted() {},
  computed: {
    ...mapState(["backgroundTasks"]),
  },
  destroyed() {},
  methods: {
    runScript(scriptId: string) {
      switch (scriptId) {
        case "SUM_PACKAGE_QUANTITIES":
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
          break;
        case "CHECK_ALL_PLANTS_FOR_HARVEST_RESTORE":
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
          break;
        default:
          console.error("Bad scriptName");
      }
    },
  },
});
</script>
