<template>
  <div class="grid grid-cols-3 gap-8 h-full" style="grid-template-rows: auto 1fr">
    <builder-step-header
      v-for="(step, index) of steps"
      :key="index"
      :stepNumber="index + 1"
      :stepText="step.stepText"
      :active="index === activeStepIndex"
      @click.stop.prevent.native="setActiveStepIndex(index)"
    />

    <div class="col-span-3 h-full">
      <template v-if="activeStepIndex === 0">
        <div class="grid grid-cols-2 gap-8 h-full">
          <div class="flex flex-col items-stretch space-y-4 hide-scroll overflow-y-auto px-1">
            <div>
              <b-form-checkbox size="sm" v-model="editTransfer">
                <span>Edit existing transfer</span>
              </b-form-checkbox>

              <transfer-picker
                v-if="editTransfer"
                :transfer.sync="transferForUpdate"
              ></transfer-picker>
            </div>

            <b-form-group label="TRANSFER TYPE" label-class="text-gray-400">
              <b-form-select
                v-model="transferType"
                :options="transferTypeOptions"
                size="md"
              ></b-form-select>
            </b-form-group>

            <template v-if="!destinationFacility">
              <b-form-group label="SELECT DESTINATION" label-class="text-gray-400" label-size="sm">
                <!-- position:relative fixes a bug where the dropdown falls off the screen -->
                <vue-typeahead-bootstrap
                  style="position: relative"
                  v-model="destinationQuery"
                  placeholder="Search by license or facility name"
                  size="md"
                  :data="destinationFacilities"
                  :showOnFocus="true"
                  :serializer="facilitySummary"
                  @hit="selectDestinationFacility($event)"
                >
                  <template slot="prepend">
                    <!-- Probably a better way to do this -->
                    <div class="input-group-prepend">
                      <span class="input-group-text"
                        ><font-awesome-icon icon="map-marker-alt" class="prepend-icon"
                      /></span>
                    </div>
                  </template>
                </vue-typeahead-bootstrap>
              </b-form-group>

              <template v-if="transferDataLoading">
                <div class="flex flex-row space-x-2 justify-center items-center text-gray-500">
                  <b-spinner small />
                  <span>Loading facilities</span>
                </div>
              </template>
            </template>

            <template v-if="showInitializationError">
              <div class="flex flex-col space-y-2 items-center text-red-700">
                <span class="font-bold"
                  >Something went wrong while setting up this transfer tool.</span
                >
                <span>The T3 team has been notified, and we're working on a fix.</span>
              </div>
            </template>

            <template v-if="destinationFacility">
              <div
                class="h-full grid grid-cols-3 grid-rows-3 gap-8"
                style="grid-template-columns: auto 1fr 1fr; grid-template-rows: auto auto 1fr"
              >
                <start-finish-icons :ellipsisCount="6" class="row-span-2 text-purple-500" />

                <b-form-group
                  label="ORIGIN"
                  label-class="text-gray-400"
                  label-size="sm"
                  v-bind:class="{ 'col-span-2': isSameSiteTransfer }"
                >
                  <template v-if="originFacility">
                    <facility-summary :facility="originFacility" />
                  </template>
                </b-form-group>

                <!-- Only needed for google maps -->
                <template v-if="!isSameSiteTransfer">
                  <b-form-group
                    label="ORIGIN ADDRESS"
                    label-class="text-gray-400"
                    label-size="sm"
                    class="opacity-0"
                  >
                    <b-form-textarea
                      v-model="originAddress"
                      rows="3"
                      class="borderless-input"
                      placeholder="Origin Address"
                    />
                  </b-form-group>
                </template>

                <b-form-group
                  label="DESTINATION"
                  label-class="text-gray-400"
                  label-size="sm"
                  v-bind:class="{ 'col-span-2': isSameSiteTransfer }"
                >
                  <facility-summary :facility="destinationFacility" />
                </b-form-group>

                <!-- Only needed for google maps -->
                <template v-if="!isSameSiteTransfer">
                  <b-form-group
                    label="DESTINATION ADDRESS"
                    label-class="text-gray-400"
                    label-size="sm"
                    class="opacity-0"
                  >
                    <b-form-textarea
                      v-model="destinationAddress"
                      rows="3"
                      class="borderless-input"
                      placeholder="Destination Address"
                    />
                  </b-form-group>
                </template>

                <div class="col-start-2">
                  <b-button
                    variant="outline-danger"
                    @click="selectDestinationFacility(null)"
                    size="sm"
                    class="my-4 opacity-60"
                    >REMOVE</b-button
                  >
                </div>
              </div>
            </template>

            <template v-else>
              <template v-if="!transferDataLoading">
                <recent-facility-picker
                  :facilities="recentDestinationFacilities"
                  v-on:selectFacility="selectDestinationFacility($event)"
                />
              </template>
            </template>
          </div>

          <div class="flex flex-col items-stretch space-y-8">
            <template v-if="destinationFacility">
              <div class="flex flex-row items-center space-x-2">
                <b-form-checkbox v-model="isSameSiteTransfer" size="md" id="same-site-checkbox">
                </b-form-checkbox>

                <label style="margin: 0 !important" for="same-site-checkbox"
                  >Same Site Transfer</label
                >

                <div id="transfer-builder-popover-container">
                  <font-awesome-icon
                    icon="question-circle"
                    class="text-gray-500"
                    id="same-site-popover-target"
                  />
                  <b-popover
                    target="same-site-popover-target"
                    triggers="hover"
                    placement="bottom"
                    variant="primary"
                    ref="same-site-popover"
                    container="transfer-builder-popover-container"
                  >
                    <template #title>
                      <span class="text-base"><b>Same Site Transfers</b></span>
                    </template>

                    <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
                      <p>
                        Select
                        <span class="font-bold">Same Site Transfer</span>
                        when the origin and destination are in the same location. T3 will use 'N/A'
                        for route, driver, and vehicle.
                      </p>
                    </div>
                  </b-popover>
                </div>
              </div>

              <template v-if="!isSameSiteTransfer">
                <route-picker
                  class="flex-grow"
                  :originAddress="originAddress"
                  :destinationAddress="destinationAddress"
                />
              </template>
            </template>

            <div
              class="col-span-2 flex flex-col justify-end"
              v-bind:class="{ 'flex-grow': isSameSiteTransfer }"
            >
              <template v-if="!pageOneErrorMessage">
                <b-button variant="success" size="md" @click="activeStepIndex = 1"> NEXT </b-button>
              </template>

              <template v-else>
                <span class="text-center text-red-700"> {{ pageOneErrorMessage }}</span>
              </template>
            </div>
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 1">
        <div class="grid grid-cols-2 grid-rows-2 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <single-package-picker
            class="col-span-2 h-full"
            :enablePaste="true"
            :selectedPackages="transferPackages"
            v-on:removePackage="removePackage({ pkg: $event })"
            v-on:addPackage="addPackage({ pkg: $event })"
          />

          <div class="col-start-2 flex flex-col items-stretch space-y-2">
            <template v-if="!pageTwoErrorMessage">
              <b-button variant="success" size="md" @click="activeStepIndex = 2"> NEXT </b-button>
            </template>

            <template v-else>
              <span class="text-center text-red-700"> {{ pageTwoErrorMessage }}</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 2">
        <div class="grid grid-cols-3 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <!-- Column 1 -->
          <div
            class="flex flex-col items-stretch space-y-8 overflow-y-auto overflow-x-hidden toolkit-scroll"
          >
            <div class="text-start text-2xl font-bold border-b border-gray-400 text-gray-400">
              SHIPMENT
            </div>

            <div
              class="flex flex-col items-stretch text-md text-gray-700 gap-2 overflow-y-auto toolkit-scroll px-2"
              style="max-height: 35vh"
            >
              <template v-for="(pkg, idx) in transferPackages">
                <div class="border border-gray-200 rounded p-2" v-bind:key="getLabelOrError(pkg)">
                  <div class="font-bold">{{ getLabelOrError(pkg) }}</div>
                  <div>
                    {{
                      `${getQuantityOrError(pkg)} ${getItemUnitOfMeasureAbbreviationOrError(
                        pkg
                      )} ${getItemNameOrError(pkg)}`
                    }}
                  </div>
                  <template v-if="isTransferSubmittedWithGrossWeight">
                    <b-input-group class="mt-2">
                      <b-form-input
                        size="md"
                        type="number"
                        value="null"
                        v-model="packageGrossWeights[idx]"
                        :state="!!packageGrossWeights[idx]"
                      ></b-form-input>

                      <b-form-select
                        size="md"
                        :options="weightOptions"
                        v-model="packageGrossUnitsOfWeight[idx]"
                        :state="!!packageGrossUnitsOfWeight[idx]"
                      />
                    </b-input-group>
                    <b-form-text>Gross Weight</b-form-text>
                  </template>

                  <template v-if="isTransferSubmittedWithWholesalePrice">
                    <b-input-group prepend="$">
                      <b-form-input
                        size="md"
                        type="number"
                        value="null"
                        step="0.01"
                        :state="!!wholesalePackageValues[idx]"
                        v-model="wholesalePackageValues[idx]"
                      ></b-form-input>
                    </b-input-group>
                    <b-form-text>Wholesale Price</b-form-text>
                  </template>
                </div>
              </template>
            </div>
          </div>

          <!-- Column 2 -->
          <div class="flex flex-col items-stretch">
            <div
              class="flex flex-col items-stretch space-y-8 overflow-y-auto overflow-x-hidden toolkit-scroll"
            >
              <div class="text-start text-2xl font-bold border-b border-gray-400 text-gray-400">
                ITINERARY
              </div>

              <departure-arrival-picker />
            </div>
          </div>

          <!-- Column 3 -->
          <div
            class="flex flex-col items-stretch space-y-8 overflow-y-auto overflow-x-hidden toolkit-scroll px-1"
          >
            <div class="text-start text-2xl font-bold border-b border-gray-400 text-gray-400">
              TRANSPORTER
            </div>

            <template v-if="!isTransferSubmittedWithoutTransporter">
              <template v-if="!transporterFacility">
                <b-form-group
                  label="SELECT TRANSPORTER"
                  label-class="text-gray-400"
                  label-size="sm"
                >
                  <vue-typeahead-bootstrap
                    style="position: relative"
                    v-model="transporterQuery"
                    placeholder="Search by license or facility name"
                    size="md"
                    :data="transporterFacilities"
                    :showOnFocus="true"
                    :serializer="facilitySummary"
                    @hit="selectTransporterFacility($event)"
                  >
                    <template slot="prepend">
                      <!-- Probably a better way to do this -->
                      <div class="input-group-prepend">
                        <span class="input-group-text"
                          ><font-awesome-icon icon="truck" class="prepend-icon"
                        /></span>
                      </div>
                    </template>
                  </vue-typeahead-bootstrap>
                </b-form-group>

                <template v-if="!transferDataLoading">
                  <recent-facility-picker
                    :facilities="recentTransporterFacilities"
                    v-on:selectFacility="selectTransporterFacility($event)"
                  />
                </template>
              </template>

              <template v-if="transporterFacility">
                <facility-summary :facility="transporterFacility" />

                <div class="flex flex-col items-start justify-start">
                  <b-button
                    variant="outline-danger"
                    @click="selectTransporterFacility(null)"
                    size="sm"
                    class="opacity-60"
                    >REMOVE</b-button
                  >
                </div>

                <b-form-group label="PHONE NUMBER" label-class="text-gray-400" label-size="sm">
                  <div
                    class="flex flex-row items-center space-x-2 border border-gray-200 px-2 rounded-sm"
                  >
                    <font-awesome-icon icon="phone" class="text-gray-500" />

                    <b-form-input
                      v-model="phoneNumberForQuestions"
                      class="borderless-input"
                      required
                      :state="!phoneNumberForQuestions ? false : null"
                    />
                  </div>
                </b-form-group>

                <template
                  v-if="
                    !!defaultPhoneNumberForQuestions &&
                    phoneNumberForQuestions !== defaultPhoneNumberForQuestions
                  "
                >
                  <b-button
                    variant="link"
                    size="sm"
                    @click="phoneNumberForQuestions = defaultPhoneNumberForQuestions"
                    >USE DEFAULT PHONE #</b-button
                  >
                </template>

                <template v-if="!isSameSiteTransfer">
                  <driver-vehicle-picker />
                </template>
              </template>
            </template>

            <template v-else>
              <span>This transfer type does not use a transporter</span>
            </template>
          </div>

          <div class="col-span-3 flex flex-col items-center">
            <transition name="fade">
              <template v-if="!errorMessage">
                <b-button
                  class="w-full"
                  style="max-width: 600px"
                  variant="success"
                  size="md"
                  @click="submit()"
                >
                  <template v-if="transferForUpdate === null"> CREATE TRANSFER </template>
                  <template v-else> UPDATE TRANSFER </template>
                </b-button>
              </template>

              <template v-else>
                <span class="text-red-700">{{
                  pageThreeErrorMessage || errorMessage
                }}</span></template
              >
            </transition>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import DepartureArrivalPicker from "@/components/overlay-widget/shared/DepartureArrivalPicker.vue";
