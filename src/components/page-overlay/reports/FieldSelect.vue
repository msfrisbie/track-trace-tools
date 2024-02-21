<template>
  <fragment>
    <div class="font-semibold text-gray-700">Columns:</div>

    <b-form-checkbox-group
      v-model="selectedFields[reportType]"
      :options="options"
      class="flex flex-col items-start gap-1"
    >
      <!-- <b-form-checkbox
        v-for="fieldData of SHEET_FIELDS[reportType]"
        v-bind:key="fieldData.value"
        :value="fieldData"
        :disabled="fieldData.required"
      >
        <span class="leading-6">{{ fieldData.readableName }}</span>
      </b-form-checkbox> -->
    </b-form-checkbox-group>

    <div class="grid grid-cols-2 gap-2">
      <b-button variant="outline-dark" size="sm" @click="checkAll({ reportType })"
        >CHECK ALL</b-button
      >
      <b-button variant="outline-dark" size="sm" @click="uncheckAll({ reportType })"
        >UNCHECK ALL</b-button
      >
    </div>
  </fragment>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ClientGetters } from "@/store/page-overlay/modules/client/consts";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import {
  ReportsActions,
  ReportType,
  SHEET_FIELDS,
} from "@/store/page-overlay/modules/reports/consts";
import { IFieldData } from "@/store/page-overlay/modules/reports/interfaces";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "FieldSelect",
  store,
  router,
  props: {
    reportType: String as () => ReportType,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      selectedFields: (state: IPluginState) => state.reports.selectedFields,
      allFields: (state: IPluginState) => state.reports.allFields,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
      hasT3plus: `client/${ClientGetters.T3PLUS}`,
    }),
    options(): { text: string; value: IFieldData }[] {
      return store.state.reports.allFields[this.reportType].map((x) => ({
        text: x.readableName,
        value: x,
      }));
    },
  },
  data() {
    return {
      SHEET_FIELDS,
    };
  },
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
      checkAll: `reports/${ReportsActions.CHECK_ALL}`,
      uncheckAll: `reports/${ReportsActions.UNCHECK_ALL}`,
    }),
  },
  async created() {},
  async mounted() {},
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) {},
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
