<template>
  <div>
    <div class="flex flex-row justify-between items-center space-x-6 cursor-pointer p-4">
      <picker-card
        class="flex-grow"
        :title="`${pkg.Quantity} ${pkg.Item.UnitOfMeasureName} ${pkg.Item.Name}`"
        :label="pkg.Label"
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
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import { IIndexedPackageData, IPackageData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { searchManager } from "@/modules/search-manager.module";
import { MutationType } from "@/mutation-types";
import {
  TransferBuilderActions,
  TRANSFER_BUILDER,
} from "@/store/page-overlay/modules/transfer-builder/consts";
import { remove } from "lodash-es";
import { async } from "rxjs";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
export default Vue.extend({
  name: "PackageManifestCartPackagePreview",
  components: {
    PickerCard,
  },
  props: {
    pkg: Object as () => IPackageData,
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
  },
});
</script>
