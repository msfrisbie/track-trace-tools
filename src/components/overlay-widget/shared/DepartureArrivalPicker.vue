<template>
  <div>
    <div class="grid grid-cols-2 gap-4" style="grid-template-columns: auto 1fr">
      <start-finish-icons
        :ellipsisCount="isSameSiteTransfer ? 7 : 14"
        class="row-span-3 text-purple-500"
      />

      <template v-if="originFacility">
        <facility-summary :facility="originFacility" />
      </template>
      <template v-else>
        <div></div>
      </template>

      <div class="py-8 flex flex-col space-y-0">
        <template v-if="!isSameSiteTransfer">
          <b-form-group label="DEPART" label-class="text-gray-400" label-size="sm">
            <b-input-group>
              <b-form-timepicker
                v-model="departureIsotime"
                class="borderless-input"
                size="sm"
                required
                :state="!departureIsotime ? false : null"
              ></b-form-timepicker>

              <b-form-datepicker
                :date-format-options="dateFormatOptions"
                class="borderless-input"
                v-model="departureIsodate"
                size="sm"
                required
                :state="!departureIsodate ? false : null"
              ></b-form-datepicker>
            </b-input-group>
          </b-form-group>

          <b-form-group label="ARRIVE" label-class="text-gray-400" label-size="sm">
            <b-input-group>
              <b-form-timepicker
                v-model="arrivalIsotime"
                class="borderless-input"
                required
                size="sm"
                :state="!arrivalIsotime ? false : null"
              ></b-form-timepicker>

              <b-form-datepicker
                :date-format-options="dateFormatOptions"
                class="borderless-input"
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
    departureIsodate: {
      get() {
        return this.$store.state.transferBuilder.departureIsodate;
      },
      set(departureIsodate) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          departureIsodate,
        });
      },
    },
    departureIsotime: {
      get() {
        return isotimeToNaiveTime(this.$store.state.transferBuilder.departureIsotime);
      },
      set(naiveDepartureTime: string) {
        const departureIsotime = naiveTimeToIsotime(naiveDepartureTime);

        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          departureIsotime,
        });
      },
    },
    arrivalIsodate: {
      get() {
        return this.$store.state.transferBuilder.arrivalIsodate;
      },
      set(arrivalIsodate) {
        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          arrivalIsodate,
        });
      },
    },
    arrivalIsotime: {
      get() {
        return isotimeToNaiveTime(this.$store.state.transferBuilder.arrivalIsotime);
      },
      set(naiveArrivalTime: string) {
        const arrivalIsotime = naiveTimeToIsotime(naiveArrivalTime);

        this.$store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
          arrivalIsotime,
        });
      },
    },
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
        // @ts-ignore
        this.enforceArrivalGteDeparture(false);
      },
    },
    departureIsodate: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.enforceArrivalGteDeparture(false);
      },
    },
    arrivalIsotime: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.enforceArrivalGteDeparture(true);
      },
    },
    arrivalIsodate: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.enforceArrivalGteDeparture(true);
      },
    },
  },
  methods: {
    enforceArrivalGteDeparture(updateDeparture: boolean) {
      // If one or both of the dates isn't provided,
      // there is no meaningful enforcement possible
      if (!this.departureIsodate || !this.arrivalIsodate) {
        return;
      }

      // Force arrival date to be greater or equal to departure date
      // @ts-ignore
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
        // @ts-ignore
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
  async mounted() {
    this.departureIsodate = todayIsodate();
    this.departureIsotime = "10:00:00.000";
    this.arrivalIsodate = todayIsodate();
    this.arrivalIsotime = "14:00:00.000";
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
