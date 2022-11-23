<template>
  <div>
    <div class="flex flex-col items-stretch p-1 gap-1">
      <div class="grid grid-cols-3 gap-8">
        <div class="col-span-2 grid grid-cols-2 gap-2">
          <b-form-group label="Strain Name" label-class="text-sm text-gray-600">
            <b-form-input size="sm" v-model="strainName" required />
            <div v-if="strainName.length > 0 && !isNewStrainName" class="text-red-500 pt-1">
              Strain name already exists.
            </div>
          </b-form-group>

          <b-form-group label="Testing Status" label-class="text-sm text-gray-600" size="sm">
            <b-form-select
              size="sm"
              v-model="newStrainTestingStatus"
              :options="newStrainTestingStatusOptions"
            />
          </b-form-group>

          <b-form-group>
            <b-input-group append="% Indica" size="sm">
              <b-form-input
                type="number"
                max="100"
                min="0"
                size="sm"
                required
                v-model="newStrainIndicaPercent"
              />
            </b-input-group>
            <div v-if="!isIndicaPercentValid" class="text-red-500 pt-1">% Indica required.</div>
          </b-form-group>

          <b-form-group>
            <b-input-group append="% Sativa" size="sm">
              <b-form-input
                type="number"
                max="100"
                min="0"
                size="sm"
                disabled
                :value="100 - (newStrainIndicaPercent || 0)"
              />
            </b-input-group>
          </b-form-group>

          <template v-if="!showCreateStrainOptionalFields">
            <b-button
              class="self-start col-span-2"
              variant="link"
              size="sm"
              @click="showCreateStrainOptionalFields = true"
              >+ OPTIONAL FIELDS</b-button
            >
          </template>

          <template v-if="showCreateStrainOptionalFields">
            <b-input-group append="% THC" size="sm">
              <b-form-input
                type="number"
                max="100"
                min="0"
                size="sm"
                v-model="newStrainThcPercent"
              />
            </b-input-group>

            <b-input-group append="% CBD" size="sm">
              <b-form-input
                type="number"
                max="100"
                min="0"
                size="sm"
                v-model="newStrainCbdPercent"
              />
            </b-input-group>
          </template>

          <b-button
            class="col-span-2"
            variant="primary"
            :disabled="!isNewStrainName || !strainCreateInputsValid || createStrainInflight"
            @click="createStrainAndReloadOrError()"
            >CREATE</b-button
          >
        </div>

        <b-form-group label="Prefill from existing strain" label-class="text-sm text-gray-600">
          <strain-picker :strain.sync="strain"></strain-picker>
        </b-form-group>

        <!-- <template v-if="!strainCreateInputsValid">
          <div class="text-red-500"></div>
        </template> -->

        <div class="h-12 col-span-2 flex flex-row justify-center items-center">
          <template v-if="createStrainInflight">
            <div class="flex flex-row justify-center items-center gap-2 text-gray-700 text-lg">
              <b-spinner /><span>Creating strain...</span>
            </div>
          </template>

          <template v-if="createStrainSuccess">
            <div class="flex flex-row justify-center items-center gap-2 text-green-700 text-lg">
              <animated-checkmark></animated-checkmark>
              <span>Strain created</span>
            </div>
          </template>

          <template v-if="createStrainError">
            <span class="text-red-700">{{ createStrainError }}</span>
          </template>

          <div class="flex flex-row justify-center">
            <error-readout
              v-if="error || inflight"
              :inflight="inflight"
              :error="error"
              loadingMessage="Loading strains..."
              errorMessage="Unable to load strains."
              permissionsErrorMessage="Check that your employee account has 'Manage Strains' permissions."
              v-on:retry="loadStrains()"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import AnimatedCheckmark from "@/components/overlay-widget/shared/AnimatedCheckmark.vue";
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import StrainPicker from "@/components/overlay-widget/shared/StrainPicker.vue";
import { MessageType, STRAIN_TESTING_STATUS_OPTIONS } from "@/consts";
import { IMetrcCreateStrainsPayload, IStrainData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

function numberStringOrEmptyString(val: number | null | undefined | ""): string {
  if (!val && val !== 0) {
    return "";
  } else {
    return "" + val;
  }
}

export default Vue.extend({
  name: "QuickStrain",
  store,
  router,
  props: {},
  components: {
    ErrorReadout,
    StrainPicker,
    AnimatedCheckmark,
  },
  computed: {
    ...mapState([]),
    strainOptions() {
      return this.$data.strains.map((strain: IStrainData) => ({
        text: strain.Name,
        value: strain,
      }));
    },
    isNewStrainName() {
      if (!(this as any).$data.strainName) {
        return false;
      }

      const strainNameMatchesExistingStrain: boolean = this.$data.strains
        .map((strain: IStrainData) => strain.Name.toLocaleLowerCase())
        .includes(this.$data.strainName.toLocaleLowerCase());

      return !strainNameMatchesExistingStrain;
    },
    isIndicaPercentValid(): boolean {
      return typeof parseInt(this.$data.newStrainIndicaPercent, 10) === "number";
    },
    strainCreateInputsValid() {
      const { strainName, newStrainThcPercent, newStrainCbdPercent, newStrainIndicaPercent } = (
        this as any
      ).$data;

      if (!strainName) {
        return false;
      }

      if ((!!newStrainThcPercent && newStrainThcPercent < 0) || newStrainThcPercent > 100) {
        return false;
      }

      if ((!!newStrainCbdPercent && newStrainCbdPercent < 0) || newStrainCbdPercent > 100) {
        return false;
      }

      if (!newStrainIndicaPercent) {
        return false;
      }

      if (
        (!!newStrainIndicaPercent && newStrainIndicaPercent < 0) ||
        newStrainIndicaPercent > 100
      ) {
        return false;
      }

      return true;
    },
    indicaSativaAppend() {
      if (
        !(this as any).$data.newStrainIndicaPercent &&
        (this as any).$data.newStrainIndicaPercent !== 0
      ) {
        return "% Indica";
      } else {
        return `% Indica, ${100 - (this as any).$data.newStrainIndicaPercent}% Sativa`;
      }
    },
  },
  data() {
    return {
      showCreateStrainOptionalFields: false,
      strainName: "",
      inflight: false,
      error: null,
      strain: null,
      strains: [],
      newStrainTestingStatus: null,
      newStrainTestingStatusOptions: [],
      newStrainThcPercent: null,
      newStrainCbdPercent: null,
      newStrainIndicaPercent: 100,
      createStrainInflight: false,
      createStrainError: null,
      createStrainSuccess: false,
    };
  },
  methods: {
    async loadStrains() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        this.$data.inflight = true;
        this.$data.strains = await primaryDataLoader.strains(true);
      } catch (e) {
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }
    },
    async createStrainAndReloadOrError() {
      analyticsManager.track(MessageType.QUICK_ACTION_SUBMIT, {
        actionType: "ADD_STRAIN",
      });

      this.$data.createStrainInflight = true;
      this.$data.createStrainError = null;
      this.$data.createStrainSuccess = false;

      const rows: IMetrcCreateStrainsPayload[] = [
        {
          CbdLevel: numberStringOrEmptyString(this.$data.newStrainCbdPercent),
          IndicaPercentage: numberStringOrEmptyString(this.$data.newStrainIndicaPercent),
          Name: this.$data.strainName,
          SativaPercentage: numberStringOrEmptyString(100 - this.$data.newStrainIndicaPercent),
          TestingStatus: this.$data.newStrainTestingStatus,
          ThcLevel: numberStringOrEmptyString(100 - this.$data.newStrainThcPercent),
        },
      ];

      try {
        const response = await primaryMetrcRequestManager.createStrains(JSON.stringify(rows));

        if (response.status === 200) {
          analyticsManager.track(MessageType.QUICK_ACTION_SUCCESS, {
            actionType: "ADD_STRAIN",
          });
          primaryDataLoader.dispatchStrainUpdatedEvent();

          // @ts-ignore
          this.loadStrains(true);

          this.$data.strain = null;

          this.$data.createStrainSuccess = true;
        } else {
          analyticsManager.track(MessageType.QUICK_ACTION_ERROR, {
            actionType: "ADD_STRAIN",
          });
          throw new Error("Failed to create strain");
        }
      } catch (e) {
        this.$data.createStrainError = (e as Error).message || "Failed to create strain";
      } finally {
        this.$data.createStrainInflight = false;
      }
    },
  },
  watch: {
    strain: {
      immediate: true,
      handler(newValue: IStrainData | null, oldValue) {
        if (newValue) {
          this.$data.strainName = newValue.Name;
          this.$data.newStrainIndicaPercent = newValue.IndicaPercentage;
          this.$data.newStrainTestingStatus = newValue.TestingStatus;
          this.$data.newStrainThcPercent = newValue.ThcLevel;
          this.$data.newStrainCbdPercent = newValue.CbdLevel;
        }
      },
    },
  },
  async created() {},
  async mounted() {
    // @ts-ignore
    this.loadStrains();

    // @ts-ignore
    this.$data.newStrainTestingStatusOptions = STRAIN_TESTING_STATUS_OPTIONS;
    // @ts-ignore
    this.$data.newStrainTestingStatus = this.$data.newStrainTestingStatusOptions[0].value;
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
