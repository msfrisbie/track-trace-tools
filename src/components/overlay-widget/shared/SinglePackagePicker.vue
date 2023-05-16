<template>
  <div class="grid grid-cols-2 grid-rows-2 gap-8" style="grid-template-rows: 1fr auto">
    <!-- Package filter -->
    <div class="flex flex-col row-span-2 items-center">
      <div class="w-full flex flex-col space-y-4" style="max-width: 480px">
        <div class="flex flex-row items-stretch justify-center">
          <b-form-group
            label="SELECT PACKAGE"
            label-size="sm"
            label-class="text-gray-400"
            class="w-full"
          >
            <vue-typeahead-bootstrap
              v-model="query"
              :data="filteredSourcePackages"
              :serializer="
                (pkg) =>
                  `${getLabelOrError(pkg)} ${getQuantityOrError(
                    pkg
                  )} ${getItemUnitOfMeasureNameOrError(pkg)} ${getItemNameOrError(
                    pkg
                  )} ${getStrainNameOrError(pkg)}`
              "
              :minMatchingChars="0"
              :showOnFocus="true"
              :maxMatches="100"
              @hit="addPackage($event)"
              type="text"
              required
              placeholder="Label, item, strain..."
              size="md"
              ref="typeahead"
            >
              <template slot="suggestion" slot-scope="{ htmlText, data }">
                <div class="w-full flex flex-row items-center justify-start space-x-4">
                  <picker-icon
                    icon="box"
                    style="width: 5rem"
                    class="flex-shrink-0"
                    :textClass="data.Quantity === 0 ? 'text-red-500' : ''"
                    :text="`${data.Quantity} ${getItemUnitOfMeasureAbbreviation(data)}`"
                  />

                  <picker-card
                    class="flex-grow"
                    :title="`${getItemNameOrError(data)}`"
                    :label="getLabelOrError(data)"
                  />
                  <div style="display: none">{{ htmlText }}</div>
                  <div style="display: none">{{ data }}</div>
                </div>
              </template>

              <template slot="append" v-if="query">
                <b-button variant="outline-dark" @click.stop.prevent="clear()">
                  <font-awesome-icon icon="backspace" />
                </b-button>
              </template>
            </vue-typeahead-bootstrap>
          </b-form-group>
        </div>

        <template v-if="enablePaste">
          <b-form-group
            label="PASTE PACKAGE TAGS"
            label-size="sm"
            label-class="text-gray-400"
            class="w-full"
          >
            <paste-tags
              :tags.sync="pastedTags"
              :sourceLabels="sourcePackages.map((x) => getLabelOrError(x))"
              ref="pasteTags"
            ></paste-tags>
          </b-form-group>
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
        </div>
      </div>
    </div>

    <!-- Selected packages -->
    <div v-if="showSelection" class="flex flex-col items-stretch space-y-8 overflow-y-auto">
      <div
        class="pr-4 pb-4 overflow-x-hidden overflow-y-auto toolkit-scroll"
        style="max-height: 35vh"
      >
        <b-list-group>
          <!-- Making this fully responsive is fucking annoying. 35vh max height is a hack -->
          <transition-group name="list">
            <template v-for="pkg in selectedPackages">
              <b-list-group-item
                :key="getLabelOrError(pkg)"
                class="flex flex-row items-center justify-start space-x-4 flex-nowrap"
              >
                <!-- grid-column-start:1 is to fix some rendering weirdness when items enter/leave -->
                <picker-icon
                  icon="box"
                  style="width: 5rem"
                  class="flex-shrink-0"
                  :textClass="getQuantityOrError(pkg) === 0 ? 'text-red-500' : ''"
                  :text="`${getQuantityOrError(pkg)} ${unitOfMeasureNameToAbbreviation(
                    getItemUnitOfMeasureNameOrError(pkg)
                  )}`"
                />

                <picker-card
                  class="flex-grow"
                  :title="`${getItemNameOrError(pkg)}`"
                  :label="getLabelOrError(pkg)"
                />

                <b-button
                  class="px-4 text-red-500 hover:text-red-800"
                  variant="link"
                  @click="removePackage(pkg)"
                >
                  &#215;</b-button
                >
              </b-list-group-item>
            </template>
          </transition-group>
        </b-list-group>
      </div>

      <div class="flex flex-col items-center space-y-4">
        <span class="text-center text-xl font-bold"
          ><animated-number :number="selectedPackages.length" /> package{{
            selectedPackages.length === 1 ? "" : "s"
          }}
          selected</span
        >

        <template v-if="selectedPackages.length > 0">
          <span
            class="text-center text-purple-500 underline cursor-pointer"
            @click="resetPackages()"
            >CLEAR</span
          >
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import AnimatedNumber from "@/components/overlay-widget/shared/AnimatedNumber.vue";
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import PasteTags from "@/components/overlay-widget/shared/PasteTags.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import { IPackageData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import store from "@/store/page-overlay/index";
import {
  getLabelOrError,
  getQuantityOrError,
  getStrainNameOrError,
  getItemNameOrError,
  getItemUnitOfMeasureNameOrError,
  getItemUnitOfMeasureAbbreviationOrError,
} from "@/utils/package";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import _ from "lodash";
import { timer } from "rxjs";
import Vue from "vue";

export default Vue.extend({
  name: "SinglePackagePicker",
  store,
  components: {
    ErrorReadout,
    PickerCard,
    PickerIcon,
    AnimatedNumber,
    PasteTags,
  },
  props: {
    enablePaste: {
      type: Boolean,
      default: false,
    },
    selectedPackages: Array as () => IPackageData[],
    builderType: String,
    reopenPickerAfterSelect: {
      type: Boolean,
      default: true,
    },
    selectAllPackageTypes: {
      type: Boolean,
      default: false,
    },
    showSelection: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    getLabelOrError,
    getQuantityOrError,
    getStrainNameOrError,
    getItemNameOrError,
    getItemUnitOfMeasureNameOrError,
    getItemUnitOfMeasureAbbreviationOrError,
    async loadPackages() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        this.$data.inflight = true;

        // @ts-ignore
        // this.setSourcePackages(await primaryDataLoader.activePackages());
      } catch (e) {
        console.error(e);
        this.$data.error = e;
      }

      this.$data.inflight = false;
    },
    setSourcePackages(pkgs: IPackageData[]) {
      this.$data.sourcePackages = pkgs.sort((a: IPackageData, b: IPackageData) =>
        a.Label > b.Label ? 1 : -1
      );
    },
    focus() {
      // @ts-ignore
      this.$refs.typeahead?.$el.querySelector("input").focus();
    },
    blur() {
      // @ts-ignore
      this.$refs.typeahead?.$el.querySelector("input").blur();
    },
    clear() {
      this.$data.query = "";
      // @ts-ignore
      this.$refs.typeahead?.$el.querySelector("input").value = "";

      // @ts-ignore
      this.blur();

      if (this.reopenPickerAfterSelect) {
        // @ts-ignore
        timer(0).subscribe(() => this.focus());
      }
    },
    resetPackages() {
      // Spread operator is to take a snapshot of the packages
      // Fixes an odd bug where only half are removed
      for (let pkg of [...this.selectedPackages]) {
        this.removePackage(pkg);
      }
    },
    addPackage(pkg: IPackageData) {
      this.$emit("addPackage", pkg);

      // @ts-ignore
      timer(300).subscribe(() => this.clear());
    },
    removePackage(pkg: IPackageData) {
      this.$emit("removePackage", pkg);
    },
    updateSourcePackages() {
      // @ts-ignore
      this.updateSourcePackagesImpl();
    },
    updateSourcePackagesImpl: _.debounce(async function () {
      // @ts-ignore
      const _this: any = this;

      const queryString = _this.$data.query;

      if (queryString.length === 0) {
        _this.$data.sourcePackages = [];
      }

      _this.$data.sourcePackages = await primaryDataLoader.onDemandActivePackageSearch({
        queryString,
      });
      if (_this.selectAllPackageTypes) {
        _this.$data.sourcePackages = [
          ..._this.$data.sourcePackages,
          ...(await primaryDataLoader.onDemandInactivePackageSearch({
            queryString,
          })),
          ...(await primaryDataLoader.onDemandInTransitPackageSearch({
            queryString,
          })),
        ];
      }
    }, 500),
  },
  computed: {
    filteredSourcePackages() {
      if (!this.$props.selectedPackages) {
        return this.$data.sourcePackages;
      }

      // Remove packages that are already selected
      return this.$data.sourcePackages.filter(
        (y: IPackageData) =>
          // @ts-ignore
          !this.$props.selectedPackages.find((x: IPackageData) => x.Label === y.Label)
      );
    },
  },
  data() {
    return {
      query: "",
      sourcePackages: [],
      inflight: false,
      error: null,
      pastedTags: [],
      activePackages: [],
    };
  },
  watch: {
    pastedTags: {
      immediate: true,
      handler: async function (newValue, oldValue) {
        if (!newValue.length) {
          return;
        }

        for (const tag of newValue) {
          try {
            let matchingPkg = await primaryDataLoader.activePackage(tag);

            if (this.selectAllPackageTypes) {
              if (!matchingPkg) {
                matchingPkg = await primaryDataLoader.inactivePackage(tag);
              }

              if (!matchingPkg) {
                matchingPkg = await primaryDataLoader.inTransitPackage(tag);
              }
            }

            if (matchingPkg) {
              this.$emit("addPackage", matchingPkg);
            }
          } catch (e) {
            console.error(e);
          }
        }

        this.$data.pastedTags = [];
      },
    },
    query: {
      immediate: true,
      handler(newValue, oldValue) {
        this.updateSourcePackages();
      },
    },
    // selectedPackagesMirror: {
    //   immediate: true,
    //   handler(newValue, oldValue) {
    //     console.log(newValue?.length, oldValue?.length);
    //     // Throw out the first change
    //     if (!oldValue || (newValue?.length === 0 && oldValue?.length === 0)) {
    //       return;
    //     }
    //     // @ts-ignore
    //     this.$emit("update:selectedPackages", newValue);
    //   },
    // },
  },
  async mounted() {
    // Single time per pageload
    await authManager.authStateOrError();

    // @ts-ignore
    this.loadPackages();

    // Eagerly refresh
    // @ts-ignore
    // this.setSourcePackages(await primaryDataLoader.activePackages());
    // @ts-ignore
    // this.setSourcePackages(await primaryDataLoader.activePackages(true));
  },
  async created() {},
});
</script>

<style type="text/scss" lang="scss">
.hover-reveal-target .hover-reveal {
  display: none !important;
}

.hover-reveal-target:hover .hover-reveal {
  display: block !important;
}

.custom-control-label {
  width: 100%;
}

// .list-item {
//   display: inline-block;
//   margin-right: 10px;
// }
.list-enter-active,
.list-leave-active {
  transition: all 0.4s;
}
.list-enter, .list-leave-to /* .list-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateX(30px);
}
</style>
