<template>
  <div class="driver-vehicle-picker">
    <b-form-group label="DRIVER" label-class="text-gray-400" label-size="sm">
      <b-input-group class="flex flex-row">
        <template v-if="showDriverSearch">
          <vue-typeahead-bootstrap
            style="position: relative"
            placeholder="Name or driver's license number"
            size="sm"
            ref="driversearch"
            class="flex-grow"
            :data="drivers"
            :showOnFocus="true"
            :serializer="
              (driver) =>
                `${driver.DriverName} | ${driver.DriverVehicleLicenseNumber}`
            "
            @hit="selectDriver($event)"
          >
          </vue-typeahead-bootstrap>
        </template>

        <template v-else>
          <b-form-input
            v-model="driverName"
            :state="!driverName ? false : null"
            size="sm"
            placeholder="NAME"
          />

          <b-form-input
            v-model="driverEmployeeId"
            :state="!driverEmployeeId ? false : null"
            size="sm"
            placeholder="EMPLOYEE ID"
          />

          <b-form-input
            v-model="driverLicenseNumber"
            :state="!driverLicenseNumber ? false : null"
            size="sm"
            placeholder="LICENSE #"
          />
        </template>

        <template v-if="drivers.length > 0">
          <b-input-group-append>
            <b-button
              variant="outline-dark"
              class="opacity-70"
              @click="toggleDriverSearch()"
            >
              <font-awesome-icon
                :icon="showDriverSearch ? 'times' : 'search'"
              />
            </b-button>
          </b-input-group-append>
        </template>
      </b-input-group>
    </b-form-group>

    <b-form-group label="VEHICLE" label-class="text-gray-400" label-size="sm">
      <b-input-group class="flex flex-row">
        <template v-if="showVehicleSearch">
          <vue-typeahead-bootstrap
            style="position: relative"
            placeholder="Search vehicles"
            size="sm"
            ref="vehiclesearch"
            class="flex-grow"
            :data="vehicles"
            :showOnFocus="true"
            :serializer="
              (vehicle) =>
                `${vehicle.VehicleMake} ${vehicle.VehicleModel} (${vehicle.VehicleLicensePlateNumber})`
            "
            @hit="selectVehicle($event)"
          >
          </vue-typeahead-bootstrap>
        </template>

        <template v-else>
          <b-form-input
            v-model="vehicleMake"
            :state="!vehicleMake ? false : null"
            placeholder="MAKE"
            size="sm"
          />
          <b-form-input
            v-model="vehicleModel"
            :state="!vehicleModel ? false : null"
            placeholder="MODEL"
            size="sm"
          />
          <b-form-input
            v-model="vehicleLicensePlate"
            :state="!vehicleLicensePlate ? false : null"
            placeholder="PLATE"
            size="sm"
          />
        </template>

        <template v-if="vehicles.length > 0">
          <b-input-group-append>
            <b-button
              variant="outline-dark"
              class="opacity-70"
              @click="toggleVehicleSearch()"
            >
              <font-awesome-icon
                :icon="showVehicleSearch ? 'times' : 'search'"
              />
            </b-button>
          </b-input-group-append>
        </template>
      </b-input-group>
    </b-form-group>

    <template v-if="transferDataLoading">
      <div
        class="
          flex flex-row
          items-center
          justify-center
          space-x-2
          text-gray-500
        "
      >
        <b-spinner small />
        <span>Loading transporters...</span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import {
  TransferBuilderActions,
  TransferBuilderGetters,
  TRANSFER_BUILDER,
} from "@/store/page-overlay/modules/transfer-builder/consts";
import {
  IPlantData,
  IPlantFilter,
  ICsvFile,
  ILocationData,
  IMetrcMovePlantsPayload,
  IPackageData,
  IMetrcTransferType,
  IMetrcDriverData,
  IMetrcFacilityData,
  IPluginState,
  IMetrcVehicleData,
  ITransferPackageList,
  ITransferData,
} from "@/interfaces";
import { combineLatest, from, Subject, timer } from "rxjs";
import { authManager } from "@/modules/auth-manager.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { extractDriversAndVehiclesFromTransferHistory } from "@/utils/transfer";
import _ from "lodash";
import { BuilderType, MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";

const dedupObjects = (acc: any[], current: any) =>
  acc.find((x: any) => _.isEqual(x, current)) ? acc : [...acc, current];

export default Vue.extend({
  name: "DriverVehiclePicker",
  store,
  computed: {
    driverName: {
      get() {
        return this.$store.state.transferBuilder.driverName;
      },
      set(driverName) {
        this.$store.dispatch(
          `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
          { driverName }
        );
      },
    },
    driverEmployeeId: {
      get() {
        return this.$store.state.transferBuilder.driverEmployeeId;
      },
      set(driverEmployeeId) {
        this.$store.dispatch(
          `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
          { driverEmployeeId }
        );
      },
    },
    driverLicenseNumber: {
      get() {
        return this.$store.state.transferBuilder.driverLicenseNumber;
      },
      set(driverLicenseNumber) {
        this.$store.dispatch(
          `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
          { driverLicenseNumber }
        );
      },
    },
    vehicleMake: {
      get() {
        return this.$store.state.transferBuilder.vehicleMake;
      },
      set(vehicleMake) {
        this.$store.dispatch(
          `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
          { vehicleMake }
        );
      },
    },
    vehicleModel: {
      get() {
        return this.$store.state.transferBuilder.vehicleModel;
      },
      set(vehicleModel) {
        this.$store.dispatch(
          `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
          { vehicleModel }
        );
      },
    },
    vehicleLicensePlate: {
      get() {
        return this.$store.state.transferBuilder.vehicleLicensePlate;
      },
      set(vehicleLicensePlate) {
        this.$store.dispatch(
          `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
          { vehicleLicensePlate }
        );
      },
    },
  },
  data() {
    return {
      transferDataLoading: false,
      drivers: [],
      showDriverSearch: false,
      vehicles: [],
      showVehicleSearch: false,
    };
  },
  methods: {
    selectDriver(driver: IMetrcDriverData) {
      if (!driver) {
        return;
      }

      this.$store.dispatch(
        `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
        {
          driverName: driver.DriverName,
          driverEmployeeId: driver.DriverOccupationalLicenseNumber,
          driverLicenseNumber: driver.DriverVehicleLicenseNumber,
        }
      );

      this.$data.showDriverSearch = false;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Selected driver`,
        driver,
      });
    },
    selectVehicle(vehicle: IMetrcVehicleData) {
      if (!vehicle) {
        return;
      }

      this.$store.dispatch(
        `transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`,
        {
          vehicleMake: vehicle.VehicleMake,
          vehicleModel: vehicle.VehicleModel,
          vehicleLicensePlate: vehicle.VehicleLicensePlateNumber,
        }
      );

      this.$data.showVehicleSearch = false;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Selected vehicle`,
        vehicle,
      });
    },
    toggleVehicleSearch() {
      if (!this.$data.showVehicleSearch) {
        timer(0).subscribe(() =>
          // @ts-ignore
          this.$refs.vehiclesearch.$el.querySelector("input").focus()
        );
      }

      this.$data.showVehicleSearch = !this.$data.showVehicleSearch;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Set show vehicle search to ${this.$data.showVehicleSearch}`,
      });
    },
    toggleDriverSearch() {
      if (!this.$data.showDriverSearch) {
        timer(0).subscribe(() =>
          // @ts-ignore
          this.$refs.driversearch.$el.querySelector("input").focus()
        );
      }

      this.$data.showDriverSearch = !this.$data.showDriverSearch;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Set show driver search to ${this.$data.showDriverSearch}`,
      });
    },
  },
  async created() {},
  async mounted() {
    await authManager.authStateOrError();

    this.$data.transferDataLoading = true;

    analyticsManager.track(MessageType.BUILDER_EVENT, {
      builder: BuilderType.CREATE_TRANSFER,
      action: `Started driver and vehicle load`,
    });

    try {
      extractDriversAndVehiclesFromTransferHistory()
        .then(
          async ({
            drivers,
            vehicles,
          }: {
            drivers: IMetrcDriverData[];
            vehicles: IMetrcVehicleData[];
          }) => {
            this.$data.drivers = [
              ...(await dynamicConstsManager.drivers()),
              ...drivers,
            ].reduce(dedupObjects, []);

            this.$data.vehicles = [
              ...(await dynamicConstsManager.vehicles()),
              ...vehicles,
            ].reduce(dedupObjects, []);

            analyticsManager.track(MessageType.BUILDER_EVENT, {
              builder: BuilderType.CREATE_TRANSFER,
              action: `Finished loading ${this.$data.drivers.length} drivers and ${this.$data.vehicles.length} vehicles`,
            });

            if (
              this.$data.drivers.length > 0 &&
              !this.driverName &&
              !this.driverEmployeeId &&
              !this.driverLicenseNumber
            ) {
              this.$data.showDriverSearch = true;
            }

            if (
              this.$data.vehicles.length > 0 &&
              !this.vehicleMake &&
              !this.vehicleModel &&
              !this.vehicleLicensePlate
            ) {
              this.$data.showVehicleSearch = true;
            }

            this.$data.transferDataLoading = false;
          }
        )
        .catch(() => {
          this.$data.transferDataLoading = false;
        });
    } catch (e) {
      console.error(e);
      this.$data.showInitializationError = true;

      analyticsManager.track(MessageType.BUILDER_EVENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Failed loading drivers/vehicles`,
        error: e,
      });

      this.$data.transferDataLoading = false;
    }
  },
});
</script>

<style type="text/scss" lang="scss">
.driver-vehicle-picker .vbt-autcomplete-list {
  max-height: 12rem !important;
}
</style>
