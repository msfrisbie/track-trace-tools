<template>
  <div>
    <template v-if="explorer.status === ExplorerStatus.INITIAL">
      <b-input-group>
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
        <b-form-input v-model="queryString" :placeholder="queryStringPlaceholder"></b-form-input>
        <template #append>
          <b-button variant="primary" @click="submitQuery()">GO</b-button>
        </template>
      </b-input-group>
    </template>
    <div class="grid grid-cols-3 gap-8">
      <div v-if="explorer.target">
        <template v-if="targetType === ExplorerTargetType.PACKAGE">
          <package-card :pkg="explorer.target"></package-card>
        </template>
        <template v-if="targetType === ExplorerTargetType.PLANT_BATCH">
          <plant-batch-card :plantBatch="explorer.target"></plant-batch-card>
        </template>
      </div>
      <div class="col-span-2" v-if="explorer.history">
        <smart-history></smart-history>
      </div>
      <div class="col-span-3">
        <div>status: {{ explorer.status }}</div>
        <div>statusMessage: {{ explorer.statusMessage }}</div>
        <b-button @click="reset()">RESET</b-button>
        <explorer-history></explorer-history>
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
import ExplorerHistory from "./ExplorerHistory.vue";
import PackageCard from "./PackageCard.vue";
import PlantBatchCard from "./PlantBatchCard.vue";
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
    ExplorerHistory,
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
        {
          value: ExplorerTargetType.INCOMING_TRANSFER,
          readableText: "Incoming Transfer",
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
