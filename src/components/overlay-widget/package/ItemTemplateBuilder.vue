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
      <template v-if="categories.length > 0 && unitsOfMeasure.length > 0">
        <div class="flex flex-col" style="width: 600px">
          <b-form-group
            label="Enter Batch Number"
            label-size="sm"
            label-class="text-gray-400"
            class="w-full"
          >
            <b-form-input
              type="text"
              required
              placeholder="Batch number"
              class="w-full text-left"
              size="md"
              v-model="batchNumber"
            />
          </b-form-group>

          <template v-if="batchNumber">
            <b-form-group
              label="Select Strain"
              label-size="sm"
              label-class="text-gray-400"
              class="w-full"
            >
              <strain-picker :strain.sync="strain" :enableHotStrainCreate="true" />
            </b-form-group>
          </template>

          <template v-if="strain && batchNumber">
            <div class="w-full flex flex-row">
              <b-button class="w-100" variant="success" size="md" @click="activeStepIndex = 1">
                NEXT
              </b-button>
            </div>
          </template>
        </div>
      </template>

      <template v-else>
        <b-spinner variant="primary" label="Spinning"></b-spinner>
      </template>
    </template>

    <template v-if="activeStepIndex === 1">
      <template v-if="!missingItemCategoriesErrorMessage"></template>
      <template v-else>
        <span class="text-center text-red-700">{{ missingItemCategoriesErrorMessage }}</span>
      </template>

      <template v-if="!duplicateItemsErrorMessage"></template>
      <template v-else>
        <span class="text-center text-red-700">{{ duplicateItemsErrorMessage }}</span>
      </template>

      <template v-if="!noItemsCreatedErrorMessage">
        <template v-if="!allItemsRemovedErrorMessage">
          <item-data-list :items.sync="items" />

          <div class="flex flex-col items-center">
            <div class="flex flex-col items-center space-y-4" style="width: 600px">
              <b-alert v-model="catalogError" :variant="catalogVariant" style="color: #d93442">
                <strong>{{ catalogErrorMessage }}</strong>
              </b-alert>

              <b-button class="w-100" variant="success" size="md" @click="activeStepIndex = 2">
                NEXT
              </b-button>
            </div>
          </div>
        </template>
        <template v-else>
          <span class="text-center text-red-700">{{ allItemsRemovedErrorMessage }}</span>
        </template>
      </template>

      <template v-else>
        <span class="text-center text-red-700">{{ noItemsCreatedErrorMessage }}</span>
      </template>
    </template>

    <template v-if="activeStepIndex === 2">
      <template v-if="!pageThreeErrorMessage">
        <div class="flex flex-col items-center">
          <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
            <div>
              Creating
              <span class="font-bold ttt-purple">{{ items.length }}</span>
              new items.
            </div>

            <div v-if="batchNumber">
              Batch Number:
              <span class="font-bold ttt-purple">{{ batchNumber }}.</span>
            </div>

            <div v-if="strain">
              Strain:
              <span class="font-bold ttt-purple">{{ strain.Name }}.</span>
            </div>

            <div style="height: 3rem"></div>

            <div class="flex flex-col items-center">
              <transition name="fade">
                <b-button
                  class="w-full"
                  style="max-width: 600px"
                  variant="success"
                  size="md"
                  @click="submit()"
                  >CREATE ITEMS</b-button
                >
              </transition>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <span class="text-center text-red-700">{{ pageThreeErrorMessage }}</span>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '@/store/page-overlay/index';
import { mapActions, mapState } from 'vuex';
import BuilderStepHeader from '@/components/overlay-widget/shared/BuilderStepHeader.vue';
import {
  IMetrcCreateItemsPayload,
  IItemTemplate,
  ICsvFile,
  IBuilderComponentError,
  IUnitOfMeasure,
  IItemCategory,
  IItemData,
} from '@/interfaces';
import { buildCsvDataOrError, buildNamedCsvFileData } from '@/utils/csv';
import { BuilderType, MessageType } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { builderManager } from '@/modules/builder-manager.module';
import ItemDataList from '@/components/overlay-widget/shared/ItemDataList.vue';
import StrainPicker from '@/components/overlay-widget/shared/StrainPicker.vue';
import { dynamicConstsManager } from '@/modules/dynamic-consts-manager.module';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { unitOfMeasureNameToAbbreviation } from '@/utils/units';
import { abbreviateString } from '@/utils/abbreviate';
import { round } from '@/utils/math';
import _ from 'lodash-es';

