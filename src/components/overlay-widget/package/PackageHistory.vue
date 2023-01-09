<template>
  <div class="flex flex-col items-stretch w-full h-full">
    <template v-if="!sourcePackage">
      <single-package-picker
        class=""
        :selectedPackages="sourcePackage ? [sourcePackage] : []"
        v-on:removePackage="setPackage({ pkg: null })"
        v-on:addPackage="setPackage({ pkg: $event })"
        :selectAllPackageTypes="true"
      ></single-package-picker>
    </template>
    <template v-else>
      <div class="flex flex-col">
        <div class="col-span-3 flex flex-col gap-4 items-center">
          <b-card>
            <div class="w-full flex flex-row items-center justify-start space-x-4">
              <picker-icon
                icon="box"
                style="width: 5rem"
                class="flex-shrink-0"
                :textClass="sourcePackage.Quantity === 0 ? 'text-red-500' : ''"
                :text="`${sourcePackage.Quantity} ${unitOfMeasureNameToAbbreviation(
                  sourcePackage.Item.UnitOfMeasureName
                )}`"
              />

              <picker-card
                class="flex-grow"
                :title="`${sourcePackage.Item.Name}`"
                :label="sourcePackage.Label"
              />
            </div>
          </b-card>

          <div v-if="status === 'INFLIGHT'" class="flex flex-row items-center gap-2">
            <b-spinner small></b-spinner>
            <span>Building history...</span>
          </div>
          <div v-if="status === 'ERROR'" class="text-red-500">
            <span>Something went wrong while generating the history. See log for detail.</span>
          </div>

          <b-button
            v-if="status === 'SUCCESS' || status === 'ERROR'"
            @click="setPackage({ pkg: null })"
            variant="primary"
          >
            RESET
          </b-button>
        </div>
        <b-tabs pills align="center">
          <b-tab title="Package History Tree" active>
            <div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <package-history-tile :ancestorTree="ancestorTree"></package-history-tile>
            </div>
          </b-tab>
          <b-tab title="Package History List">
            <div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <div v-for="label of ancestorList.map((x) => x.label)" v-bind:key="label">
                {{ label }}
              </div>
            </div>
          </b-tab>
          <b-tab title="Child Package Tree"
            ><div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <package-history-tile :childTree="childTree"></package-history-tile>
            </div>
          </b-tab>
          <b-tab title="Child Package List"
            ><div class="flex flex-col items-start overflow-auto toolkit-scroll">
              <div v-for="label of childList.map((x) => x.label)" v-bind:key="label">
                {{ label }}
              </div>
            </div>
          </b-tab>
          <b-tab title="Source Harvests">
            <pre class="flex flex-col items-start overflow-auto toolkit-scroll">{{
              JSON.stringify(sourceHarvests, null, 2)
            }}</pre>
          </b-tab>
          <b-tab title="Log"
            ><div class="flex flex-col items-stretch gap-2">
              <div v-for="entry of log" v-bind:key="entry">
                {{ entry }}
              </div>
            </div>
          </b-tab>
        </b-tabs>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageHistoryTile from "@/components/overlay-widget/shared/PackageHistoryTile.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import SinglePackagePicker from "@/components/overlay-widget/shared/SinglePackagePicker.vue";
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import {
  PackageHistoryActions,
  PackageHistoryGetters,
} from "@/store/page-overlay/modules/package-history/consts";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackageHistory",
  store,
  router,
  props: {},
  components: {
    SinglePackagePicker,
    PackageHistoryTile,
    PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState<IPluginState>({
      sourcePackage: (state: IPluginState) => state.packageHistory.sourcePackage,
      ancestorTree: (state: IPluginState) => state.packageHistory.ancestorTree,
      childTree: (state: IPluginState) => state.packageHistory.childTree,
      sourceHarvests: (state: IPluginState) => state.packageHistory.sourceHarvests,
      status: (state: IPluginState) => state.packageHistory.status,
      log: (state: IPluginState) => state.packageHistory.log,
    }),
    ...mapGetters({
      ancestorList: `packageHistory/${PackageHistoryGetters.ANCESTOR_LIST}`,
      childList: `packageHistory/${PackageHistoryGetters.CHILD_LIST}`,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      setPackage: `packageHistory/${PackageHistoryActions.SET_SOURCE_PACKAGE}`,
    }),
    unitOfMeasureNameToAbbreviation,
  },
  async created() {},
  async mounted() {},
  async destroyed() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
