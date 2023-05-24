"
<template>
  <div style="height: 100%; position: relative" class="bg-purple-50">
    <template v-if="transferPackageList.length">
      <div style="height: 100%" class="flex flex-col overflow-y-scroll toolkit-scroll">
        <div class="flex flex-col space-y-2">
          <!-- <div class="mt-4 text-xl text-center text-gray-500 font-bold">
            {{ transferPackageList.length }} packages in cart
          </div> -->

          <package-manifest-cart-package-preview
            v-for="pkg in transferPackageList"
            :key="pkg.Label"
            :pkg="pkg"
          />

          <!-- Spacer for absolutely positioned button -->
          <div style="height: 80px"></div>
        </div>
      </div>

      <div
        style="position: absolute; bottom: 0; width: 100%"
        class="flex flex-row justify-center items-center p-2 bg-purple-50"
      >
        <b-button
          @click.stop.prevent="startTransfer()"
          class="flex-grow"
          size="md"
          variant="success"
          >TRANSFER {{ transferPackageList.length }} PACKAGES</b-button
        >
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import PackageManifestCartPackagePreview from "@/components/package-search-widget/PackageManifestCartPackagePreview.vue";
import { MessageType, ModalAction, ModalType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import { TransferBuilderGetters } from "@/store/page-overlay/modules/transfer-builder/consts";
import Vue from "vue";
import { mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "PackageManifestCart",
  components: { PackageManifestCartPackagePreview },
  data() {
    return {};
  },
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
    }),
    ...mapGetters({
      transferPackageList: `transferBuilder/${TransferBuilderGetters.ACTIVE_PACKAGE_LIST}`,
    }),
  },
  methods: {
    startTransfer() {
      analyticsManager.track(MessageType.STARTED_TRANSFER_FROM_TOOLKIT_SEARCH, {});
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/transfer-builder",
      });
    },
  },
  watch: {},
  mounted() {},
});
</script>
