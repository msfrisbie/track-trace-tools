<template>
  <div
    class="m-2 grid grid-cols-4 gap-2"
    style="grid-template-columns: repeat(auto-fit, max-content)"
  >
    <b-button
      @click="fillGoogleMapsDirections()"
      size="sm"
      variant="outline-primary"
      title="Autofill directions from Google Maps into the 'Planned Route' input"
      class="flex flex-row items-center justify-center gap-2"
    >
      <font-awesome-icon icon="directions"></font-awesome-icon>
      <span>AUTOFILL DIRECTIONS</span>
    </b-button>
    <b-button
      @click="setSameSiteTransfer()"
      size="sm"
      variant="outline-primary"
      title="Autofill default values for route, driver, and vehicle"
      class="flex flex-row items-center justify-center gap-2"
    >
      <font-awesome-icon icon="sync"></font-awesome-icon>
      <span>AUTOFILL SAME-SITE TRANSFER</span>
    </b-button>
    <b-button
      @click="autofillPackageWeight()"
      size="sm"
      variant="outline-primary"
      title="Autofill the same weight for package and unit of measure"
      class="flex flex-row items-center justify-center gap-2"
    >
      <font-awesome-icon icon="weight"></font-awesome-icon>
      <span>AUTOFILL PACKAGE WEIGHTS</span>
    </b-button>
    <b-button
      @click="toggleQuickTab()"
      size="sm"
      variant="outline-primary"
      title="Hide extra buttons to allow for faster tabbing through the form"
      class="flex flex-row items-center justify-center gap-2"
    >
      <font-awesome-icon icon="toggle-on"></font-awesome-icon>
      <span>TOGGLE BUTTONS FOR QUICK TABBING</span>
    </b-button>

    <div class="relative flex flex-col items-stretch">
      <div
        v-if="!hasT3plus"
        class="absolute left-0 top-0 h-full flex flex-col items-center justify-center px-2"
      >
        <b-badge variant="primary">T3+</b-badge>
      </div>

      <b-dropdown :disabled="!hasT3plus" no-caret size="sm" variant="outline-primary">
        <template #button-content>
          <div class="flex flex-row items-center justify-center gap-2">
            <font-awesome-icon icon="clock"></font-awesome-icon>
            <span>RECENT DESTINATIONS</span>
            <font-awesome-icon icon="caret-down"></font-awesome-icon>
          </div>
        </template>
        <b-dropdown-item
          v-for="destination of transferToolsState.recentDestinationFacilities"
          @click="fillDestination(destination)"
          v-bind:key="destination.Id"
          >{{ destination.FacilityName }} | {{ destination.LicenseNumber }}</b-dropdown-item
        >
      </b-dropdown>
    </div>
    <div class="relative flex flex-col items-stretch">
      <div
        v-if="!hasT3plus"
        class="absolute left-0 top-0 h-full flex flex-col items-center justify-center px-2"
      >
        <b-badge variant="primary">T3+</b-badge>
      </div>

      <b-dropdown :disabled="!hasT3plus" no-caret size="sm" variant="outline-primary">
        <template #button-content>
          <div class="flex flex-row items-center justify-center gap-2">
            <font-awesome-icon icon="clock"></font-awesome-icon>
            <span>RECENT TRANSPORTERS</span>
            <font-awesome-icon icon="caret-down"></font-awesome-icon>
          </div>
        </template>
        <b-dropdown-item
          v-for="transporter of transferToolsState.recentTransporterFacilities"
          @click="fillTransporter(transporter)"
          v-bind:key="transporter.Id"
          >{{ transporter.FacilityName }} | {{ transporter.LicenseNumber }}</b-dropdown-item
        >
      </b-dropdown>
    </div>
    <div class="relative flex flex-col items-stretch">
      <div
        v-if="!hasT3plus"
        class="absolute left-0 top-0 h-full flex flex-col items-center justify-center px-2"
      >
        <b-badge variant="primary">T3+</b-badge>
      </div>

      <b-button
        :disabled="!hasT3plus || true"
        @click="csvFill()"
        size="sm"
        variant="outline-primary"
        class="flex flex-row items-center justify-center gap-2"
      >
        <font-awesome-icon icon="file-csv"></font-awesome-icon>
        <span>CSV FILL</span>
      </b-button>
      <div
        id="csv-popover-target"
        class="absolute right-0 top-0 h-full flex flex-col items-center justify-center px-2"
      >
        <div id="csv-popover-container"></div>

        <font-awesome-icon
          icon="question-circle"
          class="cursor-pointer ttt-purple"
        ></font-awesome-icon>

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
      <b-dropdown no-caret size="sm" variant="outline-primary">
        <template #button-content>
          <div class="flex flex-row items-center justify-center gap-2">
            <font-awesome-icon icon="arrows-alt"></font-awesome-icon>
            <span>PACKAGE AUTOFILL</span>
            <font-awesome-icon icon="caret-down"></font-awesome-icon>
          </div>
        </template>
        <b-dropdown-item @click="autofillCustomWeight()">Weight</b-dropdown-item>
        <b-dropdown-item @click="autofillUnitOfMeasure()">Unit Of Measure</b-dropdown-item>
        <b-dropdown-item @click="autofillWholesalePrice()">Wholesale Price</b-dropdown-item>
      </b-dropdown>
    </b-input-group>
    <!-- search for packages to fill -->
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { IMetrcFacilityData, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { t3RequestManager } from "@/modules/t3-request-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import {
  TransferToolsActions,
  TransferToolsMutations,
} from "@/store/page-overlay/modules/transfer-tools/consts";
import { activeMetrcModalOrNull, metrcAddressToString } from "@/utils/metrc-modal";
import { fillTransferWeights } from "@/utils/quick-scripts";
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
      transferToolsState: (state: IPluginState) => state.transferTools,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
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
      destinationHiddenInput: HTMLInputElement | null;
      transporterInput: HTMLInputElement | null;
      transporterHiddenInput: HTMLInputElement | null;
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
        destinationHiddenInput: this.$data.modal.querySelector(
          `[name="model[0][Destinations][0][RecipientId]"]`
        ),
        transporterInput: this.$data.modal.querySelector(`[ng-model="transporter.TransporterId"]`),
        transporterHiddenInput: this.$data.modal.querySelector(
          `[name="model[0][Destinations][0][Transporters][0][TransporterId]"]`
        ),
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
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "Google Maps Directions",
      });

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
    fillDestination(destinationFacility: IMetrcFacilityData) {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, { toolType: "Fill destination" });

      const elementRefs = this.getElementRefs();

      if (elementRefs.destinationInput && elementRefs.destinationHiddenInput) {
        elementRefs.destinationInput.value = destinationFacility.LicenseNumber;
        elementRefs.destinationHiddenInput.value = destinationFacility.Id.toString();
      } else {
        toastManager.openToast(`Failed to fill destination`, {
          title: "T3 Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }
    },
    fillTransporter(transporterFacility: IMetrcFacilityData) {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, { toolType: "Fill transporter" });

      const elementRefs = this.getElementRefs();

      if (elementRefs.transporterInput && elementRefs.transporterHiddenInput) {
        elementRefs.transporterInput.value = transporterFacility.LicenseNumber;
        elementRefs.transporterHiddenInput.value = transporterFacility.Id.toString();
      } else {
        toastManager.openToast(`Failed to fill transporter`, {
          title: "T3 Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }
    },
    autofillCustomWeight() {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, { toolType: "Autofill Weight" });

      const elementRefs = this.getElementRefs();

      const value = this.$data.autofillValue;

      for (const packageRow of elementRefs.packageRows) {
        if (packageRow.grossWeightInput) {
          packageRow.grossWeightInput.value = value;
        }
      }
    },
    autofillPackageWeight() {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "Autofill Package Weight",
      });

      const elementRefs = this.getElementRefs();

      fillTransferWeights();
    },
    async autofillUnitOfMeasure() {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "Autofill Unit of Measure",
      });

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
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "Autofill Wholesale Price",
      });

      const elementRefs = this.getElementRefs();

      const value = this.$data.autofillValue;

      for (const packageRow of elementRefs.packageRows) {
        if (packageRow.wholesalePriceInput) {
          packageRow.wholesalePriceInput.value = value;
        }
      }
    },
    csvFill() {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "CSV Fill",
      });
    },
    setSameSiteTransfer() {
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "Set Same-Site Transfer",
      });

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
      analyticsManager.track(MessageType.USED_TRANSFER_TOOL, {
        toolType: "Toggle Quick Tab",
      });

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
