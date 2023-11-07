<template>
  <div>
    <div class="flex flex-row justify-between items-center space-x-6 cursor-pointer p-4">
      <picker-card
        class="flex-grow"
        :title="getNormalizedPackageContentsDescription(pkg)"
        :label="getLabelOrError(pkg)"
      />

      <b-button
        variant="link"
        size="md"
        class="text-red-500 hover:text-red-800 opacity-50 p-2"
        @click.stop.prevent="removePackage({ pkg })"
        >&#x2715;</b-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import PickerCard from '@/components/overlay-widget/shared/PickerCard.vue';
import { IIndexedPackageData } from '@/interfaces';
import { TransferBuilderActions } from '@/store/page-overlay/modules/transfer-builder/consts';
import { getLabelOrError, getNormalizedPackageContentsDescription } from '@/utils/package';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  name: 'PackageManifestCartPackagePreview',
  components: {
    PickerCard,
  },
  props: {
    pkg: Object as () => IIndexedPackageData,
  },
  async created() {},
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
    }),
  },
  methods: {
    ...mapActions({
      removePackage: `transferBuilder/${TransferBuilderActions.REMOVE_PACKAGE}`,
    }),
    getNormalizedPackageContentsDescription,
    getLabelOrError,
  },
});
</script>
