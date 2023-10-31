<template>
  <div>
    <div class="grid grid-cols-2 gap-4" style="grid-template-columns: auto 1fr">
      <start-finish-icons :ellipsisCount="ellipsisCount" class="row-span-3 text-purple-500" />

      <template v-if="originFacility">
        <facility-summary :facility="originFacility" />
      </template>
      <template v-else>
        <div></div>
      </template>

      <div class="py-8 flex flex-col space-y-2">
        <b-form-checkbox v-model="isLayover" size="md">Is Layover </b-form-checkbox>

        <template v-if="!isSameSiteTransfer">
          <b-form-group label="DEPART" label-class="text-gray-400" label-size="sm">
            <b-input-group class="flex flex-row gap-1">
              <b-form-timepicker
                v-model="departureIsotime"
                size="sm"
                required
                :state="!departureIsotime ? false : null"
              ></b-form-timepicker>

              <b-form-datepicker
                :date-format-options="dateFormatOptions"
                v-model="departureIsodate"
                size="sm"
                required
                :state="!departureIsodate ? false : null"
              ></b-form-datepicker>
            </b-input-group>
          </b-form-group>

          <template v-if="isLayover">
            <b-form-group label="LAYOVER CHECK IN" label-class="text-gray-400" label-size="sm">
              <b-input-group class="flex flex-row gap-1">
                <b-form-timepicker
                  v-model="layoverCheckInIsotime"
                  size="sm"
                  required
                  :state="!layoverCheckInIsotime ? false : null"
                ></b-form-timepicker>

                <b-form-datepicker
                  :date-format-options="dateFormatOptions"
                  v-model="layoverCheckInIsodate"
                  size="sm"
                  required
                  :state="!layoverCheckInIsodate ? false : null"
                ></b-form-datepicker>
              </b-input-group>
            </b-form-group>
            <b-form-group label="LAYOVER CHECK OUT" label-class="text-gray-400" label-size="sm">
              <b-input-group class="flex flex-row gap-1">
                <b-form-timepicker
                  v-model="layoverCheckOutIsotime"
                  required
                  size="sm"
                  :state="!layoverCheckOutIsotime ? false : null"
                ></b-form-timepicker>

                <b-form-datepicker
                  :date-format-options="dateFormatOptions"
                  required
                  v-model="layoverCheckOutIsodate"
                  size="sm"
                  :state="!layoverCheckOutIsodate ? false : null"
                ></b-form-datepicker>
              </b-input-group>
            </b-form-group>
          </template>

          <b-form-group label="ARRIVE" label-class="text-gray-400" label-size="sm">
            <b-input-group class="flex flex-row gap-1">
              <b-form-timepicker
                v-model="arrivalIsotime"
                required
                size="sm"
                :state="!arrivalIsotime ? false : null"
              ></b-form-timepicker>

              <b-form-datepicker
                :date-format-options="dateFormatOptions"
                required
                v-model="arrivalIsodate"
                size="sm"
                :state="!arrivalIsodate ? false : null"
              ></b-form-datepicker>
            </b-input-group>
          </b-form-group>
        </template>
      </div>

      <template v-if="destinationFacility">
        <facility-summary :facility="destinationFacility" />
      </template>
      <template v-else>
        <div></div>
      </template>
    </div>

    <div class="row-span-2 flex flex-col items-center justify-center text-purple-500"></div>
  </div>
</template>

