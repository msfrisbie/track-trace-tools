<template>
  <div>
    <div class="grid grid-cols-3 gap-8 w-full">
      <template v-if="explorer.status === ExplorerStatus.INITIAL">
        <div class="col-span-3 flex flex-col items-center gap-8">
          <div class="flex flex-col items-stretch" style="min-width: 720px">
            <div class="flex flex-row items-center gap-8">
              <b-input-group class="flex-grow">
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

              <b-button variant="outline-dark" @click="showHelp = !showHelp"
                >LEARN&nbsp;MORE</b-button
              >
            </div>
          </div>

          <template v-if="showHelp">
            <div class="max-w-md flex flex-col items-stretch gap-4">
              <div class="font-bold text-lg ttt-purple">What is Metrc Explorer?</div>

              <div>
                The Metrc Explorer allows you to easily navigate around your Metrc "network": all
                the interconnected objects in Metrc.
              </div>

              <div>
                Metrc Explorer will load the object on the left, and its history on the right. It
                can search all your active licenses, not just the one you are currently viewing.
              </div>

              <div>
                Any history entries that link to a different Metrc object will show a button that
                allow you to easily click over to it.
              </div>

              <div class="font-bold text-lg ttt-purple">How do I use Metrc Explorer?</div>

              <div>
                Search for a starting object by its primary type and identifier: (e.g. package tag,
                manifest #, harvest name). Partial identifiers won't work, it must be a full and
                exact match.
              </div>

              <a
                class="text-purple-500 text-center underline"
                href="https://www.youtube.com/watch?v=pETAMIdNQAM"
                target="_blank"
                >DEMO</a
              >

              <b-button variant="outline-dark" @click="showHelp = !showHelp">HIDE</b-button>
            </div>
          </template>
        </div>
      </template>
      <div class="flex flex-col items-stretch gap-8">
        <template v-if="explorer.target">
          <!-- <div class="text-start text-xl text-purple-800 font-bold">Object:</div> -->
          <template v-if="targetType === ExplorerTargetType.PACKAGE">
            <package-card :pkg="explorer.target"></package-card>
          </template>
          <template v-if="targetType === ExplorerTargetType.PLANT_BATCH">
            <plant-batch-card :plantBatch="explorer.target"></plant-batch-card>
          </template>
          <template v-if="targetType === ExplorerTargetType.PLANT">
            <plant-card :plant="explorer.target"></plant-card>
          </template>
          <!-- <template v-if="targetType === ExplorerTargetType.INCOMING_TRANSFER">
            <incoming-transfer-card :incomingTransfer="explorer.target"></incoming-transfer-card>
          </template> -->
          <template v-if="targetType === ExplorerTargetType.OUTGOING_TRANSFER">
            <outgoing-transfer-card :outgoingTransfer="explorer.target"></outgoing-transfer-card>
          </template>
          <template v-if="targetType === ExplorerTargetType.HARVEST">
            <harvest-card :harvest="explorer.target"></harvest-card>
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
        <template v-if="explorer.history">
          <div class="flex flex-col items-stretch gap-8">
            <!-- <div class="text-start text-xl text-purple-800 font-bold">History:</div> -->

            <smart-history></smart-history>
          </div>
        </template>
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
import { HistoryTreeNodeType } from '@/consts';
import { IPluginState } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import {
  ExplorerActions,
  ExplorerStatus,
  ExplorerTargetType,
} from '@/store/page-overlay/modules/explorer/consts';
import { ExplorerTarget } from '@/store/page-overlay/modules/explorer/interfaces';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import OutgoingTransferCard from './OutgoingTransferCard.vue';
import PackageCard from './PackageCard.vue';
import PlantBatchCard from './PlantBatchCard.vue';
import PlantCard from './PlantCard.vue';
import HarvestCard from './HarvestCard.vue';
import RecentExplorerQueries from './RecentExplorerQueries.vue';
import SmartHistory from './SmartHistory.vue';

export default Vue.extend({
  name: 'MetrcExplorer',
  store,
  router,
  props: {},
  components: {
    PackageCard,
    PlantBatchCard,
    HarvestCard,
    PlantCard,
    SmartHistory,
    // IncomingTransferCard,
    OutgoingTransferCard,
    RecentExplorerQueries,
  },
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
    queryString: {
      get(): string | null {
        return store.state.explorer.queryString;
      },
      set(queryString: string) {
        store.dispatch(`explorer/${ExplorerActions.SET_QUERY}`, {
          queryString: queryString.trim() || '',
        });
      },
    },
    targetType: {
      get(): ExplorerTargetType {
        return store.state.explorer.targetType;
      },
      set(targetType: ExplorerTargetType) {
        store.dispatch(`explorer/${ExplorerActions.SET_TARGET_TYPE}`, {
          targetType,
        });
      },
    },
    queryStringPlaceholder(): string {
      switch (this.targetType) {
        case ExplorerTargetType.PACKAGE:
          return 'Package tag (1A4400005000000000001234)';
        // case ExplorerTargetType.INCOMING_TRANSFER:
        case ExplorerTargetType.OUTGOING_TRANSFER:
          return 'Manifest # (0000012345)';
        case ExplorerTargetType.PLANT:
          return 'Plant tag (1A4400005000000000001234)';
        case ExplorerTargetType.PLANT_BATCH:
          return 'Plant batch name/tag';
        case ExplorerTargetType.HARVEST:
          return 'Harvest name';
        default:
          console.error('Bad target type for placeholder');
          return '';
      }
    },
  },
  data() {
    return {
      ExplorerStatus,
      ExplorerTargetType,
      HistoryTreeNodeType,
      showHelp: false,
      targetTypeOptions: [
        {
          value: ExplorerTargetType.PACKAGE,
          readableText: 'Package',
        },
        {
          value: ExplorerTargetType.PLANT,
          readableText: 'Plant',
        },
        {
          value: ExplorerTargetType.PLANT_BATCH,
          readableText: 'Plant Batch',
        },
        {
          value: ExplorerTargetType.HARVEST,
          readableText: 'Harvest',
        },
        // {
        //   value: ExplorerTargetType.INCOMING_TRANSFER,
        //   readableText: "Incoming Transfer",
        // },
        {
          value: ExplorerTargetType.OUTGOING_TRANSFER,
          readableText: 'Outgoing Transfer',
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