export default Vue.extend({
  name: 'ItemTemplateBuilder',
  store,
  components: {
    BuilderStepHeader,
    ItemDataList,
    StrainPicker,
  },
  methods: {
    ...mapActions({}),
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;
      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    populateDuplicateItems() {
      this.$data.duplicateItems = [];
      this.$data.duplicateItems = this.$data.items.filter((item: IItemData) =>
        this.$data.preExistingItems.some(
          (preExistingItem: IItemData) => preExistingItem.Name === item.Name,
        ));
    },
    removeDuplicateItems() {
      this.populateDuplicateItems();

      if (this.duplicateItemsExist) {
        this.$data.items = this.$data.items.filter(
          (item: IItemData) =>
            !this.$data.duplicateItems.some(
              (duplicateItem: IItemData) => duplicateItem.Name === item.Name,
            ),
        );
      }
    },
    populateItems() {
      const otherConcentrateWeightCategoryItemNames: string[] = [
        'hash grade A',
        'hash grade B',
        'hash grade C',
        'hash grade D',
        'hash grade E',
        'bulk rosin grade A - press 1',
        'bulk rosin grade A - press 2',
        'bulk rosin grade B - press 1',
        'bulk rosin grade B - press 2',
        'bulk rosin grade C - press 1',
        'bulk rosin grade C - press 2',
        'bulk rosin grade D - press 1',
        'bulk rosin grade D - press 2',
        'bulk rosin grade E - press 1',
        'bulk rosin grade E - press 2',
        'pressed bags',
        'bulk rosin infusion - crude',
        'bulk rosin infusion - decarbed',
        'washed flower',
        'bulk rosin 90-149um',
      ];

      this.$data.items = [];

      if (this.$data.freshCannabisPlantCategory && this.unitOfMeasureGrams) {
        this.$data.items.push({
          Name: `${this.$data.batchNumber} (${this.formattedStrainName}) ${'fresh frozen'}`,
          StrainId: this.$data.strain.Id,
          Category: this.$data.freshCannabisPlantCategory,
          UnitOfMeasureId: this.unitOfMeasureGrams.Id,
          UnitOfMeasureName: this.unitOfMeasureGrams.Name,
        });
      }

      if (this.$data.otherConcentrateWeightCategory && this.unitOfMeasureGrams) {
        otherConcentrateWeightCategoryItemNames.map((itemGradeType: string) =>
          this.$data.items.push({
            Name: `${this.$data.batchNumber} (${this.formattedStrainName}) ${itemGradeType}`,
            Category: this.$data.otherConcentrateWeightCategory,
            UnitOfMeasureId: this.unitOfMeasureGrams.Id,
            UnitOfMeasureName: this.unitOfMeasureGrams.Name,
          }));
      }

      if (this.$data.wasteCategory && this.unitOfMeasureGrams) {
        this.$data.items.push({
          Name: `${this.$data.batchNumber} (${this.formattedStrainName}) ${'Waste'}`,
          Category: this.$data.wasteCategory,
          UnitOfMeasureId: this.unitOfMeasureGrams.Id,
          UnitOfMeasureName: this.unitOfMeasureGrams.Name,
        });
      }

      if (
        this.$data.otherConcentrateWeightEachCategory
        && this.unitOfMeasureEach
        && this.unitOfMeasureGrams
      ) {
        this.$data.items.push({
          Name: `Cold Cured Live Rosin - ${this.formattedStrainName}`,
          Category: this.$data.otherConcentrateWeightEachCategory,
          UnitOfMeasureId: this.unitOfMeasureEach.Id,
          UnitOfMeasureName: this.unitOfMeasureEach.Name,
          UnitWeight: 1,
          UnitWeightUnitOfMeasureId: this.unitOfMeasureGrams.Id,
          UnitWeightUnitOfMeasureName: this.unitOfMeasureGrams.Name,
        });
      }

      if (
        this.$data.vapeCartridgeWeightEachCategory
        && this.unitOfMeasureEach
        && this.unitOfMeasureGrams
      ) {
        this.$data.items.push({
          Name: `Live Rosin Vape Cart - ${this.formattedStrainName}`,
          Category: this.$data.vapeCartridgeWeightEachCategory,
          UnitOfMeasureId: this.unitOfMeasureEach.Id,
          UnitOfMeasureName: this.unitOfMeasureEach.Name,
          UnitWeight: 0.5,
          UnitWeightUnitOfMeasureId: this.unitOfMeasureGrams.Id,
          UnitWeightUnitOfMeasureName: this.unitOfMeasureGrams.Name,
        });
      }

      this.removeDuplicateItems();
    },
    unitOfMeasureNameToAbbreviation,
    abbreviateString,
    round,
    async submit() {
      const rows: IMetrcCreateItemsPayload[] = this.$data.items.map((item: IItemTemplate) => ({
        AdministrationMethod: '',
        Description: '',
        ItemBrandId: '',
        Name: item.Name,
        NumberOfDoses: '',
        ProductCategoryId: item.Category.Id ? item.Category.Id.toString() : '',
        PublicIngredients: '',
        ServingSize: '',
        StrainId: item.StrainId ? item.StrainId.toString() : '',
        SupplyDurationDays: '',
        UnitCbdContent: '',
        UnitCbdContentDose: '',
        UnitCbdContentDoseUoMId: '',
        UnitCbdContentUoMId: '',
        UnitCbdPercent: '',
        UnitOfMeasureId: item.UnitOfMeasureId ? item.UnitOfMeasureId.toString() : '',
        UnitThcContent: '',
        UnitThcContentDose: '',
        UnitThcContentDoseUoMId: '',
        UnitThcContentUoMId: '',
        UnitThcPercent: '',
        UnitVolume: '',
        UnitVolumeUoMId: '',
        UnitWeight: item.UnitWeight ? item.UnitWeight.toString() : '',
        UnitWeightUoMId: item.UnitWeightUnitOfMeasureId
          ? item.UnitWeightUnitOfMeasureId.toString()
          : '',
      }));

      builderManager.submitProject(
        _.cloneDeep(rows),
        this.$data.builderType,
        {
          itemTotal: this.$data.items.length,
        },
        // @ts-ignore
        this.buildCsvFiles(),
        5,
      );
    },
    buildCsvFiles(): ICsvFile[] {
      // NOTE: this CSV format is made up, purely for record keeping.
      // These cannot be submitted to metrc.

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) => item.Category.Id),
          },
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) => item.Category.Name),
          },
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) =>
              (item.StrainId ? item.StrainId.toString() : '')),
          },
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) => item.UnitOfMeasureId),
          },
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) => item.UnitOfMeasureName),
          },
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) =>
              (item.UnitWeight ? item.UnitWeight.toString() : '')),
          },
          {
            isVector: true,
            data: this.$data.items.map((item: IItemTemplate) =>
              (item.UnitWeightUnitOfMeasureId ? item.UnitWeightUnitOfMeasureId.toString() : '')),
          },
          { isVector: false, data: this.$data.strain.Name },
          { isVector: false, data: this.formattedStrainName },
        ]);

        return buildNamedCsvFileData(csvData, `Created ${this.$data.items.length} items`);
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    calculateErrors(): IBuilderComponentError[] {
      const errors: IBuilderComponentError[] = [];
      const itemDetailsMsg: string = 'Please enter item details in previous step to continue';

      if (!this.$data.strain && !this.$data.batchNumber) {
        errors.push({
          tags: ['noItemsCreatedError'],
          message: itemDetailsMsg,
        });
      }

      if (this.removedItemsCount === this.expectedItemCount) {
        errors.push({
          tags: ['allItemsRemovedError'],
          message: itemDetailsMsg,
        });
      }

      if (this.duplicateItemsExist) {
        errors.push({
          tags: ['duplicateItemsError'],
          message: 'Pre-existing items could not be created',
        });
      }

      if (
        !this.$data.freshCannabisPlantCategory
        || !this.$data.otherConcentrateWeightCategory
        || !this.$data.wasteCategory
        || !this.$data.otherConcentrateWeightEachCategory
        || !this.$data.vapeCartridgeWeightEachCategory
      ) {
        errors.push({
          tags: ['missingItemCategoriesError'],
          message: 'This license is missing item categories',
        });
      }

      if (!this.$data.items || this.$data.items.length === 0) {
        errors.push({
          tags: ['page3'],
          message: 'No items to submit',
        });
      }

      if (this.catalogError) {
        errors.push({
          tags: ['catalogError'],
          message: `${this.removedItemsCount} item(s) excluded`,
        });
      }

      return errors;
    },
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
    }),
    unitOfMeasureGrams(): IUnitOfMeasure {
      return this.$data.unitsOfMeasure.find((x: IUnitOfMeasure) => x.Name === 'Grams') || null;
    },
    unitOfMeasureEach(): IUnitOfMeasure {
      return this.$data.unitsOfMeasure.find((x: IUnitOfMeasure) => x.Name === 'Each') || null;
    },
    formattedStrainName(): string {
      // Per request from Yoni
      // return abbreviateString(this.$data.strain.Name, 0, 3).toUpperCase();
      return this.$data.strain.Name;
    },
    removedItemsCount(): number {
      return this.$data.expectedItemCount - this.$data.items.length;
    },
    duplicateItemsExist(): boolean {
      return this.$data.duplicateItems.length > 0;
    },
    catalogVariant(): string {
      return this.catalogError ? 'danger' : 'success';
    },
    catalogError(): boolean {
      return this.$data.items.length !== this.$data.expectedItemCount;
    },
    noItemsCreatedErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('noItemsCreatedError'))
          ?.message || null
      );
    },
    allItemsRemovedErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('allItemsRemovedError'))
          ?.message || null
      );
    },
    pageThreeErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('page3'))?.message || null
      );
    },
    missingItemCategoriesErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) =>
          x.tags.includes('missingItemCategoriesError'))?.message || null
      );
    },
    duplicateItemsErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('duplicateItemsError'))
          ?.message || null
      );
    },
    catalogErrorMessage(): string | null {
      return (
        // @ts-ignore
        this.errors.find((x: IBuilderComponentError) => x.tags.includes('catalogError'))?.message
        || null
      );
    },
    errors(): IBuilderComponentError[] {
      // @ts-ignore
      return this.calculateErrors();
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
  },
  watch: {
    strain: {
      immediate: true,
      handler(newValue) {
        // @ts-ignore
        this.$emit('update:strain', newValue);

        if (this.$data.strain && this.$data.batchNumber) {
          this.populateItems();
        }
      },
    },
    batchNumber: {
      immediate: true,
      handler(newValue) {
        // @ts-ignore
        this.$emit('update:batchNumber', newValue);

        if (this.$data.strain && this.$data.batchNumber) {
          this.populateItems();
        }
      },
    },
  },
  data() {
    return {
      builderType: BuilderType.CREATE_ITEMS,
      activeStepIndex: 0,
      steps: [
        {
          stepText: 'Enter item details',
        },
        {
          stepText: 'Item details',
        },
        {
          stepText: 'Submit',
        },
      ],
      strain: null,
      items: [],
      batchNumber: '',
      expectedItemCount: 24,
      unitsOfMeasure: [],
      unitsOfWeight: [],
      categories: [],
      otherConcentrateWeightCategory: null,
      otherConcentrateWeightEachCategory: null,
      vapeCartridgeWeightEachCategory: null,
      wasteCategory: null,
      freshCannabisPlantCategory: null,
      preExistingItems: [],
      duplicateItems: [],
    };
  },
  async mounted() {
    this.$data.preExistingItems = await primaryDataLoader.items();
    this.$data.categories = await dynamicConstsManager.itemCategories();
    this.$data.unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

    this.$data.freshCannabisPlantCategory = this.$data.categories.find((x: IItemCategory) => x.Name === 'Fresh Cannabis Plant') || null;
    this.$data.otherConcentrateWeightCategory = this.$data.categories.find((x: IItemCategory) => x.Name === 'Other Concentrate (weight)')
      || null;
    this.$data.wasteCategory = this.$data.categories.find((x: IItemCategory) => x.Name === 'Waste') || null;
    this.$data.otherConcentrateWeightEachCategory = this.$data.categories.find(
      (x: IItemCategory) => x.Name === 'Other Concentrate (weight - each)',
    ) || null;
    this.$data.vapeCartridgeWeightEachCategory = this.$data.categories.find(
      (x: IItemCategory) => x.Name === 'Vape Cartridge (weight - each)',
    ) || null;
  },
  async created() {},
  destroyed() {},
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
