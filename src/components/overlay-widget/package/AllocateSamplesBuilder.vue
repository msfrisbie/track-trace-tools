<template>
  <div>
    <!-- <div class="grid grid-cols-3 w-full"> -->
    <div class="flex flex-col gap-2 items-stretch w-full">
      <template v-if="employeeSamples.state === EmployeeSamplesState.LOADING">
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
              :disabled="employeeSamples.state === EmployeeSamplesState.ALLOCATION_INFLIGHT"
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
                      <div>Received {{ pkg.ReceivedDateTime }}</div>
                    </div>
                  </b-form-checkbox>
                </div>
              </b-card>
            </b-collapse>
          </div>

          <div class="col-span-2 flex flex-col items-stretch gap-4">
            <template v-if="employeeSamples.state === EmployeeSamplesState.ALLOCATION_INFLIGHT">
              <div class="flex flex-row justify-center items-center gap-2">
                <b-spinner small></b-spinner>
                <div>Generating sample allocations...</div>
              </div>
            </template>

            <template v-if="employeeSamples.state === EmployeeSamplesState.ALLOCATION_SUCCESS">
              <template v-if="employeeSamples.pendingAllocationBuffer.length === 0">
                <div class="text-center">No pending sample adjustments.</div>
              </template>

              <template v-else>
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

            <template v-if="employeeSamples.state === EmployeeSamplesState.ALLOCATION_ERROR">
              <div class="text-center text-red-500">Something went wrong</div>
            </template>
          </div>
        </div>
      </template>

      <!-- <b-button variant="outline-primary" v-b-toggle="'collapse-2'"
          >Unallocated Samples ({{ employeeSamples.availableSamplePackages.length }})</b-button
        >

        <b-collapse id="collapse-2" class="h-auto" style="transition: none !important">
          <b-card>
            <pre>{{ JSON.stringify(employeeSamples.availableSamplePackages, null, 2) }}</pre>
          </b-card>
        </b-collapse>

        <b-button variant="outline-primary" v-b-toggle="'collapse-3'"
          >30 day modified samples ({{ employeeSamples.modifiedSamples.length }})</b-button
        >

        <b-collapse id="collapse-3" class="h-auto" style="transition: none !important">
          <b-card>
            <pre>{{ JSON.stringify(employeeSamples.modifiedSamples, null, 2) }}</pre>
          </b-card>
        </b-collapse> -->

      <!-- 
        A producer or marijuana sales location is limited to transferring: 
        
        a total of 1 ounce of marijuana, 
        a total of 6grams of marijuana concentrate, and 
        marijuana-infused products with a total THC content of 2000 mgs 
        
        of internal product samples to each of its employees in a
        30-day period. 
        -->
    </div>
    <!-- </div> -->
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
import { IPluginState } from "@/interfaces";

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
  },
  data() {
    return {
      EmployeeSamplesState,
    };
  },
  methods: {
    ...mapActions({
      loadObjects: `employeeSamples/${EmployeeSamplesActions.LOAD_OBJECTS}`,
      allocateSamples: `employeeSamples/${EmployeeSamplesActions.ALLOCATE_SAMPLES}`,
      toggleEmployee: `employeeSamples/${EmployeeSamplesActions.TOGGLE_EMPLOYEE}`,
      togglePackage: `employeeSamples/${EmployeeSamplesActions.TOGGLE_PACKAGE}`,
    }),
  },
  async created() {},
  async mounted() {
    this.loadObjects();
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
