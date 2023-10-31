<template>
  <div class="backup-content w-full flex flex-column-shim flex-col space-y-6">
    <template v-if="inflight">
      <div class="w-full flex flex-row space-x-2 items-center justify-center">
        <b-spinner small />
        <span>Loading backups...</span>
      </div>
    </template>
    <template v-else>
      <div class="w-full flex flex-row items-center">
        <b-button variant="primary" @click="download()">DOWNLOAD</b-button>
      </div>
      <b-table small :items="backupData"></b-table>
    </template>
  </div>
</template>

<script lang="ts">
import { ICsvFile } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { downloadCsvFile } from "@/utils/csv";
import Vue from "vue";

export default Vue.extend({
  name: "BackupView",
  store,
  data() {
    return {
      backupData: [],
      inflight: false,
    };
  },
  methods: {
    async download() {
      const csvFile: ICsvFile = {
        filename: this.item.filename,
        data: this.$data.backupData,
      };

      await downloadCsvFile({ csvFile, delay: 500 });
    },
  },
  props: {
    item: Object,
  },
  async mounted() {
    this.$data.inflight = true;

    this.$data.inflight = false;
  },
});
</script>

<style></style>
