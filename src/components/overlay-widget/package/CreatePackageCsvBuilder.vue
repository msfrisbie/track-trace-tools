<template>
  <div class="grid grid-cols-4 gap-8">
    <div class="h-full">
      <b-button-group vertical>
        <b-button @click="generateCsvTemplate()">DOWNLOAD TEMPLATE</b-button>
        <b-button
          v-if="createPackageCsvState.status === PackageCsvStatus.PARSED"
          @click="reset()"
          variant="warning"
          >RESET</b-button
        >
        <label
          v-if="createPackageCsvState.status === PackageCsvStatus.INITIAL"
          class="btn btn-secondary"
        >
          <b-form-file class="hidden" v-model="csvFile" accept=".csv"></b-form-file>

          UPLOAD CSV
        </label>
      </b-button-group>
    </div>
    <div class="col-span-3 h-full">
      <template v-if="createPackageCsvState.csvData">
        {{ createPackageCsvState.csvData }}
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  CreatePackageCsvActions,
  PackageCsvStatus,
} from "@/store/page-overlay/modules/create-package-csv/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "CreatePackageCsvBuilder",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      createPackageCsvState: (state: IPluginState) => state.createPackageCsv,
    }),
  },
  data() {
    return {
      PackageCsvStatus,
      csvFile: null,
    };
  },
  methods: {
    ...mapActions({
      reset: `createPackageCsv/${CreatePackageCsvActions.RESET}`,
      generateCsvTemplate: `createPackageCsv/${CreatePackageCsvActions.GENERATE_CSV_TEMPLATE}`,
    }),
  },
  async created() {},
  async mounted() {},
  watch: {
    csvFile: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue) {
          return;
        }

        store.dispatch(`createPackageCsv/${CreatePackageCsvActions.IMPORT_CSV}`, {
          file: newValue,
        });
      },
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
