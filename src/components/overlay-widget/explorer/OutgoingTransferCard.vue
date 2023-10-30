<template>
  <div class="rounded-md border border-solid ttt-purple-border overflow-hidden">
    <div class="flex flex-col items-stretch gap-1 p-2 ttt-purple-bg text-white">
      <div class="flex flex-row items-center justify-between gap-2">
        <span>
          <div>{{ outgoingTransfer.LicenseNumber }}</div>
        </span>

        <b-badge :variant="getBadgeVariant(outgoingTransfer.TransferState)">{{
          outgoingTransfer.TransferState
        }}</b-badge>
      </div>
    </div>

    <hr />
    <div
      class="p-2 flex flex-row items-center justify-start space-x-4 text-sm whitespace-nowrap overflow-x-auto"
    >
      <picker-icon icon="truck" style="width: 5rem" class="flex-shrink-0" text="" link="" />

      <picker-card
        class="flex-grow"
        :title="`Manifest # ${outgoingTransfer.ManifestNumber}`"
        :label="`${outgoingTransfer.PackageCount} packages`"
      />
    </div>
  </div>
</template>

<script lang="ts">
import PickerCard from '@/components/overlay-widget/shared/PickerCard.vue';
import PickerIcon from '@/components/overlay-widget/shared/PickerIcon.vue';
import { TransferState } from '@/consts';
import { IIndexedTransferData } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { unitOfMeasureNameToAbbreviation } from '@/utils/units';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'OutgoingTransferCard',
  store,
  router,
  props: {
    outgoingTransfer: Object as () => IIndexedTransferData,
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
    getBadgeVariant(outgoingTransferState: TransferState): string {
      switch (outgoingTransferState) {
        case TransferState.OUTGOING:
          return 'success';
        case TransferState.REJECTED:
          return 'danger';
        case TransferState.OUTGOING_INACTIVE:
          return 'light';
        default:
          return 'light';
      }
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
