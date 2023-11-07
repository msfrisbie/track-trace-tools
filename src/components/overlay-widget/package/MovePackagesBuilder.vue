<template>
  <div class="w-full flex flex-col flex-grow space-y-4">
    <div class="w-full grid grid-cols-3 gap-4 auto-cols-fr">
      <builder-step-header
        v-for="(step, index) of steps"
        :key="index"
        :stepNumber="index + 1"
        :stepText="step.stepText"
        :active="index === activeStepIndex"
        @click.stop.prevent.native="setActiveStepIndex(index)"
      />
    </div>

    <template v-if="activeStepIndex === 0">
      <div class="w-full flex flex-col space-y-4">
        <package-picker
          :builderType="builderType"
          :selectedPackages.sync="selectedPackages"
          :showLocationPicker="true"
        />

        <template v-if="selectedPackages.length > 0">
          <div class="flex flex-row justify-end">
            <b-button class="w-1/2" variant="success" size="md" @click="activeStepIndex = 1">
              NEXT
            </b-button>
          </div>
        </template>
      </div>
    </template>

    <template v-if="activeStepIndex === 1">
      <div class="flex flex-col items-center">
        <div class="flex flex-col items-center" style="width: 600px">
          <b-form-group class="w-full" label="New Location:" label-size="sm">
            <location-picker :location.sync="newLocation" />
          </b-form-group>

          <b-form-group class="w-full" label="Move Date:" label-size="sm">
            <b-form-datepicker initial-date size="md" v-model="moveIsodate" :value="moveIsodate" />
          </b-form-group>

          <template v-if="!!newLocation && !!moveIsodate">
            <b-button class="w-full" variant="success" size="md" @click="activeStepIndex = 2">
              NEXT
            </b-button>
          </template>
        </div>
      </div>
    </template>

    <template v-if="activeStepIndex === 2">
      <div class="flex-grow" style="height: 35vh">
        <template v-if="allDetailsProvided">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-2 text-xl pt-6" style="width: 600px">
              <div>
                Moving
                <span class="font-bold ttt-purple">{{ selectedPackages.length }}</span>
                packages to
                <span class="font-bold ttt-purple">{{ newLocation.Name }}</span
                >.
              </div>

              <div>
                Move date:
                <span class="font-bold ttt-purple">{{ moveIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >MOVE {{ selectedPackages.length }} PACKAGES</b-button
              >
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center space-y-2 p-4 text-lg">
            <span class="text-xl font-bold">You're missing something:</span>

            <span v-if="selectedPackages.length === 0">No packages selected</span>
            <span v-if="!newLocation">Location not provided</span>
            <span v-if="!moveIsodate">Move date not provided</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '@/store/page-overlay/index';
import { mapState } from 'vuex';
import BuilderStepHeader from '@/components/overlay-widget/shared/BuilderStepHeader.vue';
import { isValidTag, generateTagRangeOrError } from '@/utils/tags';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { combineLatest, from, Subject } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, filter, startWith, tap
} from 'rxjs/operators';
import {
  IPackageData,
  IPackageFilter,
  ICsvFile,
  ILocationData,
  IMetrcMovePackagesPayload
} from '@/interfaces';
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from '@/utils/csv';
import { todayIsodate, submitDateFromIsodate } from '@/utils/date';
import { primaryMetrcRequestManager } from '@/modules/metrc-request-manager.module';
import { authManager } from '@/modules/auth-manager.module';
import { BuilderType, MessageType } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { builderManager } from '@/modules/builder-manager.module';
import PackagePicker from '@/components/overlay-widget/shared/PackagePicker.vue';
import LocationPicker from '@/components/overlay-widget/shared/LocationPicker.vue';

export default Vue.extend({
  name: 'MovePackagesBuilder',
  store,
  components: {
    BuilderStepHeader,
    LocationPicker,
    PackagePicker
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`
      });
    },
    submit() {
      const rows: IMetrcMovePackagesPayload[] = [];

      for (const pkg of this.$data.selectedPackages) {
        rows.push({
          ActualDate: submitDateFromIsodate(this.$data.moveIsodate),
          LocationId: this.$data.newLocation.Id.toString(),
          Id: pkg.Id.toString()
        });
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          pkgTotal: this.$data.selectedPackages.length
        },
        this.buildCsvFiles(),
        25
      );
    },
    async downloadAll() {
      for (const csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          tagCount: this.$data.selectedPackages.length,
          newLocationName: this.$data.newLocation.Name,
          moveIsodate: this.$data.moveIsodate
        }
      });
    },
    buildCsvFiles(): ICsvFile[] {
      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPackages.map((pkgData: IPackageData) => pkgData.Label)
          },
          { isVector: false, data: this.$data.newLocation.Name },
          { isVector: false, data: this.$data.moveIsodate }
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Move ${this.$data.selectedPackages.length} packages to ${this.$data.newLocation.Name}`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    }
  },
  computed: {
    allDetailsProvided() {
      return (
        this.$data.selectedPackages.length > 0
        && !!this.$data.newLocation
        && !!this.$data.moveIsodate
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    }
  },
  data() {
    return {
      builderType: BuilderType.MOVE_PACKAGES,
      activeStepIndex: 0,
      selectedPackages: [],
      newLocation: null,
      moveIsodate: todayIsodate(),
      steps: [
        {
          stepText: 'Select packages to move'
        },
        {
          stepText: 'Move details'
        },
        {
          stepText: 'Submit'
        }
      ]
    };
  },
  async mounted() {},
  async created() {},
  destroyed() {
    // Looks like modal is not actually destroyed
  }
});
</script>

<style type="text/scss" lang="scss" scoped></style>
