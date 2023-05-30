<template>
  <div>
    <!-- <div class="grid grid-cols-3 w-full"> -->
    <div class="flex flex-col gap-2 items-stretch w-full">
      <template v-if="employeeSamples.loadInflight">
        <div class="flex flex-row justify-center items-center gap-2">
          <b-spinner small></b-spinner>
          <div>Loading...</div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-3 gap-8">
          <div class="flex flex-col items-stretch gap-4">
            <b-button variant="primary" @click="allocateSamples()">ALLOCATE SAMPLES</b-button>

            <b-button variant="outline-primary" v-b-toggle="'collapse-1'"
              >Employees ({{ employeeSamples.employees.length }})</b-button
            >

            <b-collapse id="collapse-1" class="h-auto" style="transition: none !important">
              <b-card
                ><div class="grid grid-cols-1 gap-8">
                  <b-form-checkbox
                    v-for="employee of employeeSamples.employees"
                    v-bind:key="employee.Id"
                    size="sm"
                    :checked="employeeSamples.selectedEmployeeIds.includes(employee.Id)"
                    @change="toggleEmployee({ employeeId: employee.Id })"
                  >
                    {{ employee.FullName }}
                  </b-form-checkbox>
                </div>
              </b-card>
            </b-collapse>

            <b-button variant="outline-primary" v-b-toggle="'collapse-2'"
              >Packages ({{ employeeSamples.availableSamplePackages.length }})</b-button
            >

            <b-collapse id="collapse-2" class="h-auto" style="transition: none !important">
              <b-card
                ><div class="grid grid-cols-1 gap-8">
                  <b-form-checkbox
                    v-for="pkg of employeeSamples.availableSamplePackages"
                    v-bind:key="pkg.Id"
                    size="sm"
                    :checked="employeeSamples.selectedSamplePackageIds.includes(pkg.Id)"
                    @change="togglePackage({ packageId: pkg.Id })"
                  >
                    {{ pkg.Label }} ({{ pkg.Item.Name }})
                  </b-form-checkbox>
                </div>
              </b-card>
            </b-collapse>
          </div>

          <div class="col-span-2 flex flex-col items-stretch gap-4">
            <template v-if="employeeSamples.pendingAllocationBuffer.length === 0">
              <div>No pending sample adjustments.</div>
            </template>

            <template v-else>
              <b-card
                v-for="sampleAllocation of employeeSamples.pendingAllocationBuffer"
                v-bind:key="sampleAllocation.employee.Id + '_' + sampleAllocation.pkg.Id"
              >
                {{ sampleAllocation.employee.FullName }}
                {{ sampleAllocation.pkg.Label }}
                {{ sampleAllocation.pkg.adjustmentQuantity }}
              </b-card>
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
import { mapActions, mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { EmployeeSamplesActions } from "@/store/page-overlay/modules/employee-samples/consts";
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
  },
  data() {
    return {};
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
