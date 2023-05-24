<template>
  <div>
    <div class="grid grid-cols-3 w-full">
      <div class="flex flex-col gap-2 items-stretch">
        <b-button variant="outline-primary" v-b-toggle="'collapse-1'"
          >Employees ({{ employeeSamples.employees.length }})</b-button
        >

        <b-collapse id="collapse-1" class="h-auto" style="transition: none !important">
          <b-card>
            <pre>{{ JSON.stringify(employeeSamples.employees, null, 2) }}</pre>
          </b-card>
        </b-collapse>

        <b-button variant="outline-primary" v-b-toggle="'collapse-2'"
          >Available Samples ({{ employeeSamples.availableSamplePackages.length }})</b-button
        >

        <b-collapse id="collapse-2" class="h-auto" style="transition: none !important">
          <b-card>
            <pre>{{ JSON.stringify(employeeSamples.availableSamplePackages, null, 2) }}</pre>
          </b-card>
        </b-collapse>
      </div>
    </div>
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
    }),
  },
  async created() {},
  async mounted() {
    this.loadObjects();
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
