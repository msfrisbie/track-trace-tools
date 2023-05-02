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
          <single-package-picker
            class="col-span-2 h-full"
            :selectedPackages="sourcePackage ? [sourcePackage] : []"
            v-on:removePackage="setPackage({ pkg: null })"
            v-on:addPackage="setPackage({ pkg: $event })"
            :reopenPickerAfterSelect="false"
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
          <div class="flex flex-col items-stretch space-y-8">
            <div class="grid grid-cols-2 gap-8" style="grid-template-columns: auto 1fr">
              <div class="flex flex-col items-center border-r-2 border-blue-500 px-4">
                <span class="text-lg font-bold">NEW PACKAGES</span>
              </div>

              <div class="flex flex-col items-stretch space-y-6">
                <div>
                  <item-picker
                    class="w-full"
                    :item="outputItem"
                    :selectOwnedItems="true"
                    v-on:update:item="updateSplitPackageData({ outputItem: $event })"
                  />

                  <template v-if="!outputItem">
                    <b-button variant="link" size="sm" @click="outputItem = sourcePackage.Item"
                      >USE SAME ITEM</b-button
                    >
                  </template>
                </div>

                <template v-if="outputItem">
                  <div class="w-full grid grid-cols-12">
                    <b-input-group :append="outputUnitAbbreviation" class="col-span-5">
                      <b-form-input
                        v-model.number="perPackageQuantity"
                        type="number"
                        step="0.0000001"
                        min="0"
                        :max="sourcePackage.Quantity"
                        :state="!perPackageQuantityErrorMessage"
                        required
                        class="text-center"
                      ></b-form-input>
                    </b-input-group>

                    <span class="col-span-2 text-center text-xl">&#10005;</span>

                    <b-form-input
                      v-model.number="newPackageCount"
                      type="number"
                      step="1"
                      min="1"
                      required
                      :state="!newPackageCountErrorMessage"
                      class="text-center col-span-5"
                    ></b-form-input>
                  </div>
                </template>

                <template
                  v-if="
                    facilityUsesLocationForPackages &&
                    outputItem &&
                    perPackageQuantity &&
                    newPackageCount
                  "
                >
                  <location-picker
                    class="flex-grow"
                    :location="location"
                    :suggestedLocationName="sourcePackage && sourcePackage.LocationName"
                    v-on:update:location="updateSplitPackageData({ location: $event })"
                  />
                </template>
              </div>

              <template
                v-if="
                  outputItem &&
                  perPackageQuantity &&
                  newPackageCount &&
                  (!facilityUsesLocationForPackages || location)
                "
              >
                <div class="flex flex-col items-center border-r-2 border-blue-500 px-4">
                  <span class="text-lg font-bold">SOURCE PACKAGE</span>
                </div>

                <div class="flex flex-col items-stretch space-y-6">
                  <div class="flex flex-row text-lg items-center space-x-4 whitespace-nowrap">
                    <b-input-group prepend="Subtract" :append="sourceUnitAbbreviation">
                      <b-form-input
                        v-model.number="sourcePackageAdjustQuantity"
                        type="number"
                        step="0.0000001"
                        min="0"
                        :max="sourcePackage.Quantity"
                        required
                        :state="!sourcePackageAdjustQuantityErrorMessage"
                        class="text-center flex-grow"
                      ></b-form-input>
                    </b-input-group>
                    <b-button
                      variant="link"
                      size="sm"
                      class="self-start"
                      @click="sourcePackageAdjustQuantity = sourcePackage.Quantity"
                      >USE ALL</b-button
                    >
                  </div>

                  <span class="text-lg">
                    <span class="font-bold ttt-purple"
                      >{{ round(sourcePackage.Quantity - sourcePackageAdjustQuantity, 4) }}
                      {{ sourceUnitAbbreviation }}</span
                    >
                    remaining</span
                  >
                </div>
              </template>

              <template
                v-if="
                  outputItem &&
                  newPackageCount &&
                  perPackageQuantity &&
                  sourcePackageAdjustQuantity &&
                  (!facilityUsesLocationForPackages || location)
                "
              >
                <template v-if="showHiddenDetailFields">
                  <div class="col-span-2">
                    <b-form-group label="Package Date:" label-size="sm">
                      <b-form-datepicker
                        initial-date
                        size="md"
                        v-model="packageIsodate"
                        :value="packageIsodate"
                      />
                    </b-form-group>

                    <b-form-group label="Note (optional):" label-size="sm">
                      <b-form-input v-model="note" type="text" size="md"></b-form-input>
                    </b-form-group>

                    <b-form-group label="Production Batch Number (optional):" label-size="sm">
                      <b-form-input
                        v-model="productionBatchNumber"
                        type="text"
                        size="md"
                      ></b-form-input>
                    </b-form-group>

                    <b-form-checkbox size="md" class="text-lg" v-model="isDonation">
                      Donation
                    </b-form-checkbox>

                    <b-form-checkbox size="md" class="text-lg" v-model="isTradeSample">
                      Trade Sample
                    </b-form-checkbox>
                  </div>
                </template>

                <div class="col-span-2 flex flex-row justify-center">
                  <b-button
                    class="opacity-40"
                    variant="light"
                    @click="showHiddenDetailFields = !showHiddenDetailFields"
                    >ADVANCED</b-button
                  >
                </div>
              </template>
            </div>
          </div>

          <div class="flex flex-col items-stretch space-y-8">
            <template
              v-if="
                outputItem &&
                (!facilityUsesLocationForPackages || location) &&
                newPackageCount &&
                perPackageQuantity &&
                sourcePackageAdjustQuantity
              "
            >
              <tag-picker
                :tagTypeNames="['CannabisPackage', 'MedicalPackage']"
                :tagCount="quantityList.length"
                :selectedTags="packageTags"
                v-on:update:selectedTags="updateSplitPackageData({ packageTags: $event })"
              />
            </template>
          </div>

          <div class="col-start-2 flex flex-col items-stretch">
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
        <div class="flex flex-col items-center">
          <template v-if="!errorMessage">
            <div class="flex flex-col space-y-4 text-xl" style="width: 600px">
              <div>
                Creating
                <span class="font-bold ttt-purple">{{ quantityList.length }}</span>
                new packages.
              </div>

              <div>
                Each new package contains
                <span class="font-bold ttt-purple"
                  >{{ quantityList[0] }} {{ sourcePackage.Item.UnitOfMeasureName }}</span
                >
                of
                <span class="font-bold ttt-purple">{{ sourcePackage.Item.Name }}</span>
                .
              </div>

              <div>
                Uses
                <span class="font-bold ttt-purple">{{ packageTags.length }} package tags.</span>
              </div>

              <div v-if="productionBatchNumber">
                Production Batch #:
                <span class="font-bold ttt-purple">{{ productionBatchNumber }}</span>
              </div>

              <div>
                Package date:
                <span class="font-bold ttt-purple">{{ packageIsodate }}</span>
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
                    >CREATE {{ quantityList.length }} PACKAGES</b-button
                  >
                </transition>
              </div>
            </div>
          </template>

          <template v-else>
            <span class="text-center text-red-700">{{ errorMessage }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import ItemPicker from "@/components/overlay-widget/shared/ItemPicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import { BuilderType, MessageType } from "@/consts";
import {
  IBuilderComponentError,
  ICsvFile,
  IIntermediateCreatePackageFromPackagesData,
  IItemData,
  ILocationData,
  IMetrcCreatePackagesFromPackagesPayload,
  IPackageData,
  ITagData,
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { SplitPackageBuilderActions } from "@/store/page-overlay/modules/split-package-builder/consts";
import { safeZip } from "@/utils/array";
import { buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";
import { submitDateFromIsodate } from "@/utils/date";
import { round } from "@/utils/math";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import _ from "lodash";
import { timer } from "rxjs";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

async function defaultRemediatePackageMethod(): Promise<string> {
  // Metrc form seems to default to "0"
  //
  // Return "0" if lookup fails, otherwise use the first entry Id.
  // It is possible this is not important when the remediation date is not provided.
  try {
    const methods = await dynamicConstsManager.remediatePackageMethods();

    console.log(methods);

    const filteredMethods = methods.filter((x) => x.Id.toString() === "0");

    if (filteredMethods.length === 0) {
      return methods[0].Id.toString();
    } else {
      return filteredMethods[0].Id.toString();
    }
  } catch (e) {
    return "0";
  }
}

export default Vue.extend({
  name: "SplitPackageBuilder",
  store,
  components: {
    BuilderStepHeader,
    SinglePackagePicker,
    TagPicker,
    ItemPicker,
    // PickerIcon,
    // PickerCard,
    LocationPicker,
  },
  methods: {
    ...mapActions({
      setPackage: `splitPackageBuilder/${SplitPackageBuilderActions.SET_SOURCE_PACKAGE}`,
      updateSplitPackageData: `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
    }),
    setActiveStepIndex(index: number): void {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`,
      });
    },
    unitOfMeasureNameToAbbreviation,
    round,
    async submit(): Promise<void> {
      const rows: IMetrcCreatePackagesFromPackagesPayload[] = [];

      // @ts-ignore
      const zipped: [ITagData, IIntermediateCreatePackageFromPackagesData][] = safeZip(
        this.packageTags,
        this.quantityList
      );

      const sourcePackage = this.sourcePackage as IPackageData;

      const newPackageItem: IItemData = this.outputItem as IItemData;

      for (let el of zipped) {
        const [tag, quantity] = el;

        const row: IMetrcCreatePackagesFromPackagesPayload = {
          ActualDate: submitDateFromIsodate(this.packageIsodate as string),
          Ingredients: [
            {
              FinishDate: "", // Default to do not finish
              PackageId: sourcePackage.Id.toString(),
              Quantity: (
                (this.sourcePackageAdjustQuantity as number) / this.quantityList.length
              ).toString(),
              UnitOfMeasureId: sourcePackage.Item.UnitOfMeasureId.toString(),
            },
          ],
          ItemId: newPackageItem.Id.toString(),
          Note: this.note,
          Quantity: quantity.toString(),
          TagId: tag.Id.toString(),
          UnitOfMeasureId: newPackageItem.UnitOfMeasureId.toString(),
          RemediationDate: "",
          RemediationMethodId: "0", //await defaultRemediatePackageMethod(),
          RemediationSteps: "",
          ...(this.isDonation ? { IsDonation: "true" } : {}),
          ...(this.isTradeSample ? { IsTradeSample: "true" } : {}),
          ...(this.productionBatchNumber
            ? { ProductionBatchNumber: this.productionBatchNumber }
            : {}),
          ...(this.$data.facilityUsesLocationForPackages
            ? {
                LocationId: this.location!.Id.toString(),
              }
            : {}),
          // UseSameItem: "false", // default to false and just provide the item id anyway
        };

        rows.push(row);
      }

      builderManager.submitProject(
        // This is probably redundant
        _.cloneDeep(rows),
        this.$data.builderType,
        {
          packageTotal: this.quantityList.length,
        },
        this.buildCsvFiles(),
        5
      );
    },
    buildCsvFiles(): ICsvFile[] {
      // NOTE: this CSV format is made up, purely for record keeping.
      // These cannot be submitted to metrc.
      //
      // Source Package Label
      // Source Package Item Name
      // Source Package Adjustment Amount
      // Source Package Adjustment Unit of Measure
      // Destination Package Label
      // Destination Package Item Name
      // Destination Package Adjustment Amount
      // Destination Package Adjustment Unit of Measure
      // Date

      // @ts-ignore
      const zipped: [ITagData, IIntermediateCreatePackageFromPackagesData][] = safeZip(
        this.packageTags,
        this.quantityList
      );

      const flattened = [];

      // zipped contains nested lists, so we need to flatten into a 2d matrix
      for (let [tagData, quantity] of zipped) {
        flattened.push({
          sourceLabel: this.sourcePackage.Label,
          sourceItem: this.sourcePackage.Item.Name,
          sourceAdjustmentAmount:
            (this.sourcePackageAdjustQuantity as number) / this.quantityList.length,
          sourceUnitOfMeasure: this.sourcePackage.Item.UnitOfMeasureName,
          destinationLabel: tagData.Label,
          destinationAdjustmentAmount: quantity,
        });
      }

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: flattened.map((f) => f.sourceLabel),
          },
          {
            isVector: true,
            data: flattened.map((f) => f.sourceItem),
          },
          {
            isVector: true,
            data: flattened.map((f) => f.sourceAdjustmentAmount),
          },
          {
            isVector: true,
            data: flattened.map((f) => f.sourceUnitOfMeasure),
          },
          {
            isVector: true,
            data: flattened.map((f) => f.destinationLabel),
          },
          {
            isVector: false,
            data: this.sourcePackage.Item.Name,
          },
          {
            isVector: true,
            data: flattened.map((f) => f.destinationAdjustmentAmount),
          },
          {
            isVector: false,
            data: this.sourcePackage.Item.UnitOfMeasureName,
          },
          {
            isVector: false,
            data: this.packageIsodate,
          },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Create ${this.quantityList.length} packages from ${this.sourcePackage.Label}`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    calculateErrors(): IBuilderComponentError[] {
      const errors: IBuilderComponentError[] = [];

      if (!this.sourcePackage) {
        errors.push({ tags: ["page1"], message: "Select a source package" });
      }

      if (this.sourcePackage?.Quantity === 0) {
        errors.push({
          tags: ["page1"],
          message: "The source package is empty",
        });
      }

      if (this.quantityList.length === 0) {
        errors.push({
          tags: ["page2"],
          message: "Specity one or more new packages to create",
        });
      }

      if (!this.perPackageQuantity) {
        errors.push({
          tags: ["page2", "perPackageQuantity"],
          message: "Enter a per package quantity",
        });
      }

      if (this.perPackageQuantity && this.perPackageQuantity! < 0) {
        errors.push({
          tags: ["page2", "perPackageQuantity"],
          message: "Per package quantity must be greater than 0",
        });
      }

      if (!this.newPackageCount) {
        errors.push({
          tags: ["page2", "newPackageCount"],
          message: "Enter a new package count",
        });
      }

      if (this.newPackageCount < 0) {
        errors.push({
          tags: ["page2", "newPackageCount"],
          message: "New package count must be greater than 0",
        });
      }

      if (!this.sourcePackageAdjustQuantity) {
        errors.push({
          tags: ["page2", "sourcePackageAdjustQuantity"],
          message: "Enter a source package quantity used",
        });
      }

      if (this.sourcePackageAdjustQuantity < 0) {
        errors.push({
          tags: ["page2", "sourcePackageAdjustQuantity"],
          message: "Source package quantity used must be greater than 0",
        });
      }

      if (this.sourcePackage && this.sourcePackageAdjustQuantity > this.sourcePackage.Quantity) {
        errors.push({
          tags: ["page2", "sourcePackageAdjustQuantity"],
          message: "Source package quantity used cannot exceed the package quantity",
        });
      }

      if (!this.outputItem) {
        errors.push({
          tags: ["page2"],
          message: "Select an item for newly created packages",
        });
      }

      if (!this.location && this.$data.facilityUsesLocationForPackages) {
        errors.push({
          tags: ["page2"],
          message: "Select a location for newly created packages",
        });
      }

      if (this.packageTags.length === 0) {
        errors.push({
          tags: ["page2"],
          message: "Select package tags for your new packages",
        });
      }

      if (this.packageTags.length !== this.quantityList.length) {
        errors.push({
          tags: ["page2"],
          message: "You must select one package tag for each new package",
        });
      }

      return errors;
    },
    updateQuantities(): void {
      let quantityList = [];

      if (this.$data.perPackageQuantity && this.$data.newPackageCount) {
        quantityList = new Array(this.$data.newPackageCount).fill(this.$data.perPackageQuantity);

        if (this.outputItem?.Id === this.sourcePackage.Item.Id) {
          this.sourcePackageAdjustQuantity = round(
            quantityList.reduce((a, b) => a + b, 0),
            4
          );
        }
      }

      this.updateSplitPackageData({
        quantityList,
      });
    },
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      sourcePackage: (state: any) => state.splitPackageBuilder.sourcePackage,
      packageTags: (state: any) => state.splitPackageBuilder.packageTags,
      quantityList: (state: any) => state.splitPackageBuilder.quantityList,
    }),
    sourceUnitAbbreviation(): string {
      return unitOfMeasureNameToAbbreviation(
        this.sourcePackage?.Item.UnitOfMeasureName || ""
      ).toLocaleLowerCase();
    },
    outputUnitAbbreviation(): string {
      // if (this.useSameItem) {
      //   return this.sourceUnitAbbreviation;
      // }

      return unitOfMeasureNameToAbbreviation(
        // @ts-ignore
        this.outputItem?.UnitOfMeasureName || ""
      ).toLocaleLowerCase();
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
    perPackageQuantityErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("perPackageQuantity"))
          ?.message || null
      );
    },
    newPackageCountErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) => x.tags.includes("newPackageCount"))
          ?.message || null
      );
    },
    sourcePackageAdjustQuantityErrorMessage(): string | null {
      return (
        this.errors.find((x: IBuilderComponentError) =>
          x.tags.includes("sourcePackageAdjustQuantity")
        )?.message || null
      );
    },
    errorMessage(): string | null {
      return this.errors.find((x: IBuilderComponentError) => true)?.message || null;
    },
    errors(): IBuilderComponentError[] {
      return this.calculateErrors();
    },
    outputItem: {
      get(): IItemData | null {
        return this.$store.state.splitPackageBuilder.outputItem;
      },
      set(outputItem: IItemData | null) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { outputItem }
        );
      },
    },
    location: {
      get(): ILocationData | null {
        return this.$store.state.splitPackageBuilder.location;
      },
      set(location: ILocationData | null) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { location }
        );
      },
    },
    note: {
      get(): string {
        return this.$store.state.splitPackageBuilder.note;
      },
      set(note: string) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { note }
        );
      },
    },
    productionBatchNumber: {
      get(): string {
        return this.$store.state.splitPackageBuilder.productionBatchNumber;
      },
      set(productionBatchNumber: string) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { productionBatchNumber }
        );
      },
    },
    remediationDate: {
      get(): string {
        return this.$store.state.splitPackageBuilder.remediationDate;
      },
      set(remediationDate: string) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { remediationDate }
        );
      },
    },
    remediationMethodId: {
      get(): string {
        return this.$store.state.splitPackageBuilder.remediationMethodId;
      },
      set(remediationMethodId: string) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { remediationMethodId }
        );
      },
    },
    remediationSteps: {
      get(): string {
        return this.$store.state.splitPackageBuilder.remediationSteps;
      },
      set(remediationSteps: string) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { remediationSteps }
        );
      },
    },
    useSameItem: {
      get(): boolean {
        return this.$store.state.splitPackageBuilder.useSameItem;
      },
      set(useSameItem: boolean) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { useSameItem }
        );
      },
    },
    isDonation: {
      get(): boolean {
        return this.$store.state.splitPackageBuilder.isDonation;
      },
      set(isDonation: boolean) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { isDonation }
        );
      },
    },
    isTradeSample: {
      get(): boolean {
        return this.$store.state.splitPackageBuilder.isTradeSample;
      },
      set(isTradeSample: boolean) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { isTradeSample }
        );
      },
    },
    packageIsodate: {
      get(): string {
        return this.$store.state.splitPackageBuilder.packageIsodate;
      },
      set(packageIsodate: string) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { packageIsodate }
        );
      },
    },
    sourcePackageAdjustQuantity: {
      get(): number {
        return this.$store.state.splitPackageBuilder.sourcePackageAdjustQuantity;
      },
      set(sourcePackageAdjustQuantity: number) {
        this.$store.dispatch(
          `splitPackageBuilder/${SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA}`,
          { sourcePackageAdjustQuantity }
        );
      },
    },
    allDetailsProvided(): boolean {
      return (
        !!this.sourcePackage &&
        this.packageTags.length > 0 &&
        this.quantityList.length > 0 &&
        this.packageTags.length === this.quantityList.length &&
        this.quantityList.reduce((a: number, b: number) => a + b, 0) <= this.sourcePackage?.Quantity
      );
    },
    csvFiles(): ICsvFile[] {
      return this.buildCsvFiles();
    },
  },
  watch: {
    sourcePackage: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!this.outputItem && this.sourcePackage) {
          this.outputItem = this.sourcePackage.Item;
        }
      },
    },
    // useSameItem: {
    //   immediate: true,
    //   handler(newValue, oldValue) {
    //     if (!newValue) {
    //       this.outputItem = null;
    //     }
    //   }
    // },
    perPackageQuantity: {
      immediate: true,
      handler(newValue, oldValue) {
        this.updateQuantities();
      },
    },
    newPackageCount: {
      immediate: true,
      handler(newValue, oldValue) {
        this.updateQuantities();
      },
    },
  },
  data() {
    return {
      builderType: BuilderType.SPLIT_PACKAGE,
      activeStepIndex: 0,
      perPackageQuantity: null,
      newPackageCount: 1,
      showHiddenDetailFields: false,
      showTagPicker: false,
      facilityUsesLocationForPackages: false,
      steps: [
        {
          stepText: "Select source package",
        },
        {
          stepText: "New package details",
        },
        {
          stepText: "Submit",
        },
      ],
    };
  },
  async created() {
    // Eagerly load the tags and remediate methods
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));
    timer(1000).subscribe(() => dynamicConstsManager.remediatePackageMethods());

    this.$data.facilityUsesLocationForPackages =
      await dynamicConstsManager.facilityUsesLocationForPackages();
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  },
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
