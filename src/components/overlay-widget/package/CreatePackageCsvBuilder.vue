<template>
  <div>
    <b-button @click="generateCsvTemplate()">DOWNLOAD TEMPLATE</b-button>
    <b-form-file v-model="csvFile" accept=".csv"></b-form-file>
    {{ createPackageCsvState.csvData }}
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { CreatePackageCsvActions } from "@/store/page-overlay/modules/create-package-csv/consts";
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
      csvFile: null,
    };
  },
  methods: {
    ...mapActions({
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
