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
        <div class="grid grid-cols-2 grid-rows-2 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <plant-picker
            :enableVegetative="true"
            class="col-span-2"
            :builderType="builderType"
            :selectedPlants.sync="selectedPlants"
          />

          <div class="col-start-2 flex flex-col items-stretch">
            <template v-if="!pageOneErrorMessage">
              <b-button variant="success" size="md" @click="activeStepIndex = 1"> NEXT </b-button>
            </template>

            <template v-else>
              <span class="text-center text-red-700"> {{ pageOneErrorMessage }}</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="activeStepIndex === 1">
        <div class="grid grid-cols-2 grid-rows-2 gap-8 h-full" style="grid-template-rows: 1fr auto">
          <template v-if="!showTagPicker">
            <div class="w-full items-stretch flex flex-col p-4">
              <item-picker
                :item.sync="item"
                :itemFilters="itemFilters"
                :selectOwnedItems="true"
                label="New packages contain:"
              />

              <template v-if="item">
                <b-form-group label="Plant batch type:" label-size="sm">
                  <b-form-select
                    size="md"
                    :options="plantBatchTypeOptions"
                    v-model="plantBatchType"
                  >
                    <template #first>
                      <b-form-select-option :value="null" disabled>--</b-form-select-option>
                    </template>
                  </b-form-select>
                </b-form-group>

                <b-form-group label="Take Date:" label-size="sm">
                  <b-form-datepicker
                    initial-date
                    size="md"
                    v-model="actualIsodate"
                    :value="actualIsodate"
                  />
                </b-form-group>

                <template v-if="facilityUsesLocationForPackages">
                  <b-form-group class="w-full" label="Location:" label-size="sm">
                    <location-picker :location.sync="location" />
                  </b-form-group>
                </template>

                <template v-if="showHiddenDetailFields">
                  <b-form-group label="Note: (optional)" label-size="sm">
                    <b-form-input size="md" v-model="note"></b-form-input>
                  </b-form-group>

                  <!-- Defaulting to false, will fix in future -->
                  <!-- <b-form-checkbox
                    size="md"
                    class="text-lg"
                    v-model="isDonation"
                    value="True"
                    unchecked-value="False"
                  >
                    Donation
                  </b-form-checkbox>

                  <b-form-checkbox
                    size="md"
                    class="text-lg"
                    v-model="isTradeSample"
                    value="True"
                    unchecked-value="False"
                  >
                    Trade Sample
                  </b-form-checkbox> -->

                  <b-form-group
                    label="Patient License Number:"
                    description="Leave this alone unless you are sure you need to change it"
                    label-size="sm"
                  >
                    <b-form-input size="md" v-model="patientLicenseNumber"></b-form-input>
                  </b-form-group>
                </template>

                <template v-else>
                  <b-button
                    class="opacity-40"
                    variant="light"
                    @click="showHiddenDetailFields = true"
                    >ADVANCED</b-button
                  >
                </template>
              </template>
            </div>

            <template v-if="showChildCountEntry">
              <div class="flex flex-col items-stretch p-4 space-y-4">
                <mother-plant-picker
                  :selectedMothers="selectedPlants"
                  :plantBatchType="plantBatchType"
                  :childMatrix.sync="childMatrix"
                />

                <template v-if="!pageTwoPreTagErrorMessage">
                  <b-button variant="success" size="md" @click="showTagPicker = true">
                    NEXT
                  </b-button>
                </template>

                <template v-else>
                  <span class="text-center text-red-700"> {{ pageTwoPreTagErrorMessage }}</span>
                </template>
              </div>
            </template>
          </template>

          <template v-if="showTagPicker">
            <div class="flex flex-col space-y-8 items-center">
              <b-button variant="light" size="md" @click="showTagPicker = false"> BACK </b-button>

              <div class="text-lg font-bold">{{ newPackageCount }} tags required.</div>
            </div>

            <tag-picker
              :tagTypeNames="['CannabisPackage', 'MedicalPackage', 'Cannabis Package', 'Medical Package']"
              :tagCount="newPackageCount"
              :selectedTags.sync="packageTags"
            />

            <div class="col-start-2 flex flex-col items-stretch">
              <template v-if="!pageTwoErrorMessage">
                <b-button variant="success" size="md" @click="activeStepIndex = 2"> NEXT </b-button>
              </template>

              <template v-else>
                <span class="text-center text-red-700"> {{ pageTwoErrorMessage }}</span>
              </template>
            </div>
          </template>
        </div>
      </template>

      <template v-if="activeStepIndex === 2">
        <template v-if="!errorMessage">
          <div class="flex flex-col items-center">
            <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
              <div>
                Taking
                <span class="font-bold ttt-purple">{{ totalChildCount }}</span>
                {{ plantBatchType.Name.toLocaleLowerCase() + "s" }}
                from
                <span class="font-bold ttt-purple">{{ selectedPlants.length }}</span>
                plants.
              </div>

              <div>
                Creates
                <span class="font-bold ttt-purple"
                  >{{ newPackageCount }} {{ item.Name }} packages.</span
                >
              </div>

              <div>
                Uses
                <span class="font-bold ttt-purple">{{ packageTags.length }} package tags.</span>
              </div>

              <div>
                Take Date:
                <span class="font-bold ttt-purple">{{ actualIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >PACKAGE {{ totalChildCount }}
                {{ plantBatchType.Name.toLocaleUpperCase() + "S" }}</b-button
              >
            </div>

            <div style="height: 6rem"></div>

            <b-button class="opacity-40" variant="light" size="md" @click="downloadAll()"
              >DOWNLOAD CSVs</b-button
            >

            <csv-breakout class="opacity-40 mt-4" :csvFiles="csvFiles" />
          </div>
        </template>

        <template v-else>
          <span class="text-center text-red-700">{{ pageThreeErrorMessage || errorMessage }}</span>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from '@/components/overlay-widget/shared/BuilderStepHeader.vue';
import CsvBreakout from '@/components/overlay-widget/shared/CsvBreakout.vue';
import ItemPicker from '@/components/overlay-widget/shared/ItemPicker.vue';
import LocationPicker from '@/components/overlay-widget/shared/LocationPicker.vue';
import MotherPlantPicker from '@/components/overlay-widget/shared/MotherPlantPicker.vue';
import PlantPicker from '@/components/overlay-widget/shared/PlantPicker.vue';
import TagPicker from '@/components/overlay-widget/shared/TagPicker.vue';
import { BuilderType, MessageType, PLANTABLE_ITEM_CATEGORY_NAMES } from '@/consts';
import {
  IBuilderComponentError,
  ICsvFile,
  IIntermediateCreatePackageFromMotherPlantData,
  IMetrcCreatePlantBatchPackagesFromMotherPlantPayload,
  IPlantBatchType,
  ITagData,
} from '@/interfaces';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { builderManager } from '@/modules/builder-manager.module';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { dynamicConstsManager } from '@/modules/dynamic-consts-manager.module';
import store from '@/store/page-overlay/index';
import { arrayIsValid, safeZip } from '@/utils/array';
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from '@/utils/csv';
import { submitDateFromIsodate, todayIsodate } from '@/utils/date';
import { sum } from 'lodash-es';
import { timer } from 'rxjs';
import Vue from 'vue';

export default Vue.extend({
  name: 'MotherPlantPackageBuilder',
  store,
  components: {
    BuilderStepHeader,
    PlantPicker,
    MotherPlantPicker,
    ItemPicker,
    TagPicker,
    LocationPicker,
    CsvBreakout,
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    submit() {
      const rows: IMetrcCreatePlantBatchPackagesFromMotherPlantPayload[] = [];

      const flattenedPlants = this.$data.childPackageData
        .map((x: IIntermediateCreatePackageFromMotherPlantData) => x.counts.map(() => x.plant))
        .flat();
      const flattenedPlantCounts = this.$data.childPackageData
        .map((x: IIntermediateCreatePackageFromMotherPlantData) => x.counts)
        .flat();

      // @ts-ignore
      const zipped: [ITagData[], IPlantData[], number[]] = safeZip(
        this.$data.packageTags,
        flattenedPlants,
        flattenedPlantCounts,
      );

      for (const el of zipped) {
        const tag = el[0];
        const motherPlant = el[1];
        const childCount = el[2];

        const row: IMetrcCreatePlantBatchPackagesFromMotherPlantPayload = {
          ItemId: this.$data.item.Id.toString(),
          Note: this.$data.note,
          PackageDate: submitDateFromIsodate(this.$data.actualIsodate),
          // PlantBatchType: this.$data.plantBatchType,
          PlantBatchTypeId: this.$data.plantBatchType.Id.toString(),
          PlantId: motherPlant.Id.toString(),
          PlantsCount: childCount.toString(),
          TagId: tag.Id.toString(),
          ...(this.$data.facilityUsesLocationForPackages
            ? {
              LocationId: this.$data.location.Id.toString(),
            }
            : {}),
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          motherPlantCount: this.$data.selectedPlants.length,
          packageCount: this.$data.packageTags.length,
          childCount: this.totalChildCountImpl(),
          itemName: this.$data.item.Name,
          actualIsodate: this.$data.actualIsodate,
        },
        this.buildCsvFiles(),
        5,
      );
    },
    async downloadAll() {
      for (const csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          motherPlantCount: this.$data.selectedPlants.length,
          packageCount: this.$data.packageTags.length,
          childCount: this.totalChildCountImpl(),
          itemName: this.$data.item.Name,
          actualIsodate: this.$data.actualIsodate,
        },
      });
    },
    buildCsvFiles(): ICsvFile[] {
      // Package Planting From Plant
      //
      // Plant Label
      // Package Tag
      // Plant Batch Type
      // Item Name
      // Location Name
      // Note
      // Patient License Number
      // Trade Sample
      // Donation
      // Plant Count
      // Actual Date
      //
      // ABCDEF012345670000000012,ABCDEF012345670000010013,Seed,Blue Dream Seeds,Package Room 1,,,False,False,25,2020-01-15

      const flattenedPlantLabels = this.$data.childPackageData
        .map((x: IIntermediateCreatePackageFromMotherPlantData) =>
          x.counts.map(() => x.plant.Label))
        .flat();
      const flattenedPlantCounts = this.$data.childPackageData
        .map((x: IIntermediateCreatePackageFromMotherPlantData) => x.counts)
        .flat();

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: flattenedPlantLabels,
          },
          {
            isVector: true,
            data: this.$data.packageTags.map((x: ITagData) => x.Label),
          },
          {
            isVector: false,
            data: this.$data.plantBatchType.Name,
          },
          {
            isVector: false,
            data: this.$data.item.Name,
          },
          {
            isVector: false,
            data: this.$data.facilityUsesLocationForPackages ? this.$data.location.Name : '',
          },
          {
            isVector: false,
            data: this.$data.note,
          },
          {
            isVector: false,
            data: this.$data.patientLicenseNumber,
          },
          {
            isVector: false,
            data: this.$data.isTradeSample,
          },
          {
            isVector: false,
            data: this.$data.isDonation,
          },
          {
            isVector: true,
            data: flattenedPlantCounts,
          },
          {
            isVector: false,
            data: this.$data.actualIsodate,
          },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Taking ${this.totalChildCountImpl()} ${`${this.$data.plantBatchType.Name.toLocaleLowerCase()}s`} from ${
            this.$data.selectedPlants.length
          } mothers`,
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    allPlantsHaveValidChildCountImpl() {
      const result = arrayIsValid(this.$data.childMatrix, {
        collectionValidators: [
          {
            fn: (rows: any[]): boolean => rows.length === this.$data.selectedPlants.length,
            message: 'Collection must be same size as plants',
          },
        ],
      });

      if (!result.valid) {
        return false;
      }

      for (const row of this.$data.childMatrix) {
        const result = arrayIsValid(row, {
          rowValidators: [
            {
              fn: (x: any): boolean => Number.isInteger(x) && x > 0,
              message: 'All values must be an integer greater than 0',
            },
          ],
          collectionValidators: [
            {
              fn: (arr: any[]): boolean => {
                try {
                  return sum(arr) > 0;
                } catch (e) {
                  return false;
                }
              },
              message: 'Collection must sum to a positive number',
            },
          ],
        });

        if (!result.valid) {
          return false;
        }
      }

      return true;
    },
    newPackageCountImpl(): number {
      return sum(
        this.$data.childPackageData.map(
          (x: IIntermediateCreatePackageFromMotherPlantData) => x.counts.length,
        ),
      );
    },
    totalChildCountImpl(): number {
      return sum(
        this.$data.childPackageData.map((x: IIntermediateCreatePackageFromMotherPlantData) =>
          sum(x.counts)),
      );
    },
  },
  computed: {
    totalChildCount() {
      // @ts-ignore
      return this.totalChildCountImpl();
    },
    newPackageCount(): number {
      // @ts-ignore
      return this.newPackageCountImpl();
    },
    showChildCountEntry(): boolean {
      return (
        !!this.$data.actualIsodate && !!this.$data.item
      );
    },
    allPlantsHaveValidChildCount(): boolean {
      return this.allPlantsHaveValidChildCountImpl();
    },
    pageOneErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('page1'))?.message || null
      );
    },
    pageTwoPreTagErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find(
          (x: IBuilderComponentError) => x.tags.includes('page2') && !x.tags.includes('tagging'),
        )?.message || null
      );
    },
    pageTwoErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('page2'))?.message || null
      );
    },
    pageThreeErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('page3'))?.message || null
      );
    },
    errorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => true)?.message || null
      );
    },
    errors(): IBuilderComponentError[] {
      const errors: IBuilderComponentError[] = [];

      if ((this as any).selectedPlants.length === 0) {
        errors.push({
          tags: ['page1'],
          message: 'Select one or more mother plants',
        });
      }

      if ((this as any).$data.childPackageData.length === 0) {
        errors.push({
          tags: ['page1'],
          message: 'Create at least one child package',
        });
      }

      if (!(this as any).item) {
        errors.push({
          tags: ['page2'],
          message: 'Select the new package item',
        });
      }

      if (!(this as any).location && this.$data.facilityUsesLocationForPackages) {
        errors.push({
          tags: ['page2'],
          message: 'Select the new package location',
        });
      }

      // const emptyChildLists: number = (this as any).childMatrix.filter(
      //   (x: number[]) => x.length === 0
      // ).length;
      // if (emptyChildLists > 0 && emptyChildLists < this.childMatrix.length) {
      //   errors.push({
      //     tags: ["page2"],
      //     message:
      //       "A mother plant cannot have 0 taken. Select fewer mother plants or adjust the take.",
      //   });
      // }

      const emptyChildLists: number = (this as any).childMatrix.filter(
        (x: number[]) => x.length === 0,
      ).length;

      if (emptyChildLists === this.childMatrix.length) {
        errors.push({
          tags: ['page2'],
          message: 'Enter a take count',
        });
      }

      if (emptyChildLists > 0 && emptyChildLists < this.childMatrix.length) {
        if (!(this as any).allPlantsHaveValidChildCountImpl()) {
          errors.push({
            tags: ['page2'],
            message:
              'Each mother plant must have a take count of at least 1. Try selecting fewer mother plants.',
          });
        }
      }

      if ((this as any).$data.packageTags.length === 0) {
        errors.push({
          tags: ['page2', 'tagging'],
          message: 'Select package tags for your new packages',
        });
      }

      if (
        (this as any).$data.packageTags.length
        !== (this as any).$data.childPackageData
          .map((x: IIntermediateCreatePackageFromMotherPlantData) => x.counts)
          .flat().length
      ) {
        errors.push({
          tags: ['page2', 'tagging'],
          message: 'You must select one package tag for each new package',
        });
      }

      if (!(this as any).plantBatchType) {
        errors.push({ tags: ['page2'], message: 'Specify a plant batch type' });
      }

      if (!(this as any).item) {
        errors.push({
          tags: ['page2'],
          message: 'Specify an item for new child packages',
        });
      }

      if (!(this as any).actualIsodate) {
        errors.push({ tags: ['page2'], message: 'Specify a package date' });
      }

      return errors;
    },
    tagsSelected() {
      return (
        this.$data.packageTags.length > 0
        // @ts-ignore
        && this.$data.packageTags.length === this.newPackageCountImpl()
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
  },
  watch: {
    selectedPlants: {
      immediate: true,
      handler(newValue, oldValue) {
        const matrix = newValue.map(() => [null]);
        // Initialize childMatrix with empty arrays
        this.$data.childMatrix = matrix;
      },
    },
    childMatrix: {
      immediate: true,
      handler(newValue: number[][], oldValue) {
        this.$data.childPackageData = [];

        if (this.$data.selectedPlants.length !== newValue.length) {
          console.error('length mismatch');
          return;
        }

        const zipped = safeZip(this.$data.selectedPlants, newValue);

        for (const [plant, counts] of zipped) {
          // @ts-ignore
          this.$data.childPackageData.push({
            plant,
            counts,
            plantBatchType: this.$data.plantBatchType,
          });
        }
      },
    },
  },
  data() {
    return {
      builderType: BuilderType.CREATE_IMMATURE_PLANT_PACKAGES_FROM_MOTHER_PLANT,
      activeStepIndex: 0,
      selectedPlants: [],
      actualIsodate: todayIsodate(),
      childMatrix: [],
      // This must be flattened
      childPackageData: [],
      packageTags: [],
      item: null,
      location: null,
      facilityUsesLocationForPackages: false,
      showHiddenDetailFields: false,
      patientLicenseNumber: '',
      note: '',
      isTradeSample: 'False',
      isDonation: 'False',
      showTagPicker: false,
      steps: [
        {
          stepText: 'Select mother plants',
        },
        {
          stepText: 'Package details',
        },
        {
          stepText: 'Submit',
        },
      ],
      plantBatchType: null,
      plantBatchTypeOptions: [],
      itemFilters: {
        // 'Seeds' is weight based, which we can't handle here
        itemCategory: PLANTABLE_ITEM_CATEGORY_NAMES.filter((x) => x !== 'Seeds'),
      },
    };
  },
  async created() {
    // Eagerly load the tags
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));

    this.$data.facilityUsesLocationForPackages = await dynamicConstsManager.facilityUsesLocationForPackages();

    this.$data.plantBatchTypeOptions = (await dynamicConstsManager.plantBatchTypes()).map(
      (x: IPlantBatchType) => ({ text: `${x.Name}s`, value: x }),
    );
    this.$data.plantBatchType = this.$data.plantBatchTypeOptions[0].value;
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
