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
          v-on:selectItem="
            inputItem = $event;
            outputItem = $event;
          "
          :packageFilters="{ isEmpty: false }"
          itemFilterZeroResultsErrorSuggestionMessage="Only active packages with remaining quantity can be used here."
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
          <template v-if="!showTagPicker">
            <b-form-group class="w-full" label="New package item:" label-size="sm">
              <item-picker
                :item.sync="outputItem"
                :selectOwnedItems="true"
                :itemFilters="{
                  quantityType: [inputItem.QuantityTypeName]
                }"
              />
            </b-form-group>

            <b-form-group class="w-full" label="New package quantity:" label-size="sm">
              <b-input-group :append="outputItem.UnitOfMeasureName">
                <b-form-input
                  v-model.number="totalPackageQuantity"
                  type="number"
                  size="md"
                  step="0.0000001"
                  min="0"
                  :max="maximumTotalPackageQuantity"
                  required
                  class="text-center"
                ></b-form-input>
              </b-input-group>

              <template
                v-if="
                  maximumTotalPackageQuantity && maximumTotalPackageQuantity < totalPackageQuantity
                "
              >
                <b-form-invalid-feedback>
                  Warning: package total exceeds total quantity available
                </b-form-invalid-feedback>
              </template>

              <template v-if="maximumTotalPackageQuantity">
                <b-form-text
                  ><div class="flex flex-row items-center space-x-2">
                    <span
                      >Total available: {{ maximumTotalPackageQuantity }}
                      {{ inputItem.UnitOfMeasureName }}</span
                    >

                    <b-button variant="link" size="sm" @click="useMax()">MERGE ALL</b-button>
                  </div>
                </b-form-text>
              </template>
            </b-form-group>

            <template v-if="facilityUsesLocationForPackages">
              <b-form-group class="w-full" label="Location:" label-size="sm">
                <location-picker
                  :location.sync="location"
                  :suggestedLocationName="
                    selectedPackages.length > 0 ? selectedPackages[0].locationName : ''
                  "
                />
              </b-form-group>
            </template>

            <b-form-group class="w-full" label="Package Date:" label-size="sm">
              <b-form-datepicker
                initial-date
                size="md"
                v-model="packageIsodate"
                :value="packageIsodate"
              />
            </b-form-group>

            <b-form-group class="w-full" label="Note (optional):" label-size="sm">
              <b-form-input v-model="note" type="text" size="md"></b-form-input>
            </b-form-group>

            <!-- <template v-if="showHiddenDetailFields"> </template>

            <template v-else>
              <b-button
                class="opacity-40"
                variant="light"
                @click="showHiddenDetailFields = true"
                >ADVANCED</b-button
              >
            </template> -->

            <template v-if="allDetailsProvided">
              <b-button class="w-full" variant="success" size="md" @click="showTagPicker = true">
                NEXT
              </b-button>
            </template>
          </template>

          <template v-if="showTagPicker">
            <b-button variant="light" size="md" @click="showTagPicker = false">
              BACK
            </b-button>

            <template v-if="!tagsSelected">
              <div class="text-lg font-bold">
                {{ newPackageData.length }} package tags required.
              </div>
            </template>

            <b-form-group class="w-full">
              <tag-picker
                tagTypeName="CannabisPackage"
                :tagCount="newPackageData.length"
                :selectedTags.sync="packageTags"
              />
            </b-form-group>

            <template v-if="allDetailsProvided && tagsSelected">
              <b-button class="w-full" variant="success" size="md" @click="activeStepIndex = 2">
                NEXT
              </b-button>
            </template>
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
                Creating
                <span class="font-bold ttt-purple">{{ newPackageData.length }}</span>
                new package.
              </div>

              <div>
                Package contains
                <span class="font-bold ttt-purple"
                  >{{ totalPackageQuantity }} {{ outputItem.UnitOfMeasureName }}</span
                >
                of
                <span class="font-bold ttt-purple">{{ outputItem.Name }}</span>
                .
              </div>

              <div>
                Uses
                <span class="font-bold ttt-purple">{{ packageTags.length }} package tag.</span>
              </div>

              <div>
                Package date:
                <span class="font-bold ttt-purple">{{ packageIsodate }}</span>
              </div>

              <div style="height: 3rem"></div>

              <b-button class="w-full" variant="success" size="md" @click="submit()"
                >CREATE MERGED PACKAGE</b-button
              >
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center space-y-2 p-4 text-lg">
            <span class="text-xl font-bold">You're missing something:</span>

            <span v-if="totalPackageQuantity === 0">Total package quantity is 0</span>
            <span v-if="selectedPackages.length === 0">No packages selected</span>
            <span v-if="newPackageData.length === 0">No package data provided</span>
            <span v-if="packageTags.length === 0">No tags provided</span>
            <span v-if="newPackageData.length > 0 && packageTags.length !== newPackageData.length"
              >Incorrect number of tags provided</span
            >
            <span v-if="!packageIsodate">Package date not provided</span>
            >
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { mapState } from "vuex";
import BuilderStepHeader from "@/components/overlay-widget/shared/BuilderStepHeader.vue";
import { isValidTag, generateTagRangeOrError, getTagFromOffset } from "@/utils/tags";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { combineLatest, from, Subject, timer } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith, tap } from "rxjs/operators";
import {
  IPackageData,
  IPlantFilter,
  ICsvFile,
  ILocationData,
  IMetrcUnpackImmaturePlantsPayload,
  ITagData,
  IMetrcCreatePackagesFromPackagesPayload,
  IIntermediateCreatePackageFromPackagesData
} from "@/interfaces";
import { downloadCsvFile, buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";
import { todayIsodate, submitDateFromIsodate } from "@/utils/date";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import {
  BuilderType,
  MessageType,
  PLANTABLE_ITEM_CATEGORY_NAMES,
  PLANT_BATCH_TYPES
} from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import PackagePicker from "@/components/overlay-widget/shared/PackagePicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import StrainPicker from "@/components/overlay-widget/shared/StrainPicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import ItemPicker from "@/components/overlay-widget/shared/ItemPicker.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import { allocatePackageQuantities } from "@/utils/misc";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { safeZip } from "@/utils/array";

function totalPackageQuantityAvailableOrNull(packages: IPackageData[]): number | null {
  if (!packages.length) {
    return null;
  }

  return packages
    .map((pkg: IPackageData) => pkg.Quantity)
    .reduce((a: number, b: number) => a + b, 0);
}

async function defaultRemediatePackageMethod(): Promise<string> {
  // Metrc form seems to default to "0"
  //
  // Return "0" if lookup fails, otherwise use the first entry Id.
  // It is possible this is not important when the remediation date is not provided.
  try {
    const methods = await dynamicConstsManager.remediatePackageMethods();

    const filteredMethods = methods.filter(x => x.Id.toString() === "0");

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
  name: "MergePackagesBuilder",
  store,
  components: {
    BuilderStepHeader,
    PackagePicker,
    TagPicker,
    ItemPicker,
    LocationPicker
  },
  methods: {
    setActiveStepIndex(index: number) {
      this.$data.activeStepIndex = index;

      analyticsManager.track(MessageType.BUILDER_ENGAGEMENT, {
        builder: this.$data.builderType,
        action: `Set active step to ${index}`
      });
    },
    async submit() {
      const rows: IMetrcCreatePackagesFromPackagesPayload[] = [];

      // @ts-ignore
      const zipped: [ITagData, IIntermediateCreatePackageFromPackagesData][] = safeZip(
        this.$data.packageTags,
        this.$data.newPackageData
      );

      for (let el of zipped) {
        const [tag, newPackageData] = el;

        const row: IMetrcCreatePackagesFromPackagesPayload = {
          ActualDate: submitDateFromIsodate(this.$data.packageIsodate),
          Ingredients: newPackageData.ingredients.map(ingredient => ({
            FinishDate: "", // Default to do not finish
            PackageId: ingredient.pkg.Id.toString(),
            Quantity: ingredient.quantity.toString(),
            UnitOfMeasureId: ingredient.pkg.Item.UnitOfMeasureId.toString()
          })),
          ItemId: this.$data.outputItem.Id.toString(),
          Note: this.$data.note,
          ProductionBatchNumber: "",
          Quantity: newPackageData.quantity.toString(),
          TagId: tag.Id.toString(),
          UnitOfMeasureId: this.$data.outputItem.UnitOfMeasureId.toString(),
          RemediationDate: "",
          RemediationMethodId: "0", //await defaultRemediatePackageMethod(),
          RemediationSteps: "",
          ...(this.$data.facilityUsesLocationForPackages
            ? {
                LocationId: this.$data.location.Id.toString()
              }
            : {})
          // UseSameItem: "false", // default to false and just provide the item id anyway
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          packageTotal: this.$data.selectedPackages.length,
          quantity: this.$data.totalPackageQuantity,
          unitOfMeasure: this.$data.outputItem.UnitOfMeasureName
        },
        this.buildCsvFiles(),
        5
      );
    },
    useMax() {
      this.$data.totalPackageQuantity = totalPackageQuantityAvailableOrNull(
        this.$data.selectedPackages
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
        this.$data.packageTags,
        this.$data.newPackageData
      );

      const flattened = [];

      // zipped contains nested lists, so we need to flatten into a 2d matrix
      for (let [tagData, newPackageData] of zipped) {
        for (let ingredient of newPackageData.ingredients) {
          flattened.push({
            sourceLabel: ingredient.pkg.Label,
            sourceItem: ingredient.pkg.Item.Name,
            sourceAdjustmentAmount: ingredient.quantity,
            sourceUnitOfMeasure: ingredient.pkg.Item.UnitOfMeasureName,
            destinationLabel: tagData.Label,
            destinationAdjustmentAmount: newPackageData.quantity
          });
        }
      }

      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: flattened.map(f => f.sourceLabel)
          },
          {
            isVector: true,
            data: flattened.map(f => f.sourceItem)
          },
          {
            isVector: true,
            data: flattened.map(f => f.sourceAdjustmentAmount)
          },
          {
            isVector: true,
            data: flattened.map(f => f.sourceUnitOfMeasure)
          },
          {
            isVector: true,
            data: flattened.map(f => f.destinationLabel)
          },
          {
            isVector: false,
            data: this.$data.outputItem.Name
          },
          {
            isVector: true,
            data: flattened.map(f => f.destinationAdjustmentAmount)
          },
          {
            isVector: false,
            data: this.$data.outputItem.UnitOfMeasureName
          },
          {
            isVector: false,
            data: this.$data.packageIsodate
          }
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Merging ${this.$data.totalPackageQuantity} ${this.$data.outputItem.UnitOfMeasureName} ${this.$data.outputItem.Name} from ${this.$data.selectedPackages.length} packages`
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
        this.$data.selectedPackages.length > 0 &&
        this.$data.newPackageData.length > 0 &&
        !!this.$data.totalPackageQuantity &&
        this.$data.totalPackageQuantity > 0 &&
        (this.$data.location || !this.$data.facilityUsesLocationForPackages)
      );
    },
    tagsSelected() {
      return (
        this.$data.packageTags.length > 0 &&
        this.$data.packageTags.length === this.$data.newPackageData.length
      );
    },
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
    maximumTotalPackageQuantity() {
      return totalPackageQuantityAvailableOrNull(this.$data.selectedPackages);
    }
  },
  watch: {
    totalPackageQuantity: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue || !this.$data.selectedPackages.length) {
          this.$data.newPackageData = [];
          return;
        }

        this.$data.newPackageData = allocatePackageQuantities(
          [newValue],
          this.$data.selectedPackages
        );
      }
    }
  },
  data() {
    return {
      builderType: BuilderType.MERGE_PACKAGES,
      activeStepIndex: 0,
      selectedPackages: [],
      packageIsodate: todayIsodate(),
      note: "",
      totalPackageQuantity: 0,
      newPackageData: [],
      packageTags: [],
      showHiddenDetailFields: false,
      showTagPicker: false,
      inputItem: null,
      outputItem: null,
      location: null,
      newItem: null,
      facilityUsesLocationForPackages: false,
      steps: [
        {
          stepText: "Select packages to merge"
        },
        {
          stepText: "Merge details"
        },
        {
          stepText: "Submit"
        }
      ]
    };
  },
  async created() {
    // Eagerly load the tags and remediate methods
    timer(1000).subscribe(() => primaryDataLoader.availableTags({}));
    timer(1000).subscribe(() => dynamicConstsManager.remediatePackageMethods());

    this.$data.facilityUsesLocationForPackages = await dynamicConstsManager.facilityUsesLocationForPackages();
  },
  destroyed() {
    // Looks like modal is not actually destroyed
  }
});
</script>

<style type="text/scss" lang="scss" scoped></style>
