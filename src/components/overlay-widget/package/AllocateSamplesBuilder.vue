<template>
  <div>
    <div class="flex flex-col gap-2 items-stretch w-full">
      <template v-if="employeeSamples.toolState === EmployeeSamplesState.ERROR">
        <div class="flex flex-row justify-center items-center gap-2">
          <div class="text-center text-red-500">
            Something went wrong. {{ employeeSamples.stateMessage }}
          </div>
          <b-button variant="outline-danger" @click="reset()">RESET</b-button>
        </div>
      </template>

      <template v-if="employeeSamples.toolState === EmployeeSamplesState.LOADING">
        <div class="flex flex-row justify-center items-center gap-2">
          <b-spinner small></b-spinner>
          <div>Loading...</div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-3 gap-8">
          <div class="flex flex-col items-stretch gap-4">
            <b-button
              variant="primary"
              @click="allocateSamples()"
              :disabled="allocateButtonDisabled"
              >CALCULATE EMPLOYEE SAMPLES</b-button
            >

            <b-button variant="outline-primary" v-b-toggle="'collapse-1'"
              >Employees ({{ employeeSamples.employees.length }})</b-button
            >

            <b-collapse id="collapse-1" class="h-auto" style="transition: none !important">
              <b-card
                ><div class="grid grid-cols-1 gap-1">
                  <b-form-checkbox
                    v-for="employee of employeeSamples.employees"
                    v-bind:key="employee.Id"
                    size="sm"
                    :checked="employeeSamples.selectedEmployeeIds.includes(employee.Id)"
                    @change="toggleEmployee({ employeeId: employee.Id })"
                  >
                    <div class="text-xs">{{ employee.FullName }}</div>
                  </b-form-checkbox>
                </div>
              </b-card>
            </b-collapse>

            <b-button variant="outline-primary" v-b-toggle="'collapse-2'"
              >Packages ({{ employeeSamples.availableSamplePackages.length }})</b-button
            >

            <b-collapse id="collapse-2" class="h-auto" style="transition: none !important">
              <b-card
                ><div class="grid grid-cols-1 gap-1">
                  <b-form-checkbox
                    v-for="pkg of employeeSamples.availableSamplePackages"
                    v-bind:key="pkg.Id"
                    size="sm"
                    :checked="employeeSamples.selectedSamplePackageIds.includes(pkg.Id)"
                    @change="togglePackage({ packageId: pkg.Id })"
                  >
                    <div class="text-xs">
                      <div class="font-bold">
                        {{ pkg.Item.Name }} ({{ pkg.Quantity }} {{ pkg.UnitOfMeasureAbbreviation }})
                      </div>
                      <div>
                        {{ pkg.Label }}
                      </div>
                      <div>Received {{ pkg.ReceivedDateTime.split('T')[0] }}</div>
                    </div>
                  </b-form-checkbox>
                </div>
              </b-card>
            </b-collapse>
          </div>

          <div class="col-span-2 flex flex-col items-stretch gap-4">
            <template v-if="employeeSamples.toolState === EmployeeSamplesState.ALLOCATION_INFLIGHT">
              <div class="flex flex-row justify-center items-center gap-2">
                <b-spinner small></b-spinner>
                <div>Generating sample allocations...</div>
              </div>
            </template>

            <template v-if="employeeSamples.toolState === EmployeeSamplesState.ALLOCATION_SUCCESS">
              <template v-if="employeeSamples.pendingAllocationBuffer.length === 0">
                <div class="text-center">No pending sample adjustments.</div>
              </template>

              <template v-else>
                <b-button class="w-full" variant="success" size="md" @click="submit()"
                  >SUBMIT {{ employeeSamples.pendingAllocationBuffer.length }} ADJUSTMENTS</b-button
                >

                <b-button class="opacity-40" variant="light" size="md" @click="downloadAll()"
                  >DOWNLOAD CSVs</b-button
                >

                <b-card v-for="employee of selectedEmployees" v-bind:key="employee.Id">
                  <div class="grid grid-cols-2 gap-8">
                    <div class="text-lg font-bold">
                      {{ employee.FullName }}
                    </div>
                    <div class="flex flex-col gap-2 text-xs">
                      <div
                        v-for="(
                          sampleAllocation, index
                        ) of employeeSamples.pendingAllocationBuffer.filter(
                          (allocation) => allocation.employee.Id === employee.Id
                        )"
                        v-bind:key="
                          index + '_' + sampleAllocation.employee.Id + '_' + sampleAllocation.pkg.Id
                        "
                      >
                        <div class="font-bold">
                          {{ sampleAllocation.pkg.Item.Name }} ({{
                            sampleAllocation.adjustmentQuantity
                          }}
                          {{ sampleAllocation.pkg.UnitOfMeasureAbbreviation }})
                        </div>
                        <div>
                          {{ sampleAllocation.pkg.Label }}
                        </div>
                        <div v-if="sampleAllocation.flowerAllocationGrams > 0">
                          {{ Number(sampleAllocation.flowerAllocationGrams.toFixed(3)) }}g flower
                        </div>
                        <div v-if="sampleAllocation.concentrateAllocationGrams > 0">
                          {{ Number(sampleAllocation.concentrateAllocationGrams.toFixed(3)) }}g
                          concentrate
                        </div>
                        <div v-if="sampleAllocation.infusedAllocationGrams > 0">
                          {{
                            Number((sampleAllocation.infusedAllocationGrams * 1000).toFixed(3))
                          }}mg infused
                        </div>
                      </div>
                    </div>
                  </div>
                </b-card>
              </template>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  EmployeeSamplesActions,
  EmployeeSamplesGetters,
  EmployeeSamplesState,
} from "@/store/page-overlay/modules/employee-samples/consts";
import {
  IAdjustPackageReason,
  ICsvFile,
  IMetrcAddPackageNoteData,
  IMetrcAdjustPackagePayload,
  IMetrcFinishPackagesPayload,
  IPackageData,
  IPluginState,
  IUnitOfMeasure,
} from "@/interfaces";
import { builderManager } from "@/modules/builder-manager.module";
import { buildCsvDataOrError, buildNamedCsvFileData, downloadCsvFile } from "@/utils/csv";
import { submitDateFromIsodate, todayIsodate } from "@/utils/date";
import { BuilderType, MessageType } from "@/consts";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";
import { ISampleAllocation } from "@/store/page-overlay/modules/employee-samples/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { sum } from "lodash";

