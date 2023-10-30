<template>
  <b-button-group>
    <b-button
      variant="light"
      v-for="(csvFile, index) in csvFiles"
      :key="csvFile.name"
      @click="download(csvFile)"
      >{{ index + 1 }} of {{ csvFiles.length }}</b-button
    >
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { downloadCsvFile } from '@/utils/csv';
import { ICsvFile } from '@/interfaces';

export default Vue.extend({
  name: 'CsvBreakout',
  store,
  router,
  props: {
    csvFiles: Array as () => ICsvFile[],
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    download(csvFile: ICsvFile) {
      downloadCsvFile({ csvFile, delay: 500 });
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
