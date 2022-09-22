<template>
  <div
    class="w-full flex-grow grid grid-cols-2 grid-flow-row auto-rows-fr gap-4"
    style="max-height: 50vh"
  >
    <!-- Package filter -->
    <div class="flex flex-col row-span-2 items-center p-4">
      <div class="w-full flex flex-col space-y-4" style="width: 420px">
        <template v-if="showItemPicker">
          <!-- <div class="flex flex-row items-center justify-center">
            <span class="text-lg font-bold">Select packages by item:</span>
          </div> -->

          <b-form-group label="Filter by item" label-class="text-gray-400" label-size="sm">
            <item-picker
              :item.sync="item"
              :itemFilters="itemFilters"
              :zeroResultsErrorSuggestionMessage="itemFilterZeroResultsErrorSuggestionMessage"
            />
          </b-form-group>
        </template>

        <template v-if="showLocationPicker">
          <!-- <div class="flex flex-row items-center justify-center">
            <span class="text-lg font-bold">Select packages by location:</span>
          </div> -->

          <b-form-group label="Filter by location" label-class="text-gray-400" label-size="sm">
            <location-picker
              :location.sync="location"
              :locationFilters="locationFilters"
              :zeroResultsErrorSuggestionMessage="locationFilterZeroResultsErrorSuggestionMessage"
            />
          </b-form-group>
        </template>

        <template v-if="selectedPackages.length >= maxPackageCount">
          <div class="font-bold text-red-700 text-center">
            Package Maximum Reached
          </div>
          <div class="text-red-700 text-center">
            Can't load any more packages. Submit this chunk before loading the next chunk.
          </div>
        </template>

        <div class="flex flex-col items-center text-center space-y-4">
          <error-readout
            v-if="error || inflight"
            :inflight="inflight"
            :error="error"
            loadingMessage="Loading packages..."
            errorMessage="Unable to load packages."
            permissionsErrorMessage="Check that your employee account has full Packages permissions."
            v-on:retry="loadPackages()"
          />

          <template v-if="!inflight && !sourcePackages.length && (!!item || !!location)">
            <span>0 matching packages.</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Selected packages -->
    <div class="row-span-2 flex flex-col items-center space-y-4 p-4">
      <template v-if="sourcePackages.length > 0">
        <b-dropdown
          style="width: 420px"
          :text="selectedMenuItem.toUpperCase()"
          variant="outline-primary"
          class="w-full"
          menu-class="w-100 pt-0 pb-0"
          block
          rounded
        >
          <b-dropdown-item
            :active="selectedMenuItem === selectedMenuState.SELECTION"
            @click="selectedMenuItem = selectedMenuState.SELECTION"
          >
            <div class="pt-2 pb-2">{{ selectedMenuState.SELECTION }}</div>
          </b-dropdown-item>
          <div class="border-b border-solid border-inherit"></div>
          <b-dropdown-item
            :active="selectedMenuItem === selectedMenuState.PASTED_TAGS"
            @click="selectedMenuItem = selectedMenuState.PASTED_TAGS"
          >
            <div class="pt-2 pb-2">{{ selectedMenuState.PASTED_TAGS }}</div>
          </b-dropdown-item>
        </b-dropdown>

        <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
          <div
            style="width: 420px"
            class="
              toolkit-scroll
              flex flex-col
              items-center
              h-4/6
              overflow-y-auto
              p-1
            "
          >
            <div class="w-full flex flex-col flex-grow items-center space-y-2">
              <div
                class="
                  w-full
                  hover-reveal-target
                  flex flex-row
                  items-center
                  justify-between
                  space-x-8
                  text-lg
                  package-list-item
                "
                v-for="(pkg, index) in packagesPage"
                :key="pkg.Label"
              >
                <div class="flex flex-col flex-grow space-y-2">
                  <template v-if="pageOffset + index > 0">
                    <b-button
                      variant="warning"
                      class="hover-reveal"
                      size="sm"
                      @click="removeBefore(pageOffset + index)"
                      >&#129045; UNCHECK {{ pageOffset + index }} BEFORE</b-button
                    >
                  </template>

                  <b-form-checkbox
                    class="hover:bg-blue-50"
                    size="md"
                    v-model="selectedPackagesMirror"
                    :value="pkg"
                  >
                    <picker-card
                      :title="`${pkg.Quantity} ${pkg.Item.UnitOfMeasureName} ${pkg.Item.Name}`"
                      :label="pkg.Label"
                    />
                  </b-form-checkbox>

                  <template v-if="sourcePackages.length - (pageOffset + index) - 1 > 0">
                    <b-button
                      variant="warning"
                      class="hover-reveal"
                      size="sm"
                      @click="removeAfter(pageOffset + index)"
                    >
                      &#129047; UNCHECK
                      {{ sourcePackages.length - (pageOffset + index) - 1 }}
                      AFTER</b-button
                    >
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <paste-tags
          v-if="selectedMenuItem === selectedMenuState.PASTED_TAGS"
          :tags.sync="pastedTags"
          ref="pasteTags"
        >
        </paste-tags>
      </template>

      <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
        <template v-if="sourcePackages.length > packagesPageSize">
          <div class="flex flex-row justify-between items-center" style="width: 420px">
            <b-button
              :disabled="!hasPrevPage"
              variant="outline-info"
              @click="packagesPageIndex -= 1"
              >&lt;</b-button
            >

            <span>{{ packagesPageIndex + 1 }} of {{ pages }}</span>

            <b-button
              :disabled="!hasNextPage"
              variant="outline-info"
              @click="packagesPageIndex += 1"
              >&gt;</b-button
            >
          </div>
        </template>
      </template>

      <div class="flex flex-row items-center justify-center space-x-6">
        <span class="text-center text-xl font-bold"
          ><animated-number :number="selectedPackages.length" /> packages selected</span
        >

        <template v-if="selectedPackages.length > 0">
          <span class="text-blue-500 underline cursor-pointer" @click="clear()">CLEAR</span>
        </template>
      </div>

      <!-- <template v-if="isPackagesExcluded">
        <span class="text-red-500">{{ packagesExcluded }} packages excluded</span>
      </template> -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import ItemPicker from "@/components/overlay-widget/shared/ItemPicker.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import AnimatedNumber from "@/components/overlay-widget/shared/AnimatedNumber.vue";
