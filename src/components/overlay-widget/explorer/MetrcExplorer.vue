<template>
  <div>
    <div class="grid grid-cols-3 gap-8">
      <template v-if="explorer.status === ExplorerStatus.INITIAL">
        <div class="col-span-3 flex flex-col items-center">
          <b-input-group class="max-w-lg">
            <template #prepend>
              <b-form-select v-model="targetType">
                <b-form-select-option
                  :value="targetTypeOption.value"
                  v-for="targetTypeOption of targetTypeOptions"
                  v-bind:key="targetTypeOption.value"
                >
                  {{ targetTypeOption.readableText }}
                </b-form-select-option>
              </b-form-select>
            </template>
            <b-form-input
              v-model="queryString"
              :placeholder="queryStringPlaceholder"
            ></b-form-input>
            <template #append>
              <b-button variant="primary" @click="submitQuery()">GO</b-button>
            </template>
          </b-input-group>
        </div>
      </template>
      <div class="flex flex-col items-stretch gap-8">
        <template v-if="explorer.target">
          <template v-if="targetType === ExplorerTargetType.PACKAGE">
            <package-card :pkg="explorer.target"></package-card>
          </template>
          <template v-if="targetType === ExplorerTargetType.PLANT_BATCH">
            <plant-batch-card :plantBatch="explorer.target"></plant-batch-card>
          </template>
          <template v-if="targetType === ExplorerTargetType.OUTGOING_TRANSFER">
            <outgoing-transfer-card :outgoingTransfer="explorer.target"></outgoing-transfer-card>
          </template>
        </template>

        <b-button
          v-if="explorer.status !== ExplorerStatus.INITIAL"
          variant="outline-danger"
          @click="reset()"
          >RESET</b-button
        >

        <template v-if="explorer.status === ExplorerStatus.INFLIGHT">
          <b-spinner></b-spinner>
        </template>

        <div
          v-if="explorer.statusMessage"
          v-bind:class="[explorer.status === ExplorerStatus.ERROR ? 'text-red-500' : '']"
        >
          {{ explorer.statusMessage }}
        </div>

        <recent-explorer-queries></recent-explorer-queries>
      </div>
      <div class="col-span-2">
        <smart-history v-if="explorer.history"></smart-history>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { HistoryTreeNodeType } from "@/consts";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  ExplorerActions,
  ExplorerStatus,
  ExplorerTargetType,
} from "@/store/page-overlay/modules/explorer/consts";
import { ExplorerTarget } from "@/store/page-overlay/modules/explorer/interfaces";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import OutgoingTransferCard from "./OutgoingTransferCard.vue";
import PackageCard from "./PackageCard.vue";
import PlantBatchCard from "./PlantBatchCard.vue";
import RecentExplorerQueries from "./RecentExplorerQueries.vue";
import SmartHistory from "./SmartHistory.vue";

export default Vue.extend({
  name: "MetrcExplorer",
  store,
  router,
  props: {},
  components: {
    PackageCard,
    PlantBatchCard,
    SmartHistory,
    OutgoingTransferCard,
    RecentExplorerQueries,
  },
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
    queryString: {
      get(): ExplorerTarget | null {
        return this.$store.state.explorer.queryString;
      },
      set(queryString: string) {
        this.$store.dispatch(`explorer/${ExplorerActions.SET_QUERY}`, {
          queryString: queryString.trim() || "",
        });
      },
    },
    targetType: {
      get(): ExplorerTargetType {
        return this.$store.state.explorer.targetType;
      },
      set(targetType: ExplorerTargetType) {
        this.$store.dispatch(`explorer/${ExplorerActions.SET_TARGET_TYPE}`, {
          targetType,
        });
      },
    },
    queryStringPlaceholder(): string {
      switch (this.targetType) {
        case ExplorerTargetType.PACKAGE:
          return "Package tag";
        case ExplorerTargetType.INCOMING_TRANSFER:
        case ExplorerTargetType.OUTGOING_TRANSFER:
          return "Manifest #";
        case ExplorerTargetType.PLANT:
          return "Plant tag";
        case ExplorerTargetType.PLANT_BATCH:
          return "Plant batch name/tag";
        default:
          console.error("Bad target type for placeholder");
          return "";
      }
    },
  },
  data() {
    return {
      ExplorerStatus,
      ExplorerTargetType,
      HistoryTreeNodeType,
      targetTypeOptions: [
        {
          value: ExplorerTargetType.PACKAGE,
          readableText: "Package",
        },
        {
          value: ExplorerTargetType.PLANT_BATCH,
          readableText: "Plant Batch",
        },
        // {
        //   value: ExplorerTargetType.INCOMING_TRANSFER,
        //   readableText: "Incoming Transfer",
        // },
        {
          value: ExplorerTargetType.OUTGOING_TRANSFER,
          readableText: "Outgoing Transfer",
        },
      ],
    };
  },
  methods: {
    ...mapActions({
      submitQuery: `explorer/${ExplorerActions.SUBMIT_QUERY}`,
      reset: `explorer/${ExplorerActions.RESET}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