import DriverVehiclePicker from "@/components/overlay-widget/shared/DriverVehiclePicker.vue";
import FacilitySummary from "@/components/overlay-widget/shared/FacilitySummary.vue";
import RecentFacilityPicker from "@/components/overlay-widget/shared/RecentFacilityPicker.vue";
import RoutePicker from "@/components/overlay-widget/shared/RoutePicker.vue";
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import TransferPicker from "@/components/overlay-widget/shared/TransferPicker.vue";
import StartFinishIcons from "@/components/overlay-widget/shared/StartFinishIcons.vue";
import { BuilderType, MessageType, ModalAction, ModalType } from "@/consts";
import {
  IBuilderComponentError,
  IComputedGetSet,
  IComputedGetSetMismatched,
  ICsvFile,
  IIndexedTransferData,
  IMetrcCreateStateAuthorizedTransferPayload,
  IMetrcCreateTransferPayload,
  IMetrcFacilityData,
  IMetrcTransferPackageData,
  IMetrcTransferTransporterData,
  IMetrcTransferType,
  IMetrcTransferTypeData,
  IMetrcUpdateStateAuthorizedTransferPayload,
  IMetrcUpdateTransferPayload,
  IPluginState,
  ITransferData,
  IUnionIndexedPackageData,
  IUnitOfMeasure,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { searchManager } from "@/modules/search-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { PackageSearchActions } from "@/store/page-overlay/modules/package-search/consts";
import { PluginAuthGetters } from "@/store/page-overlay/modules/plugin-auth/consts";
import {
  TransferBuilderActions,
  TransferBuilderGetters,
} from "@/store/page-overlay/modules/transfer-builder/consts";
import { ITransferBuilderState } from "@/store/page-overlay/modules/transfer-builder/interfaces";
import { facilityReadableAddressLinesOrNull } from "@/utils/address";
import { buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";
import { nowIsotime, todayIsodate } from "@/utils/date";
import { debugLogFactory } from "@/utils/debug";
import { facilitySummary } from "@/utils/facility";
import {
  extractRecentDestinationFacilitiesFromTransfers,
  extractRecentTransporterFacilitiesFromTransfers,
} from "@/utils/transfer";
import _ from "lodash";
import { timer } from "rxjs";
import Vue from "vue";
import { mapActions, mapGetters, mapState, Store } from "vuex";
import {
  getLabelOrError,
  getQuantityOrError,
  getItemNameOrError,
  getItemUnitOfMeasureNameOrError,
  getItemUnitOfMeasureAbbreviationOrError,
  getIdOrError,
} from "@/utils/package";

const debugLog = debugLogFactory("TransferBuilder.vue");

export default Vue.extend({
  name: "TransferBuilder",
  store,
  components: {
    BuilderStepHeader,
    DepartureArrivalPicker,
    DriverVehiclePicker,
    FacilitySummary,
    RecentFacilityPicker,
    RoutePicker,
    SinglePackagePicker,
    StartFinishIcons,
    TransferPicker,
  },
  methods: {
    ...mapActions({
      // refreshPackages: `transferBuilder/${TransferBuilderActions.REFRESH_PACKAGES}`,
      addPackage: `transferBuilder/${TransferBuilderActions.ADD_PACKAGE}`,
      removePackage: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
      // updateTransferData: `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
    }),
    getLabelOrError,
    getQuantityOrError,
    getItemNameOrError,
    getItemUnitOfMeasureNameOrError,
    getItemUnitOfMeasureAbbreviationOrError,
    facilitySummary,
    maybeNavigateAndOpenPackageSearch() {
      // Currently unused. Will force open the package search
      if (window.location.pathname === this.packagesUrl) {
        modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.CLOSE);

        searchManager.setPackageSearchVisibility({ showPackageSearchResults: true });
      } else {
        this.$store.dispatch(
          `packageSearch/${PackageSearchActions.SET_EXPAND_SEARCH_ON_NEXT_LOAD}`,
          { expandSearchOnNextLoad: true }
        );

        window.location.href = this.packagesUrl;
      }
    },
    selectDestinationFacility(facility: IMetrcFacilityData) {
      this.destinationFacility = null;

      timer(0).subscribe(() => {
        this.destinationFacility = facility;
        this.$data.destinationQuery = facilitySummary(facility);
        this.$data.destinationAddress = (facilityReadableAddressLinesOrNull(facility) || []).join(
          "\n"
        );

        if (
          this.$data.destinationAddress === this.$data.originAddress &&
          this.$data.destinationAddress.trim().length > 0
        ) {
          this.isSameSiteTransfer = true;
        }

        analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
          builder: this.builderType,
          action: `Set destination facility to ${facility?.FacilityName}`,
        });
      });
    },
    selectTransporterFacility(facility: IMetrcFacilityData) {
      this.transporterFacility = null;

      timer(0).subscribe(() => {
        this.transporterFacility = facility;
        this.$data.transporterQuery = facilitySummary(facility);

        analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
          builder: this.builderType,
          action: `Set transporter facility to ${facility?.FacilityName}`,
        });
      });
    },
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.builderType,
        action: `Set active step to ${index}`,
      });
    },
    submit() {
      function combineTimeAndDate({
        isotime,
        isodate,
      }: {
        isotime: string;
        isodate: string;
      }): string {
        // Probably not necessary, but this will exactly match what metrc sends
        return `${isodate}T${isotime.replace(/(\.\d{3}){1,}Z?/, "")}`;
      }

      const isoNowDatetime: string = combineTimeAndDate({
        isotime: nowIsotime(),
        isodate: todayIsodate(),
      });

      const plannedRoute: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.plannedRoute;
      const estimatedDepartureDateTime: string = this.isSameSiteTransfer
        ? isoNowDatetime
        : combineTimeAndDate({
            isodate: this.transferBuilderState.departureIsodate,
            isotime: this.transferBuilderState.departureIsotime,
          });
      const estimatedArrivalDateTime: string = this.isSameSiteTransfer
        ? isoNowDatetime
        : combineTimeAndDate({
            isodate: this.transferBuilderState.arrivalIsodate,
            isotime: this.transferBuilderState.arrivalIsotime,
          });

      const driverName: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.driverName;
      const driverEmployeeId: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.driverEmployeeId;
      const driverLicenseNumber: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.driverLicenseNumber;

      const vehicleMake: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.vehicleMake;
      const vehicleModel: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.vehicleModel;
      const vehicleLicensePlate: string = this.isSameSiteTransfer
        ? "N/A"
        : this.transferBuilderState.vehicleLicensePlate;

      const packages: IMetrcTransferPackageData[] = [];

      for (const [idx, pkg] of this.transferPackages.entries()) {
        let WholesalePrice: string = "";
        let GrossWeight: string = "";
        let GrossUnitOfWeightId: string = "";

        if (this.isTransferSubmittedWithWholesalePrice) {
          WholesalePrice = this.wholesalePackageValues[idx].toString();
        }

        if (this.isTransferSubmittedWithGrossWeight) {
          GrossWeight = this.packageGrossWeights[idx].toString();
          GrossUnitOfWeightId = this.packageGrossUnitsOfWeight[idx].Id.toString();
        }

        packages.push({
          Id: getIdOrError(pkg).toString(),
          WholesalePrice,
          GrossWeight,
          GrossUnitOfWeightId,
        });
      }

      const transporters: IMetrcTransferTransporterData[] = [
        {
          TransporterId: (this.transporterFacility as IMetrcFacilityData).Id.toString(),
          PhoneNumberForQuestions: this.phoneNumberForQuestions as string,
          EstimatedDepartureDateTime: estimatedDepartureDateTime,
          EstimatedArrivalDateTime: estimatedArrivalDateTime,
          TransporterDetails: [
            {
              DriverName: driverName,
              DriverOccupationalLicenseNumber: driverEmployeeId,
              DriverLicenseNumber: driverLicenseNumber,
              VehicleMake: vehicleMake,
              VehicleModel: vehicleModel,
              VehicleLicensePlateNumber: vehicleLicensePlate,
            },
          ],
        },
      ];

      const TransportersMixin = this.isTransferSubmittedWithoutTransporter
        ? {}
        : { Transporters: transporters };

      const IdMixin = this.transferForUpdate ? { Id: this.transferForUpdate.Id } : {};

      const transferData:
        | IMetrcCreateTransferPayload
        | IMetrcCreateStateAuthorizedTransferPayload
        | IMetrcUpdateTransferPayload
        | IMetrcUpdateStateAuthorizedTransferPayload = {
        ShipmentLicenseType: "Licensed",
        ...IdMixin,
        Destinations: [
          {
            ShipmentLicenseType: "Licensed",
            RecipientId: (this.destinationFacility as IMetrcFacilityData).Id.toString(),
            PlannedRoute: plannedRoute,
            TransferTypeId: (this.transferType as IMetrcTransferType).Id.toString(),
            EstimatedDepartureDateTime: estimatedDepartureDateTime,
            EstimatedArrivalDateTime: estimatedArrivalDateTime,
            GrossWeight: "",
            GrossUnitOfWeightId: "",
            Packages: packages,
            ...TransportersMixin,
          },
        ],
      };

      let rows:
        | IMetrcCreateTransferPayload[]
        | IMetrcCreateStateAuthorizedTransferPayload[]
        | IMetrcUpdateTransferPayload[]
        | IMetrcUpdateStateAuthorizedTransferPayload[] = [transferData];

      if (rows[0].Destinations.length === 0) {
        analyticsManager.track(MessageType.BUILDER_DATA_ERROR, {
          builder: BuilderType.CREATE_TRANSFER,
          action: `Destinations is empty`,
          payload: JSON.stringify(rows),
        });

        toastManager.openToast(
          "Unable to submit transfer. T3 team has been notified, we'll be in touch.",
          {
            title: "T3 Error",
            autoHideDelay: 10000,
            variant: "danger",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );

        return;
      }

      builderManager.submitProject(
        rows,
        this.builderType,
        {
          packageTotal: this.transferPackages.length,
          origin: this.originFacility,
          destination: this.destinationFacility,
          transporter: this.transporterFacility,
        },
        this.buildCsvFiles(),
        5
      );

      if (this.transferForUpdate) {
        analyticsManager.track(MessageType.BUILDER_EVENT, {
          builder: BuilderType.UPDATE_TRANSFER,
          action: `Updated transfer`,
          payload: JSON.stringify(rows),
        });
      } else {
        analyticsManager.track(MessageType.BUILDER_EVENT, {
          builder: BuilderType.CREATE_TRANSFER,
          action: `Created transfer`,
          payload: JSON.stringify(rows),
        });
      }
    },
    buildCsvFiles(): ICsvFile[] {
      const originFacility: IMetrcFacilityData = this.originFacility as IMetrcFacilityData;
      const transporterFacility: IMetrcFacilityData = this
        .transporterFacility as IMetrcFacilityData;
      const destinationFacility: IMetrcFacilityData = this
        .destinationFacility as IMetrcFacilityData;

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.transferPackages.map((packageData: IUnionIndexedPackageData) =>
              getLabelOrError(packageData)
            ),
          },
          {
            isVector: false,
            data: (this.transferType as IMetrcTransferType).Name,
          },
          {
            isVector: false,
            data: originFacility.LicenseNumber,
          },
          {
            isVector: false,
            data: destinationFacility.LicenseNumber,
          },
          {
            isVector: false,
            data: (this.isSameSiteTransfer as boolean).toString(),
          },
          {
            isVector: false,
            data: transporterFacility.LicenseNumber,
          },
          {
            isVector: false,
            data: `${this.transferBuilderState.driverName}|${this.transferBuilderState.driverEmployeeId}|${this.transferBuilderState.driverLicenseNumber}`,
          },
          {
            isVector: false,
            data: `${this.transferBuilderState.vehicleMake}|${this.transferBuilderState.vehicleModel}|${this.transferBuilderState.vehicleLicensePlate}`,
          },
          {
            isVector: false,
            data: `${this.transferBuilderState.departureIsodate} ${this.transferBuilderState.departureIsotime}`,
          },
          {
            isVector: false,
            data: `${this.transferBuilderState.arrivalIsodate} ${this.transferBuilderState.arrivalIsotime}`,
          },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Transfer ${this.transferPackages.length} packages from ${originFacility.LicenseNumber} to ${destinationFacility.LicenseNumber} via ${transporterFacility.LicenseNumber}`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    calculateErrors(): IBuilderComponentError[] {
      const errors: IBuilderComponentError[] = [];

      if (this.transferPackages.length === 0) {
        errors.push({
          tags: ["page2"],
          message: "Select at least one package to transfer",
        });
      }

      if (!this.destinationFacility) {
        errors.push({
          tags: ["page1"],
          message: "Select a destination facility",
        });
      }

      if (!this.transferType) {
        errors.push({
          tags: ["page3"],
          message: "Select a transfer type",
        });
      }

      if (!this.isTransferSubmittedWithoutTransporter) {
        if (!this.transporterFacility) {
          errors.push({
            tags: ["page3"],
            message: "Select a transporter facility",
          });
        }

        if (!this.phoneNumberForQuestions) {
          errors.push({
            tags: ["page3"],
            message: "Enter a phone number for questions",
          });
        }
      }

      if (!this.transferType) {
        errors.push({ tags: ["page3"], message: "Select a transfer type" });
      }

      if (!this.isSameSiteTransfer && !this.isTransferSubmittedWithoutTransporter) {
        if (!this.transferBuilderState.plannedRoute) {
          errors.push({ tags: ["page1"], message: "Enter a planned route" });
        }
        if (!this.transferBuilderState.departureIsodate) {
          errors.push({ tags: ["page3"], message: "Select a departure date" });
        }
        if (!this.transferBuilderState.departureIsotime) {
          errors.push({ tags: ["page3"], message: "Select a departure time" });
        }
        if (!this.transferBuilderState.arrivalIsodate) {
          errors.push({ tags: ["page3"], message: "Select an arrivaal date" });
        }
        if (!this.transferBuilderState.arrivalIsotime) {
          errors.push({ tags: ["page3"], message: "Select an arrival time" });
        }
        if (!this.transferBuilderState.driverName) {
          errors.push({ tags: ["page3"], message: "Enter a driver name" });
        }
        if (!this.transferBuilderState.driverEmployeeId) {
          errors.push({
            tags: ["page3"],
            message: "Enter a driver employee ID",
          });
        }
        if (!this.transferBuilderState.driverLicenseNumber) {
          errors.push({
            tags: ["page3"],
            message: "Enter a driver license number",
          });
        }
        if (!this.transferBuilderState.vehicleMake) {
          errors.push({ tags: ["page3"], message: "Enter a vehicle make" });
        }
        if (!this.transferBuilderState.vehicleModel) {
          errors.push({ tags: ["page3"], message: "Enter a vehicle model" });
        }
        if (!this.transferBuilderState.vehicleLicensePlate) {
          errors.push({
            tags: ["page3"],
            message: "Enter a vehicle license plate",
          });
        }
      }

      function isNumber(x: any) {
        const n = parseFloat(x);

        if (isNaN(n)) {
          return false;
        }

        return typeof n === "number";
      }

      for (let i = 0; i < this.transferPackages.length; ++i) {
        if (this.isTransferSubmittedWithWholesalePrice) {
          const wholesalePrice = parseFloat(this.wholesalePackageValues[i]?.toString());

          if (!isNumber(wholesalePrice)) {
            errors.push({
              tags: ["page3"],
              message: "Each package must have a wholesale price",
            });
          }
        }

        if (this.isTransferSubmittedWithGrossWeight) {
          const grossWeight = parseFloat(this.packageGrossWeights[i]?.toString());
          const unitOfMeasure = this.packageGrossUnitsOfWeight[i];

          if (!isNumber(grossWeight)) {
            errors.push({
              tags: ["page3"],
              message: "Each package must have a gross weight",
            });
          }

          if (!unitOfMeasure) {
            errors.push({
              tags: ["page3"],
              message: "Each package must have a gross unit of weight",
            });
          }
        }
      }

      return errors;
    },
  },
  watch: {
    transferForUpdate: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.editTransfer = !!this.transferForUpdate;
      },
    },
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      accountEnabled: (state: IPluginState) => state.accountEnabled,
      weightOptions(): { text: string; unitOfWeight: IUnitOfMeasure }[] {
        // @ts-ignore
        return this.$data.unitsOfWeight.map((unitOfWeight: IUnitOfMeasure) => ({
          text: unitOfWeight.Name,
          value: unitOfWeight,
        }));
      },
    }),
    ...mapGetters({
      transferPackageList: `transferBuilder/${TransferBuilderGetters.ACTIVE_PACKAGE_LIST}`,
      packagesUrl: `pluginAuth/${PluginAuthGetters.PACKAGES_URL}`,
    }),
    builderType(): BuilderType {
      return this.transferForUpdate ? BuilderType.UPDATE_TRANSFER : BuilderType.CREATE_TRANSFER;
    },
    pageOneErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page1"))?.message || null
      );
    },
    pageTwoErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page2"))?.message || null
      );
    },
    pageThreeErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("page3"))?.message || null
      );
    },
    errorMessage(): string | null {
      return this.errors.find((x: IBuilderComponentError) => true)?.message || null;
    },
    errors(): IBuilderComponentError[] {
      return this.calculateErrors();
    },
    transferBuilderState(): ITransferBuilderState {
      return this.$store.state.transferBuilder;
    },
    transferType: {
      get(): IMetrcTransferType | null {
        return this.$store.state.transferBuilder.transferType;
      },
      set(transferType: ITransferData) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          transferType,
        });
      },
    } as IComputedGetSetMismatched<IMetrcTransferType | null, ITransferData>,
    originFacility: {
      get(): IMetrcFacilityData | null {
        return this.$store.state.transferBuilder.originFacility;
      },
      set(originFacility) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          originFacility,
        });
      },
    } as IComputedGetSet<IMetrcFacilityData | null>,
    phoneNumberForQuestions: {
      get(): string {
        return this.$store.state.transferBuilder.phoneNumberForQuestions;
      },
      set(phoneNumberForQuestions) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          phoneNumberForQuestions,
        });
      },
    } as IComputedGetSet<string>,
    destinationFacility: {
      get(): IMetrcFacilityData | null {
        return this.$store.state.transferBuilder.destinationFacility;
      },
      set(destinationFacility) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          destinationFacility,
        });
      },
    } as IComputedGetSet<IMetrcFacilityData | null>,
    transporterFacility: {
      get(): IMetrcFacilityData | null {
        return this.$store.state.transferBuilder.transporterFacility;
      },
      set(transporterFacility) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          transporterFacility,
        });
      },
    } as IComputedGetSet<IMetrcFacilityData | null>,
    wholesalePackageValues: {
      get() {
        return this.$store.state.transferBuilder.wholesalePackageValues;
      },
      set(wholesalePackageValues) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          wholesalePackageValues,
        });
      },
    } as IComputedGetSet<number[]>,
    packageGrossWeights: {
      get() {
        return this.$store.state.transferBuilder.packageGrossWeights;
      },
      set(packageGrossWeights) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          packageGrossWeights,
        });
      },
    } as IComputedGetSet<number[]>,
    packageGrossUnitsOfWeight: {
      get() {
        return this.$store.state.transferBuilder.packageGrossUnitsOfWeight;
      },
      set(packageGrossUnitsOfWeight) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          packageGrossUnitsOfWeight,
        });
      },
    } as IComputedGetSet<IUnitOfMeasure[]>,
    isSameSiteTransfer: {
      get(): boolean {
        return this.$store.state.transferBuilder.isSameSiteTransfer;
      },
      set(isSameSiteTransfer) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          isSameSiteTransfer,
        });
      },
    } as IComputedGetSet<boolean>,
    transferForUpdate: {
      get(): IIndexedTransferData | null {
        return this.$store.state.transferBuilder.transferForUpdate;
      },
      set(transferForUpdate) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.SET_TRANSFER_FOR_UPDATE}`, {
          transferForUpdate,
        });
      },
    } as IComputedGetSet<IIndexedTransferData | null>,
    isTransferSubmittedWithoutTransporter(): boolean {
      return (
        this.transferType?.Name === "State Authorized" &&
        window.location.hostname === "ca.metrc.com"
      );
    },
    isTransferSubmittedWithGrossWeight(): boolean {
      return window.location.hostname === "mi.metrc.com";
    },
    isTransferSubmittedWithWholesalePrice(): boolean {
      return this.transferType?.Name === "Wholesale";
    },
    transferTypeOptions(): { value: IMetrcTransferType; text: string; disabled: boolean }[] {
      return this.$data.transferTypes
        .map((transferType: IMetrcTransferTypeData) => {
          const enabled = true; //["Transfer", "Return", "State Authorized"].includes(transferType.Name);

          return {
            value: transferType,
            text: transferType.Name.toLocaleUpperCase() + (enabled ? "" : " (not yet available)"),
            disabled: !enabled,
          };
        })
        .sort((a: any, b: any) => (a.disabled ? 1 : -1));
    },
    transferPackages(): IUnionIndexedPackageData[] {
      return this.transferPackageList.packages;
    },
    csvFiles(): ICsvFile[] {
      return this.buildCsvFiles();
    },
  },
  data() {
    return {
      destinationQuery: "",
      transporterQuery: "",
      transferDataLoading: false,
      showPhoneNumberInput: false,
      activePackages: [],
      activeStepIndex: 0,
      sourcePackages: [],
      transferTypes: [],
      transporterFacilities: [],
      destinationFacilities: [],
      recentTransporterFacilities: [],
      recentDestinationFacilities: [],
      defaultPhoneNumberForQuestions: "",
      destinationAddress: "",
      originAddress: "",
      showMapsIframe: false,
      unitsOfWeight: [],
      showInitializationError: false,
      editTransfer: false,
      steps: [
        {
          stepText: "Destination details",
        },
        {
          stepText: "Select packages to transfer",
        },
        {
          stepText: "Transport details",
        },
      ],
    };
  },
  async mounted() {
    const authState = await authManager.authStateOrError();

    dynamicConstsManager.transferTemplateHTML();

    this.$data.transferDataLoading = true;

    this.$data.unitsOfWeight = await dynamicConstsManager.unitsOfWeight();

    try {
      this.$store.dispatch(`transferBuilder/${TransferBuilderActions.REFRESH_PACKAGES}`);

      // Currently limit support to Transfer
      this.$data.transferTypes = await dynamicConstsManager.transferTypes();
      this.transferType = this.$data.transferTypes[0];

      this.$data.facilities = await dynamicConstsManager.facilities();
      this.$data.transporterFacilities = await dynamicConstsManager.transporterFacilities();
      this.$data.destinationFacilities = await dynamicConstsManager.destinationFacilities();

      await dynamicConstsManager
        .defaultPhoneNumberForQuestions()
        .then((defaultPhoneNumberForQuestions) => {
          this.$data.defaultPhoneNumberForQuestions = defaultPhoneNumberForQuestions;
        });

      extractRecentDestinationFacilitiesFromTransfers().then(
        (recentDestinationFacilities: IMetrcFacilityData[]) => {
          this.$data.recentDestinationFacilities = recentDestinationFacilities;
        }
      );
      extractRecentTransporterFacilitiesFromTransfers().then(
        (recentTransporterFacilities: IMetrcFacilityData[]) => {
          this.$data.recentTransporterFacilities = recentTransporterFacilities;
        }
      );

      // Set state defaults
      this.phoneNumberForQuestions = this.$data.defaultPhoneNumberForQuestions;

      dynamicConstsManager.facilityMap().then((facilityMap: Map<string, IMetrcFacilityData>) => {
        this.originFacility = facilityMap.get(authState.license) ?? null;

        this.$data.originAddress = (
          facilityReadableAddressLinesOrNull(this.originFacility as IMetrcFacilityData) || []
        ).join("\n");
      });

      this.transferType = this.$data.transferTypes.find(
        (transferType: IMetrcTransferType) => transferType.Name === "Transfer"
      );
    } catch (e) {
      console.error(e);

      this.$data.showInitializationError = true;

      analyticsManager.track(MessageType.BUILDER_ERROR_READOUT, {
        errorMessage: `Transfer builder initialization error`,
        error: (e as Error)?.toString(),
      });
    }

    this.$data.transferDataLoading = false;
  },
  async created() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.prepend-icon {
  width: 2rem;
}
.fade-enter-active {
  transition: all 0.5s;
}
.fade-enter /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateY(10px);
}
</style>