import PasteTags from "@/components/overlay-widget/shared/PasteTags.vue";
import { MessageType, DATA_LOAD_MAX_COUNT } from "@/consts";
import {
  IItemData,
  IPackageData,
  IClientItemFilters,
  IClientLocationFilters,
  IClientPackagePickerFilters,
  ILocationData
} from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { submitDateFromIsodate } from "@/utils/date";
import { Subject, combineLatest } from "rxjs";
import { debounceTime, distinctUntilChanged, startWith, tap, filter } from "rxjs/operators";
import { buildCsvDataOrError, buildNamedCsvFileData } from "@/utils/csv";
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import { v4 } from "uuid";
import { itemMatchesFilters } from "@/utils/filters";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import { searchManager } from "@/modules/search-manager.module";

const PAGE_SIZE = 100;

export enum SelectedMenuState {
  SELECTION = "Select Packages",
  PASTED_TAGS = "Paste Package Tags"
}

export default Vue.extend({
  name: "PackagePicker",
  store,
  components: {
    ItemPicker,
    ErrorReadout,
    PickerCard,
    AnimatedNumber,
    LocationPicker,
    PasteTags
  },
  props: {
    selectedPackages: Array as () => IPackageData[],
    packageFilters: {
      type: Object as () => IClientPackagePickerFilters,
      default: (): IClientPackagePickerFilters => ({}),
      required: false
    },
    itemFilters: {
      type: Object as () => IClientItemFilters,
      default: (): IClientItemFilters => ({} as IClientItemFilters)
    },
    locationFilters: {
      type: Object as () => IClientLocationFilters,
      default: (): IClientLocationFilters => ({} as IClientLocationFilters)
    },
    showItemPicker: {
      type: Boolean,
      default: true
    },
    showLocationPicker: {
      type: Boolean,
      default: false
    },
    eagerLoad: Boolean,
    itemFilterZeroResultsErrorSuggestionMessage: String,
    locationFilterZeroResultsErrorSuggestionMessage: String
  },
  methods: {
    clear() {
      this.$data.item = null;
      this.$data.location = null;

      this.$data.sourcePackages = [];
      this.$data.selectedPackagesMirror = [];
      this.$data.selectedMenuItem = SelectedMenuState.SELECTION;

      // @ts-ignore
      this.$refs.pasteTags.clearForm();
    },
    removeBefore(index: number) {
      this.$data.selectedPackagesMirror = this.$data.sourcePackages
        .slice(index)
        .filter((x: IPackageData) => this.$props.selectedPackages.includes(x));
    },
    removeAfter(index: number) {
      this.$data.selectedPackagesMirror = this.$data.sourcePackages
        .slice(0, index + 1, this.$data.sourcePackages.length)
        .filter((x: IPackageData) => this.$props.selectedPackages.includes(x));
    },
    filterSelected() {
      if (this.isPastedTags) {
        this.filterSelectedByPastedTags();
      } else {
        this.selectAll();
      }
    },
    filterSelectedByPastedTags() {
      this.$data.selectedPackagesMirror = this.$data.sourcePackages.filter((x: IPackageData) =>
        this.$data.pastedTags.includes(x.Label)
      );
    },
    selectAll() {
      this.$data.selectedPackagesMirror = this.$data.sourcePackages;
    },
    async loadPackages() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        // This is a fucking hack, do better
        const lock = v4();
        this.$data.lockUuid = lock;

        let allPackages = await primaryDataLoader.onDemandPackageFilter({
          itemName: this.$data.item?.Name || null,
          locationName: this.$data.location?.Name || null,
          isEmpty: this.$props.packageFilters.isEmpty
        });

        // let allPackages = await primaryDataLoader.activePackages();

        // If there was a subsequent load, don't overwrite
        if (this.$data.lockUuid === lock) {
          // Filter empty packages and package type
          const filteredPackages = allPackages.filter((packageData: IPackageData) => {
            // if (typeof this.$props.packageFilters.isEmpty === "boolean") {
            //   if (this.$props.packageFilters.isEmpty) {
            //     if (packageData.Quantity > 0) {
            //       return false;
            //     }
            //   } else {
            //     if (packageData.Quantity === 0) {
            //       return false;
            //     }
            //   }
            // }

            if (!itemMatchesFilters(packageData.Item, this.itemFilters)) {
              return false;
            }

            // if (this.$data.item) {
            //   if (packageData.Item.Name !== this.$data.item.Name) {
            //     return false;
            //   }
            // }

            // if (!locationMatchesFilters(packageData.LocationTypeName, this.locationFilters)) {
            //   return false;
            // }

            // if (this.$data.location) {
            //   if (packageData.LocationName !== this.$data.location.Name) {
            //     return false;
            //   }
            // }

            return true;
          });

          this.$data.sourcePackages = filteredPackages.sort((a: IPackageData, b: IPackageData) =>
            a.Label > b.Label ? 1 : -1
          );

          // This must perform a shallow clone
          this.$data.selectedPackagesMirror = [...this.$data.sourcePackages];
        }
      } catch (e) {
        console.error(e);
        this.$data.error = e;
      }

      this.$data.inflight = false;
    }
  },
  computed: {
    packagesPage() {
      const startIdx = PAGE_SIZE * this.$data.packagesPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.packagesPageIndex + 1);
      return this.$data.sourcePackages.slice(startIdx, endIdx);
    },
    hasNextPage() {
      return (this.$data.packagesPageIndex + 1) * PAGE_SIZE < this.$data.sourcePackages.length;
    },
    hasPrevPage() {
      return this.$data.packagesPageIndex > 0;
    },
    pages() {
      return Math.ceil(this.$data.sourcePackages.length / PAGE_SIZE);
    },
    pageOffset() {
      return this.$data.packagesPageIndex * PAGE_SIZE;
    },
    packagesExcluded() {
      return this.$data.sourcePackages.length - this.$props.selectedPackages.length;
    },
    isPackagesExcluded() {
      return this.$props.selectedPackages.length < this.$data.sourcePackages.length;
    },
    isPastedTags() {
      return this.$data.pastedTags.length > 0;
    }
  },
  data() {
    return {
      item: null,
      item$: new Subject<IItemData>(),
      location: null,
      location$: new Subject<ILocationData>(),
      sourcePackages: [],
      selectedPackagesMirror: [],
      packagesPageIndex: 0,
      packagesPageSize: PAGE_SIZE,
      inflight: false,
      error: null,
      maxPackageCount: DATA_LOAD_MAX_COUNT,
      lockUuid: null,
      copyPasteTags: false,
      pastedTags: [],
      selectedMenuState: SelectedMenuState,
      selectedMenuItem: SelectedMenuState.SELECTION
    };
  },
  watch: {
    item: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.item$.next(newValue);
      }
    },
    location: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.location$.next(newValue);
      }
    },
    selectedPackagesMirror: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit("update:selectedPackages", newValue);
      }
    },
    pastedTags: {
      immediate: true,
      handler(newValue, oldValue) {
        this.filterSelected();
      }
    }
  },
  async created() {
    // Single time per pageload
    await authManager.authStateOrError();

    if (this.$props.eagerLoad) {
      this.loadPackages();
    }

    combineLatest([
      this.$data.item$.pipe(debounceTime(500), distinctUntilChanged(), startWith(null)),
      this.$data.location$.pipe(debounceTime(500), distinctUntilChanged(), startWith(null))
    ])
      .pipe(
        tap((_: any) => {
          this.$data.packagesPageIndex = 0;
        }),
        filter(([item, location]) => {
          return !!item || !!location;
        })
      )
      .subscribe(async ([item, location]: [IItemData, ILocationData]) => {
        this.$data.item = item;
        this.$data.location = location;

        // Allow parent component to use selected item/location
        this.$emit("selectItem", item);
        this.$emit("selectLocation", location);

        this.loadPackages();
      });
  }
});
</script>

<style type="text/scss" lang="scss">
.hover-reveal-target .hover-reveal {
  display: none !important;
}

.hover-reveal-target:hover .hover-reveal {
  display: block !important;
}
</style>
