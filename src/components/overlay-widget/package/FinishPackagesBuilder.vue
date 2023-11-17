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
      <div class="w-full flex flex-col items-stretch">
        <package-picker
          :builderType="builderType"
          :selectedPackages.sync="selectedPackages"
          :packageFilters="{ isEmpty: true }"
          :eagerLoad="true"
          itemFilterZeroResultsErrorSuggestionMessage="Only empty active packages can be used here."
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
        <div class="flex flex-col items-center space-y-4" style="width: 600px">
          <b-form-group class="w-full" label="Finish Date:" label-size="sm">
            <b-form-datepicker
              initial-date
              size="md"
              v-model="finishIsodate"
              :value="finishIsodate"
            />
          </b-form-group>

          <template v-if="allDetailsProvided">
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
            <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
              <div>
                Finishing
                <span class="font-bold ttt-purple">{{ selectedPackages.length }}</span>
                empty packages.
              </div>

              <div>
                Finish date:
                <span class="font-bold ttt-purple">{{ finishIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >FINISH {{ selectedPackages.length }} PACKAGES</b-button
              >
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center space-y-2 p-4 text-lg">
            <span class="text-xl font-bold">You're missing something:</span>

            <span v-if="selectedPackages.length === 0">No packages selected</span>
            <span v-if="!finishIsodate">Finish date not provided</span>
            >
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
import { isValidTag, generateTagRangeOrError, getTagFromOffset } from '@/utils/tags';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import {
  combineLatest, from, Subject, timer,
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, filter, startWith, tap,
} from 'rxjs/operators';
import {
  IPackageData,
  IPlantFilter,
  ICsvFile,
  ILocationData,
  IMetrcFinishPackagesPayload,
} from '@/interfaces';
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from '@/utils/csv';
import { todayIsodate, submitDateFromIsodate } from '@/utils/date';
import { primaryMetrcRequestManager } from '@/modules/metrc-request-manager.module';
import { authManager } from '@/modules/auth-manager.module';
import {
  BuilderType,
  MessageType,
  PLANTABLE_ITEM_CATEGORY_NAMES,
  PLANT_BATCH_TYPES,
} from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { builderManager } from '@/modules/builder-manager.module';
import PackagePicker from '@/components/overlay-widget/shared/PackagePicker.vue';
import LocationPicker from '@/components/overlay-widget/shared/LocationPicker.vue';
import StrainPicker from '@/components/overlay-widget/shared/StrainPicker.vue';
import TagPicker from '@/components/overlay-widget/shared/TagPicker.vue';
import ItemPicker from '@/components/overlay-widget/shared/ItemPicker.vue';
import PickerCard from '@/components/overlay-widget/shared/PickerCard.vue';
import { allocatePackageQuantities } from '@/utils/misc';
import { dynamicConstsManager } from '@/modules/dynamic-consts-manager.module';
import { safeZip } from '@/utils/array';

export default Vue.extend({
  name: 'FinishPackagesBuilder',
  store,
  components: {
    BuilderStepHeader,
    PackagePicker,
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    async submit() {
      const rows: IMetrcFinishPackagesPayload[] = [];

      for (const pkg of this.$data.selectedPackages) {
        const row = {
          ActualDate: submitDateFromIsodate(this.$data.finishIsodate),
          Id: pkg.Id.toString(),
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          packageTotal: this.$data.selectedPackages.length,
        },
        this.buildCsvFiles(),
        25,
      );
    },
    buildCsvFiles(): ICsvFile[] {
      // NOTE: this CSV format is made up, purely for record keeping.
      // These cannot be submitted to metrc.
      //
      // Package Label
      // Date

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.selectedPackages.map((x: IPackageData) => x.Label),
          },
          {
            isVector: false,
            data: this.$data.finishIsodate,
          },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Finish ${this.$data.selectedPackages.length} packages`,
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
  },
  computed: {
    allDetailsProvided() {
      return this.$data.selectedPackages.length > 0 && !!this.$data.finishIsodate;
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
  },
  data() {
    return {
      builderType: BuilderType.FINISH_PACKAGES,
      activeStepIndex: 0,
      selectedPackages: [],
      finishIsodate: todayIsodate(),
      showHiddenDetailFields: false,
      steps: [
        {
          stepText: 'Select empty packages to finish',
        },
        {
          stepText: 'Finish details',
        },
        {
          stepText: 'Submit',
        },
      ],
    };
  },
  async created() {},
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
