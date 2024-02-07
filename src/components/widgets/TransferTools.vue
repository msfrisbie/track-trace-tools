<template>
  <div class="m-2 grid grid-cols-3 gap-2">
    <b-button @click="fillGoogleMapsDirections()" size="sm" variant="outline-primary"
      >AUTOFILL DIRECTIONS</b-button
    >
    <b-button @click="setSameSiteTransfer()" size="sm" variant="outline-primary"
      >AUTOFILL SAME-SITE TRANSFER</b-button
    >
    <b-button @click="toggleQuickTab()" size="sm" variant="outline-primary"
      >TOGGLE BUTTONS FOR QUICK TABBING</b-button
    >
    <b-dropdown
      size="sm"
      text="RECENT DESTINATIONS"
      disabled
      variant="outline-primary"
    ></b-dropdown>
    <b-dropdown
      size="sm"
      text="RECENT TRANSPORTERS"
      disabled
      variant="outline-primary"
    ></b-dropdown>
    <div class="flex flex-row items-center gap-2">
      <b-button @click="csvFill()" class="flex-grow" disabled size="sm" variant="outline-primary"
        >CSV FILL</b-button
      >
      <div id="csv-popover-target">
        <div id="csv-popover-container"></div>

        <font-awesome-icon icon="question-circle" class="cursor-pointer"></font-awesome-icon>

        <b-popover
          target="csv-popover-target"
          triggers="hover"
          placement="top"
          variant="light"
          ref="csv-popover"
          container="csv-popover-container"
        >
          <div class="flex flex-col space-y-2 text-base">
            <p class="font-bold ttt-purple">Upload a CSV to rapidly fill package data.</p>
            <p>
              Columns are Package Label, Gross Weight, Unit of Measure, and Wholesale Price.
              Example:
            </p>

            <b-table-simple class="font-mono text-xs">
              <b-tr>
                <b-td> 1A4400000000000000000001 </b-td>
                <b-td> 120 </b-td>
                <b-td> g </b-td>
                <b-td> $300 </b-td>
              </b-tr>
              <b-tr>
                <b-td> 1A4400000000000000000002 </b-td>
                <b-td> 175 </b-td>
                <b-td> lb </b-td>
                <b-td> $500 </b-td>
              </b-tr>
            </b-table-simple>

            <p>
              If you don't want to fill a column, or it's not needed for this transfer type, just
              leave it blank
            </p>
          </div>
        </b-popover>
      </div>
    </div>
    <b-input-group>
      <b-form-input
        placeholder="Weight, Unit, Price"
        v-model="autofillValue"
        size="sm"
      ></b-form-input>
      <b-dropdown size="sm" text="PACKAGE AUTOFILL" variant="outline-primary">
        <b-dropdown-item @click="autofillWeight()">Weight</b-dropdown-item>
        <b-dropdown-item @click="autofillUnitOfMeasure()">Unit Of Measure</b-dropdown-item>
        <b-dropdown-item @click="autofillWholesalePrice()">Wholesale Price</b-dropdown-item>
      </b-dropdown>
    </b-input-group>
    <!-- CSV -->
    <!-- Fill all package values...  -->
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import {
  TransferToolsActions,
  TransferToolsMutations,
} from "@/store/page-overlay/modules/transfer-tools/consts";
import { activeMetrcModalOrNull, metrcAddressToString } from "@/utils/metrc-modal";
import { fuzzyUnitOrNull } from "@/utils/units";
import _ from "lodash-es";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "TransferTools",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
    }),
  },
  data() {
    return {
      autofillValue: null,
      modal: null,
      selectedDestination: null,
    };
  },
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
    }),
    getElementRefs(): {
      destinationInput: HTMLInputElement | null;
      routeInput: HTMLTextAreaElement | null;
      driverNameInput: HTMLInputElement | null;
      employeeIdInput: HTMLInputElement | null;
      driverLicenseNumberInput: HTMLInputElement | null;
      vehicleMakeInput: HTMLInputElement | null;
      vehicleModelInput: HTMLInputElement | null;
      vehicleLicensePlateInput: HTMLInputElement | null;
      phoneNumberAutofillLink: HTMLAnchorElement | null;
      packageRows: {
        row: HTMLTableRowElement;
        packageInput: HTMLInputElement;
        grossWeightInput: HTMLInputElement | null;
        grossWeightUnitOfMeasureSelect: HTMLSelectElement | null;
        wholesalePriceInput: HTMLInputElement | null;
      }[];
    } {
      return {
        destinationInput: this.$data.modal.querySelector(`[ng-model="destination.RecipientId"]`),
        routeInput: this.$data.modal.querySelector(`[ng-model="destination.PlannedRoute"]`),
        driverNameInput: this.$data.modal.querySelector(
          `[ng-model="transporterDetail.DriverName"]`
        ),
        employeeIdInput: this.$data.modal.querySelector(
          `[ng-model="transporterDetail.DriverOccupationalLicenseNumber"]`
        ),
        driverLicenseNumberInput: this.$data.modal.querySelector(
          `[ng-model="transporterDetail.DriverLicenseNumber"]`
        ),
        vehicleMakeInput: this.$data.modal.querySelector(
          `[ng-model="transporterDetail.VehicleMake"]`
        ),
        vehicleModelInput: this.$data.modal.querySelector(
          `[ng-model="transporterDetail.VehicleModel"]`
        ),
        vehicleLicensePlateInput: this.$data.modal.querySelector(
          `[ng-model="transporterDetail.VehicleLicensePlateNumber"]`
        ),
        phoneNumberAutofillLink: this.$data.modal.querySelector(
          `.js-reset-phonenumberforquestions`
        ),
        packageRows: [
          ...this.$data.modal.querySelectorAll(`[ng-repeat="package in destination.Packages"]`),
        ].map((row) => ({
          row,
          packageInput: row.querySelector(`[ng-model="package.Id"]`),
          grossWeightInput: row.querySelector(`[ng-model="package.GrossWeight"]`),
          grossWeightUnitOfMeasureSelect: row.querySelector(
            `[ng-model="package.GrossUnitOfWeightId"]`
          ),
          wholesalePriceInput: row.querySelector(`[ng-model="package.WholesalePrice"]`),
        })),
      };
    },
    analyzeModal() {
      const elementRefs = this.getElementRefs();

      // Update all tracked values
      store.commit(`transferTools/${TransferToolsMutations.TRANSFER_TOOLS_MUTATION}`, {
        selectedDestinationLicense: elementRefs.destinationInput?.value,
      });
    },
    async fillGoogleMapsDirections() {
      if (!store.state.transferTools.selectedDestinationLicense) {
        toastManager.openToast(`Select a destination to autofill directions`, {
          title: "T3 Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        return;
      }

      const authState = await authManager.authStateOrError();

      const originData = store.state.transferTools.destinationFacilities.find(
        (x) => x.LicenseNumber === authState.license
      )?.PhysicalAddress;
      const destinationData = store.state.transferTools.destinationFacilities.find(
        (x) => x.LicenseNumber === store.state.transferTools.selectedDestinationLicense
      )?.PhysicalAddress;

      if (!originData) {
        toastManager.openToast(`Failed to load address data for ${authState.license}`, {
          title: "T3 Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        return;
      }

      if (!destinationData) {
        toastManager.openToast(
          `Failed to load address data for ${store.state.transferTools.selectedDestinationLicense}`,
          {
            title: "T3 Error",
            autoHideDelay: 5000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );
        return;
      }

      const origin = metrcAddressToString(originData);
      const destination = metrcAddressToString(destinationData);

      const data: { directions: string } = await t3RequestManager.loadDirections({
        origin,
        destination,
      });

      const elementRefs = this.getElementRefs();

      if (elementRefs.routeInput) {
        elementRefs.routeInput.value = data.directions;
      }
    },
    autofillWeight() {
      const elementRefs = this.getElementRefs();

      const value = this.$data.autofillValue;

      for (const packageRow of elementRefs.packageRows) {
        if (packageRow.grossWeightInput) {
          packageRow.grossWeightInput.value = value;
        }
      }
    },
    async autofillUnitOfMeasure() {
      const elementRefs = this.getElementRefs();

      const value = (await fuzzyUnitOrNull(this.$data.autofillValue))?.Id;

      if (!value) {
        toastManager.openToast(`Bad unit of measure: ${this.$data.autofillValue}`, {
          title: "T3 Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });

        return;
      }

      for (const packageRow of elementRefs.packageRows) {
        if (packageRow.grossWeightUnitOfMeasureSelect) {
          packageRow.grossWeightUnitOfMeasureSelect.value = `number:${value}`;
        }
      }
    },
    autofillWholesalePrice() {
      const elementRefs = this.getElementRefs();

      const value = this.$data.autofillValue;

      for (const packageRow of elementRefs.packageRows) {
        if (packageRow.wholesalePriceInput) {
          packageRow.wholesalePriceInput.value = value;
        }
      }
    },
    csvFill() {},
    setSameSiteTransfer() {
      const elementRefs = this.getElementRefs();

      let partialFill: boolean = false;

      if (elementRefs.routeInput) {
        elementRefs.routeInput.value = "Same-site transfer";
      } else {
        partialFill = true;
      }

      if (elementRefs.driverNameInput) {
        elementRefs.driverNameInput.value = "N/A";
      } else {
        partialFill = true;
      }

      if (elementRefs.employeeIdInput) {
        elementRefs.employeeIdInput.value = "N/A";
      } else {
        partialFill = true;
      }

      if (elementRefs.driverLicenseNumberInput) {
        elementRefs.driverLicenseNumberInput.value = "N/A";
      } else {
        partialFill = true;
      }

      if (elementRefs.vehicleMakeInput) {
        elementRefs.vehicleMakeInput.value = "N/A";
      } else {
        partialFill = true;
      }

      if (elementRefs.vehicleModelInput) {
        elementRefs.vehicleModelInput.value = "N/A";
      } else {
        partialFill = true;
      }

      if (elementRefs.vehicleLicensePlateInput) {
        elementRefs.vehicleLicensePlateInput.value = "N/A";
      } else {
        partialFill = true;
      }

      if (partialFill) {
        toastManager.openToast(`T3 was unable to autofill all possible transfer form fields`, {
          title: "Partial Autofill",
          autoHideDelay: 5000,
          variant: "warmomg",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }
    },
    toggleQuickTab() {
      (this.$data.modal as HTMLElement).classList.toggle("enable-form-quick-tab");
    },
  },
  async created() {},
  async mounted() {
    const modal = activeMetrcModalOrNull();

    if (!modal) {
      return;
    }

    this.$data.modal = modal;

    const debouncedHandler = _.debounce(() => this.analyzeModal(), 100);
    const observer = new MutationObserver(() => debouncedHandler());
    observer.observe(modal, { subtree: true, childList: true });

    store.dispatch(`transferTools/${TransferToolsActions.LOAD_TRANSFER_TOOL_DATA}`);

    const elementRefs = this.getElementRefs();

    if (elementRefs.phoneNumberAutofillLink) {
      elementRefs.phoneNumberAutofillLink.click();
    }
  },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) {},
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
