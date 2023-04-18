<template>
  <div>
    <div class="grid grid-cols-3 gap-8 w-full">
      <template v-if="explorer.status === ExplorerStatus.INITIAL">
        <div class="col-span-3 flex flex-col items-center">
          <b-input-group class="max-w-xl">
            <template #prepend>
              <b-form-select v-model="targetType">
                <b-form-select-option
                  :value="targetTypeOption.value"
                  :disabled="targetTypeOption.disabled"
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

        <template v-if="explorer.status !== ExplorerStatus.INITIAL">
          <b-button variant="outline-danger" @click="reset()">RESET</b-button>

          <template v-if="explorer.status === ExplorerStatus.INFLIGHT">
            <div class="flex flex-row items-center justify-center gap-2">
              <b-spinner small class="ttt-purple"></b-spinner>
              <span>Loading...</span>
            </div>
          </template>

          <div
            class="text-center"
            v-if="explorer.statusMessage"
            v-bind:class="[explorer.status === ExplorerStatus.ERROR ? 'text-red-500' : '']"
          >
            {{ explorer.statusMessage }}
          </div>

          <template v-if="explorer.status === ExplorerStatus.ERROR">
            <div class="text-red-500 flex flex-col gap-2">
              <span>Things to check:</span>
              <ul class="ml-2 list-disc">
                <li><b>Ensure your search type is correct.</b> (Package, Plant, etc)</li>
                <li>
                  <b> Ensure your search text exactly matches your object.</b> Partial tags or
                  manifest #'s will not work.
                </li>
                <li>
                  <b>Ensure you have access to this object.</b> This account might not be able to
                  see this object.
                </li>
              </ul>
            </div>
          </template>

          <recent-explorer-queries></recent-explorer-queries>
        </template>
      </div>
      <div class="col-span-2">
        <smart-history v-if="explorer.history"></smart-history>
      </div>
      <template v-if="explorer.status === ExplorerStatus.INITIAL">
        <div class="col-span-3 flex flex-col items-center">
          <recent-explorer-queries></recent-explorer-queries>
        </div>
      </template>
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
          return "Package tag (1A4400005000000000001234)";
        case ExplorerTargetType.INCOMING_TRANSFER:
        case ExplorerTargetType.OUTGOING_TRANSFER:
          return "Manifest # (0000012345)";
        case ExplorerTargetType.PLANT:
          return "Plant tag (1A4400005000000000001234)";
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
          value: ExplorerTargetType.PLANT,
          readableText: "Plant",
          disabled: true,
        },
        {
          value: ExplorerTargetType.PLANT_BATCH,
          readableText: "Plant Batch",
        },
        {
          value: ExplorerTargetType.HARVEST,
          readableText: "Harvest",
          disabled: true,
        },
        {
          value: ExplorerTargetType.INCOMING_TRANSFER,
          readableText: "Incoming Transfer",
          disabled: true,
        },
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
