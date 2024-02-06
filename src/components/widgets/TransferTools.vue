<template>
  <div class="m-2 flex flex-row gap-4">
    <b-button @click="fillGoogleMapsDirections()" size="sm" variant="outline-primary"
      >FILL GOOGLE MAPS DIRECTIONS</b-button
    >
    <b-button @click="setSameSiteTransfer()" size="sm" variant="outline-primary"
      >SET AS SAME-SITE TRANSFER</b-button
    >
    <!-- TODO recently used -->
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ExampleActions, ExampleGetters } from "@/store/page-overlay/modules/example/consts";
import {
  TransferToolsActions,
  TransferToolsMutations,
} from "@/store/page-overlay/modules/transfer-tools/consts";
import { activeMetrcModalOrNull } from "@/utils/metrc-modal";
import _ from "lodash-es";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "TransferTools",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
    }),
    ...mapGetters({
      exampleGetter: `example/${ExampleGetters.EXAMPLE_GETTER}`,
    }),
  },
  data() {
    return {
      modal: null,
      selectedDestination: null,
    };
  },
  methods: {
    ...mapActions({
      exampleAction: `example/${ExampleActions.EXAMPLE_ACTION}`,
    }),
    getElementRefs(): {
      destinationInput: HTMLInputElement | null;
    } {
      return {
        destinationInput: this.$data.modal.querySelector(`[ng-model="destination.RecipientId"]`),
      };
    },
    analyzeModal() {
      const elementRefs = this.getElementRefs();

      // Update all tracked values
      store.commit(`transferTools/${TransferToolsMutations.TRANSFER_TOOLS_MUTATION}`, {
        selectedDestinationLicense: elementRefs.destinationInput?.value,
      });
    },
    async fillGoogleMapsDirections() {
      if (!store.state.transferTools.selectedDestinationLicense) {
        return;
      }

      const authState = await authManager.authStateOrError();

      const origin = store.state.transferTools.destinationFacilities.find(
        (x) => x.LicenseNumber === store.state.transferTools.selectedDestinationLicense
      )?.PhysicalAddress;
      const destination = store.state.transferTools.destinationFacilities.find(
        (x) => x.LicenseNumber === authState.license
      )?.PhysicalAddress;

      if (!origin) {
        return;
      }
      if (!destination) {
        return;
      }

      console.log({ origin, destination });

      //   const { directions } = t3RequestManager.loadDirections({ origin, destination });
    },
    setSameSiteTransfer() {},
  },
  async created() {},
  async mounted() {
    const modal = activeMetrcModalOrNull();

    if (!modal) {
      return;
    }

    this.$data.modal = modal;

    const debouncedHandler = _.debounce(() => this.analyzeModal(), 100);
    const observer = new MutationObserver(() => debouncedHandler());
    observer.observe(modal, { subtree: true, childList: true });

    store.dispatch(`transferTools/${TransferToolsActions.LOAD_TRANSFER_TOOL_DATA}`);
  },
  watch: {
    foobar: {
      immediate: true,
      handler(newValue, oldValue) {},
    },
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
