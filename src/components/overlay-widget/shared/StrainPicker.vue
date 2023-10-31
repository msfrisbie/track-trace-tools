<template>
  <div class="flex flex-col space-y-4 items-center text-center">
    <!-- https://mattzollinhofer.github.io/vue-typeahead-bootstrap-docs/examples/examples.html#prepend-append -->

    <template v-if="strain">
      <b-button-group class="self-start">
        <b-button
          size="md"
          variant="primary"
          class="overflow-x-hidden"
          style="max-width:300px"
          disabled
          >{{ strain.Name }}</b-button
        >
        <b-button
          size="md"
          variant="primary"
          @click="
            selectStrain(null);
            strainNameQuery = '';
          "
          >&#10005;</b-button
        >
      </b-button-group>
    </template>

    <template v-if="!strain">
      <vue-typeahead-bootstrap
        v-model="strainNameQuery"
        :data="strains"
        :serializer="strain => strain.Name"
        :minMatchingChars="0"
        :showOnFocus="true"
        :maxMatches="100"
        @hit="selectStrain($event)"
        type="text"
        required
        placeholder="Strain name"
        class="w-full text-left"
        size="md"
      />

      <template v-if="isNewStrainName && enableHotStrainCreate">
        <div class="w-full flex flex-col items-stretch p-1 space-y-1">
          <b-button
            class="self-start"
            variant="link"
            size="sm"
            @click="showCreateStrainForm = !showCreateStrainForm"
          >
            <template v-if="!showCreateStrainForm">
              <b-badge>BETA</b-badge>&nbsp;Create new strain "{{ strainNameQuery }}"
            </template>
            <template v-else>HIDE</template>
          </b-button>

          <template v-if="showCreateStrainForm">
            <b-card class="w-full" body-class="w-full flex flex-col items-stretch space-y-2">
              <b-input-group append="Testing Status" size="sm">
                <b-form-select
                  size="sm"
                  v-model="newStrainTestingStatus"
                  :options="newStrainTestingStatusOptions"
                />
              </b-input-group>

              <div class="grid grid-cols-2 gap-2">
                <b-input-group append="% Indica" size="sm">
                  <b-form-input
                    type="number"
                    max="100"
                    min="0"
                    size="sm"
                    v-model="newStrainIndicaPercent"
                  />
                </b-input-group>

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
              </div>

              <b-button
                class="self-center"
                variant="primary"
                :disabled="!strainCreateInputsValid || createStrainInflight"
                @click="createStrainAndReloadOrError()"
                >CREATE</b-button
              >

              <template v-if="createStrainInflight">
                <div class="flex flex-row justify-center items-center space-x-4 text-gray-700">
                  <b-spinner small /><span>Creating strain...</span>
                </div>
              </template>

              <template v-if="createStrainError">
                <span class="text-red-700">{{ createStrainError }}</span>
              </template>
            </b-card>
          </template>
        </div>
      </template>
    </template>

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
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { IStrainData, IMetrcCreateStrainsPayload } from "@/interfaces";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import { DataLoadError, DataLoadErrorType } from "@/modules/data-loader/data-loader-error";
import { STRAIN_TESTING_STATUS_OPTIONS } from "@/consts";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";

