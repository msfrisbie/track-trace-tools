<template>
  <div class="rounded-md border border-solid ttt-purple-border overflow-hidden">
    <div class="flex flex-col items-stretch gap-1 p-2 ttt-purple-bg text-white">
      <div class="flex flex-row items-center justify-between gap-2">
        <span>
          <div>{{ harvest.LicenseNumber }}</div>
        </span>

        <b-badge :variant="getBadgeVariant(harvest.HarvestState)">{{
          harvest.HarvestState
        }}</b-badge>
      </div>
    </div>

    <hr />
    <div
      class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap overflow-x-auto"
    >
      <picker-icon
        icon="cut"
        style="width: 5rem"
        class="flex-shrink-0"
        :text="`${harvest.TotalWetWeight}${harvest.UnitOfWeightAbbreviation}`"
        link=""
      />

      <picker-card
        class="flex-grow"
        :title="`${harvest.Name}`"
        :label="`${harvest.HarvestStartDate}`"
      />
    </div>
  </div>
</template>

<script lang="ts">
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import PickerIcon from "@/components/overlay-widget/shared/PickerIcon.vue";
import { HarvestState, TransferState } from "@/consts";
import { IIndexedHarvestData, IIndexedTransferData } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { unitOfMeasureNameToAbbreviation } from "@/utils/units";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "HarvestCard",
  store,
  router,
  props: {
    harvest: Object as () => IIndexedHarvestData,
  },
  components: {
    PickerCard,
    PickerIcon,
  },
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    unitOfMeasureNameToAbbreviation,
    getBadgeVariant(harvestState: HarvestState): string {
      switch (harvestState) {
        case HarvestState.ACTIVE:
          return "success";
        case HarvestState.INACTIVE:
          return "danger";
        default:
          return "light";
      }
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
