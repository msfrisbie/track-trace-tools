"<template>
  <div style="height: 100%; position: relative" class="bg-blue-50">
    <template v-if="transferPackageList.packages.length">
      <div
        style="height: 100%"
        class="flex flex-col overflow-y-scroll toolkit-scroll"
      >
        <div class="flex flex-col space-y-2">
          <!-- <div class="mt-4 text-xl text-center text-gray-500 font-bold">
            {{ transferPackageList.packages.length }} packages in cart
          </div> -->

          <package-manifest-cart-package-preview
            v-for="pkg in transferPackageList.packages"
            :key="pkg.Label"
            :pkg="pkg"
          />

          <!-- Spacer for absolutely positioned button -->
          <div style="height: 80px"></div>
        </div>
      </div>

      <div
        style="position: absolute; bottom: 0; width: 100%"
        class="flex flex-row justify-center items-center p-2 bg-blue-50"
      >
        <b-button
          @click.stop.prevent="startTransfer()"
          class="flex-grow"
          size="md"
          variant="success"
          >TRANSFER {{ transferPackageList.packages.length }} PACKAGES</b-button
        >
      </div>
    </template>
  </div>
</template>


<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { mapGetters, mapState } from "vuex";
import { authManager } from "@/modules/auth-manager.module";
import { MutationType } from "@/mutation-types";
import PackageManifestCartPackagePreview from "@/components/package-search-widget/PackageManifestCartPackagePreview.vue";
import { pageManager } from "@/modules/page-manager.module";
import { MessageType, ModalAction, ModalType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { modalManager } from "@/modules/modal-manager.module";
import {
  TransferBuilderGetters,
  TRANSFER_BUILDER,
} from "@/store/page-overlay/modules/transfer-builder/consts";
import { PluginAuthGetters } from "@/store/page-overlay/modules/plugin-auth/consts";
import { IPluginState } from "@/interfaces";

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
      analyticsManager.track(
        MessageType.STARTED_TRANSFER_FROM_TOOLKIT_SEARCH,
        {}
      );
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/transfer/create-transfer",
      });
    },
  },
  watch: {},
  mounted() {},
});
</script>