<script lang="ts">
import FacilitySummary from "@/components/overlay-widget/shared/FacilitySummary.vue";
import StartFinishIcons from "@/components/overlay-widget/shared/StartFinishIcons.vue";
import { BuilderType, MessageType } from "@/consts";
import { IComputedGetSet } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { TransferBuilderActions } from "@/store/page-overlay/modules/transfer-builder/consts";
import { todayIsodate } from "@/utils/date";
import { isotimeToNaiveTime, naiveTimeToIsotime } from "@/utils/time";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "DepartureArrivalPicker",
  store,
  router,
  components: {
    StartFinishIcons,
    FacilitySummary,
  },
  computed: {
    ...mapState({
      originFacility: (state: any) => state.transferBuilder.originFacility,
      destinationFacility: (state: any) => state.transferBuilder.destinationFacility,
      isSameSiteTransfer: (state: any) => state.transferBuilder.isSameSiteTransfer,
    }),
    ellipsisCount(): number {
      let base = 14;

      if (this.isSameSiteTransfer) {
        base -= 7;
      }

      if (this.isLayover) {
        base += 9;
      }

      return base;
    },
    isLayover: {
      get() {
        return store.state.transferBuilder.isLayover;
      },
      set(isLayover: boolean) {
        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          isLayover,
        });
      },
    } as IComputedGetSet<boolean>,
    departureIsodate: {
      get() {
        return store.state.transferBuilder.departureIsodate;
      },
      set(departureIsodate: string) {
        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          departureIsodate,
        });
      },
    } as IComputedGetSet<string>,
    departureIsotime: {
      get() {
        return isotimeToNaiveTime(store.state.transferBuilder.departureIsotime);
      },
      set(naiveDepartureTime: string) {
        const departureIsotime = naiveTimeToIsotime(naiveDepartureTime);

        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          departureIsotime,
        });
      },
    } as IComputedGetSet<string>,
    arrivalIsodate: {
      get() {
        return store.state.transferBuilder.arrivalIsodate;
      },
      set(arrivalIsodate: string) {
        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          arrivalIsodate,
        });
      },
    } as IComputedGetSet<string>,
    arrivalIsotime: {
      get() {
        return isotimeToNaiveTime(store.state.transferBuilder.arrivalIsotime);
      },
      set(naiveArrivalTime: string) {
        const arrivalIsotime = naiveTimeToIsotime(naiveArrivalTime);

        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          arrivalIsotime,
        });
      },
    } as IComputedGetSet<string>,
    layoverCheckInIsodate: {
      get() {
        return store.state.transferBuilder.layoverCheckInIsodate;
      },
      set(layoverCheckInIsodate: string) {
        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          layoverCheckInIsodate,
        });
      },
    } as IComputedGetSet<string>,
    layoverCheckInIsotime: {
      get() {
        return isotimeToNaiveTime(store.state.transferBuilder.layoverCheckInIsotime);
      },
      set(naiveDepartureTime: string) {
        const layoverCheckInIsotime = naiveTimeToIsotime(naiveDepartureTime);

        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          layoverCheckInIsotime,
        });
      },
    } as IComputedGetSet<string>,
    layoverCheckOutIsodate: {
      get() {
        return store.state.transferBuilder.layoverCheckOutIsodate;
      },
      set(layoverCheckOutIsodate: string) {
        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          layoverCheckOutIsodate,
        });
      },
    } as IComputedGetSet<string>,
    layoverCheckOutIsotime: {
      get() {
        return isotimeToNaiveTime(store.state.transferBuilder.layoverCheckOutIsotime);
      },
      set(naiveArrivalTime: string) {
        const layoverCheckOutIsotime = naiveTimeToIsotime(naiveArrivalTime);

        store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          layoverCheckOutIsotime,
        });
      },
    } as IComputedGetSet<string>,
  },
  data() {
    return {
      dateFormatOptions: {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      },
    };
  },
  watch: {
    departureIsotime: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceArrivalGteDeparture(false);
      },
    },
    departureIsodate: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceArrivalGteDeparture(false);
      },
    },
    arrivalIsotime: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceArrivalGteDeparture(true);
      },
    },
    arrivalIsodate: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceArrivalGteDeparture(true);
      },
    },
    layoverCheckInIsotime: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceLayoverArrivalGteDeparture(false);
      },
    },
    layoverCheckInIsodate: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceLayoverArrivalGteDeparture(false);
      },
    },
    layoverCheckOutIsotime: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceLayoverArrivalGteDeparture(true);
      },
    },
    layoverCheckOutIsodate: {
      immediate: true,
      handler(newValue, oldValue) {
        this.enforceLayoverArrivalGteDeparture(true);
      },
    },
  },
  methods: {
    enforceLayoverArrivalGteDeparture(updateDeparture: boolean) {
      // If one or both of the dates isn't provided,
      // there is no meaningful enforcement possible
      if (!this.layoverCheckInIsodate || !this.layoverCheckOutIsodate) {
        return;
      }

      // Force layoverCheckOut date to be greater or equal to layoverCheckIn date
      if (this.layoverCheckOutIsodate < this.layoverCheckInIsodate) {
        if (updateDeparture) {
          this.layoverCheckInIsodate = this.layoverCheckOutIsodate;
        } else {
          this.layoverCheckOutIsodate = this.layoverCheckInIsodate;
        }
      }

      // If the layoverCheckOut and layoverCheckIn dates are on the same day,
      // force layoverCheckOut time to be greater or equal to layoverCheckIn time
      if (
        this.layoverCheckOutIsodate === this.layoverCheckInIsodate &&
        !!this.layoverCheckInIsotime &&
        !!this.layoverCheckOutIsotime
      ) {
        if (this.layoverCheckOutIsotime < this.layoverCheckInIsotime) {
          if (updateDeparture) {
            this.layoverCheckInIsotime = this.layoverCheckOutIsotime;
          } else {
            this.layoverCheckOutIsotime = this.layoverCheckInIsotime;
          }
        }
      }

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Updated layoverCheckOut/layoverCheckIn: ${this.layoverCheckInIsodate} ${this.layoverCheckInIsotime} -> ${this.layoverCheckOutIsodate} ${this.layoverCheckOutIsotime}`,
      });
    },
    enforceArrivalGteDeparture(updateDeparture: boolean) {
      // If one or both of the dates isn't provided,
      // there is no meaningful enforcement possible
      if (!this.departureIsodate || !this.arrivalIsodate) {
        return;
      }

      // Force arrival date to be greater or equal to departure date
      if (this.arrivalIsodate < this.departureIsodate) {
        if (updateDeparture) {
          this.departureIsodate = this.arrivalIsodate;
        } else {
          this.arrivalIsodate = this.departureIsodate;
        }
      }

      // If the arrival and departure dates are on the same day,
      // force arrival time to be greater or equal to departure time
      if (
        this.arrivalIsodate === this.departureIsodate &&
        !!this.departureIsotime &&
        !!this.arrivalIsotime
      ) {
        if (this.arrivalIsotime < this.departureIsotime) {
          if (updateDeparture) {
            this.departureIsotime = this.arrivalIsotime;
          } else {
            this.arrivalIsotime = this.departureIsotime;
          }
        }
      }

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: BuilderType.CREATE_TRANSFER,
        action: `Updated arrival/departure: ${this.departureIsodate} ${this.departureIsotime} -> ${this.arrivalIsodate} ${this.arrivalIsotime}`,
      });
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