export default Vue.extend({
  name: "StrainPicker",
  store,
  components: {
    ErrorReadout
  },
  props: {
    strain: Object as () => IStrainData,
    suggestedStrainName: String,
    enableHotStrainCreate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      test: "",
      showCreateStrainForm: false,
      showCreateStrainOptionalFields: false,
      strainNameQuery: "",
      inflight: false,
      error: null,
      strains: [],
      newStrainTestingStatus: null,
      newStrainTestingStatusOptions: [],
      newStrainThcPercent: null,
      newStrainCbdPercent: null,
      newStrainIndicaPercent: 100,
      createStrainInflight: false,
      createStrainError: null
    };
  },
  computed: {
    strainOptions() {
      return this.$data.strains.map((strain: IStrainData) => ({
        text: strain.Name,
        value: strain
      }));
    },
    isNewStrainName() {
      if (!(this as any).$data.strainNameQuery) {
        return false;
      }

      const strainNameMatchesExistingStrain: boolean = this.$data.strains
        .map((strain: IStrainData) => strain.Name.toLocaleLowerCase())
        .includes(this.$data.strainNameQuery.toLocaleLowerCase());

      return !strainNameMatchesExistingStrain;
    },
    strainCreateInputsValid() {
      const {
        strainNameQuery,
        newStrainThcPercent,
        newStrainCbdPercent,
        newStrainIndicaPercent
      } = (this as any).$data;

      if (!strainNameQuery) {
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
      }
      return `% Indica, ${100 - (this as any).$data.newStrainIndicaPercent}% Sativa`;
    }
  },
  watch: {
    strain: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue) {
          (this as any).$data.strainNameQuery = newValue?.Name;
        }
      }
    },
    suggestedStrainName: {
      immediate: true,
      handler() {
        (this as any).maybeSetStrainDefault();
      }
    }
  },
  methods: {
    async loadStrains() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        this.$data.inflight = true;
        this.$data.strains = await primaryDataLoader.strains();

        (this as any).maybeSetStrainDefault();
      } catch (e) {
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }

      if (this.$data.strains.length === 0) {
        console.error("Server returned 0 strains");

        this.$data.error = new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          "Zero results returned"
        );
      }
    },
    maybeSetStrainDefault() {
      if (this.$data.strains) {
        return;
      }

      if (!(this as any).suggestedStrainName) {
        return;
      }

      if ((this as any).strain) {
        return;
      }

      const matchingStrain = this.$data.strains.find(
        (x: IStrainData) => x.Name === (this as any).suggestedStrainName
      );

      if (matchingStrain) {
        this.selectStrain(matchingStrain);
      }
    },
    async selectStrain(strain: IStrainData | null) {
      return this.$emit("update:strain", strain);
    },
    async createStrainAndReloadOrError() {
      this.$data.createStrainInflight = true;
      this.$data.createStrainError = null;

      function numberStringOrEmptyString(val: number | null | undefined | ""): string {
        if (!val && val !== 0) {
          return "";
        }
        return `${val}`;
      }

      const rows: IMetrcCreateStrainsPayload[] = [
        {
          CbdLevel: numberStringOrEmptyString(this.$data.newStrainCbdPercent),
          IndicaPercentage: numberStringOrEmptyString(this.$data.newStrainIndicaPercent),
          Name: this.$data.strainNameQuery,
          SativaPercentage: numberStringOrEmptyString(100 - this.$data.newStrainIndicaPercent),
          TestingStatus: this.$data.newStrainTestingStatus,
          ThcLevel: numberStringOrEmptyString(100 - this.$data.newStrainThcPercent)
        }
      ];

      try {
        const response = await primaryMetrcRequestManager.createStrains(JSON.stringify(rows));

        if (response.status === 200) {
          this.$data.strains = await primaryDataLoader.strains(true);

          const matchingNewStrain = this.$data.strains.find(
            (x: IStrainData) => x.Name === this.$data.strainNameQuery
          );

          if (matchingNewStrain) {
            this.selectStrain(matchingNewStrain);
          } else {
            console.error("Could not match strain");
          }

          this.$data.showCreateStrainForm = false;
        } else {
          throw new Error("Failed to create strain");
        }
      } catch (e) {
        this.$data.createStrainError = (e as Error).message || "Failed to create strain";
      } finally {
        this.$data.createStrainInflight = false;
      }
    }
  },
  async mounted() {
    // @ts-ignore
    this.loadStrains();

    // @ts-ignore
    this.$data.newStrainTestingStatusOptions = STRAIN_TESTING_STATUS_OPTIONS;
    // @ts-ignore
    this.$data.newStrainTestingStatus = this.$data.newStrainTestingStatusOptions[0].value;
  }
});
</script>