export default Vue.extend({
  name: "AllocateSamplesBuilder",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      employeeSamples: (state: IPluginState) => state.employeeSamples,
    }),
    ...mapGetters({
      selectedEmployees: `employeeSamples/${EmployeeSamplesGetters.SELECTED_EMPLOYEES}`,
      selectedSamplePackages: `employeeSamples/${EmployeeSamplesGetters.SELECTED_SAMPLE_PACKAGES}`,
    }),
    csvFiles(): ICsvFile[] {
      // @ts-ignore
      return this.buildCsvFiles();
    },
    allocateButtonDisabled(): boolean {
      if (
        this.$store.state.employeeSamples.toolState === EmployeeSamplesState.ALLOCATION_INFLIGHT
      ) {
        return true;
      }

      if (this.$store.state.employeeSamples.selectedEmployeeIds.length === 0) {
        return true;
      }

      if (this.$store.state.employeeSamples.selectedSamplePackageIds.length === 0) {
        return true;
      }

      return false;
    },
  },
  data() {
    return {
      unitsOfMeasure: [],
      adjustmentReasons: [],
      builderType: BuilderType.ADJUST_PACKAGE,
      EmployeeSamplesState,
    };
  },
  methods: {
    ...mapActions({
      reset: `employeeSamples/${EmployeeSamplesActions.RESET}`,
      allocateSamples: `employeeSamples/${EmployeeSamplesActions.ALLOCATE_SAMPLES}`,
      toggleEmployee: `employeeSamples/${EmployeeSamplesActions.TOGGLE_EMPLOYEE}`,
      togglePackage: `employeeSamples/${EmployeeSamplesActions.TOGGLE_PACKAGE}`,
    }),
    async submit() {
      const rows: IMetrcAdjustPackagePayload[] = [];

      const adjustmentReasons = await dynamicConstsManager.adjustPackageReasons();
      const unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

      for (let sampleAllocation of this.$store.state.employeeSamples
        .pendingAllocationBuffer as ISampleAllocation[]) {
        const row = {
          AdjustmentDate: submitDateFromIsodate(todayIsodate()),
          AdjustmentQuantity: (-1 * sampleAllocation.adjustmentQuantity).toString(),
          AdjustmentReasonId: adjustmentReasons
            .find((x) => x.Name.includes("Trade Sample"))!
            .Id.toString(),
          Id: sampleAllocation.pkg.Id.toString(),
          AdjustmentUnitOfMeasureId: sampleAllocation.pkg.UnitOfMeasureId.toString(),
          CurrentQuantity: sampleAllocation.pkg.Quantity.toString(),
          CurrentQuantityUom: unitsOfMeasure.find(
            (x) => x.Id === sampleAllocation.pkg.UnitOfMeasureId
          )!.Name,
          FinishDate: "",
          NewQuantity: (
            sampleAllocation.pkg.Quantity - sampleAllocation.adjustmentQuantity
          ).toString(),
          NewQuantityUom: unitsOfMeasure.find((x) => x.Id === sampleAllocation.pkg.UnitOfMeasureId)!
            .Name,
          ReasonNote: `${sampleAllocation.employee.FullName} ${sampleAllocation.employee.License.Number} ${sampleAllocation.adjustmentQuantity} ${sampleAllocation.pkg.UnitOfMeasureAbbreviation}`,
        };

        rows.push(row);
      }

      builderManager.submitProject(
        rows,
        this.$data.builderType,
        {
          sampleTotal: this.$store.state.employeeSamples.pendingAllocationBuffer.length,
        },
        this.buildCsvFiles(),
        25
      );
    },
    buildCsvFiles(): ICsvFile[] {
      try {
        const csvData = buildCsvDataOrError([
          {
            isVector: true,
            data: (
              this.$store.state.employeeSamples.pendingAllocationBuffer as ISampleAllocation[]
            ).map((x) => x.pkg.Label),
          },
          {
            isVector: true,
            data: (
              this.$store.state.employeeSamples.pendingAllocationBuffer as ISampleAllocation[]
            ).map((x) => -1 * x.adjustmentQuantity),
          },
          {
            isVector: true,
            data: (
              this.$store.state.employeeSamples.pendingAllocationBuffer as ISampleAllocation[]
            ).map(
              (x) =>
                this.$data.unitsOfMeasure.find(
                  (y: IUnitOfMeasure) => y.Id === x.pkg.UnitOfMeasureId
                )!.Name
            ),
          },
          {
            isVector: false,
            data: this.$data.adjustmentReasons.find((x: IAdjustPackageReason) =>
              x.Name.includes("Trade Sample")
            )!.Name,
          },
          {
            isVector: true,
            data: (
              this.$store.state.employeeSamples.pendingAllocationBuffer as ISampleAllocation[]
            ).map(
              (x) =>
                `${x.employee.FullName} ${x.employee.License.Number} ${x.adjustmentQuantity} ${x.pkg.UnitOfMeasureAbbreviation}`
            ),
          },
          {
            isVector: false,
            data: submitDateFromIsodate(todayIsodate()),
          },
          {
            isVector: true,
            data: (
              this.$store.state.employeeSamples.pendingAllocationBuffer as ISampleAllocation[]
            ).map((x) => x.employee.License.Number),
          },
        ]);

        return buildNamedCsvFileData(
          csvData,
          `Adjust ${this.$store.state.employeeSamples.pendingAllocationBuffer.length} samples`
        );
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    async downloadAll() {
      for (let csvFile of this.csvFiles) {
        await downloadCsvFile({ csvFile, delay: 500 });
      }

      analyticsManager.track(MessageType.DOWNLOADED_CSVS, {
        builderType: this.$data.builderType,
        csvData: {
          sampleTotal: this.$store.state.employeeSamples.pendingAllocationBuffer.length,
        },
      });
    },
  },
  async created() {},
  async mounted() {
    this.reset();

    this.$data.unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();
    this.$data.adjustmentReasons = await dynamicConstsManager.adjustPackageReasons();
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
