<template>
  <div class="flex flex-column-shim flex-col space-y-6">
    <b-form>
      <b-form-group>
        <b-form-checkbox
          id="checkbox-backupBuilderSubmits"
          class="mb-2"
          v-model="accountSettings.backupBuilderSubmits"
          name="checkbox-backupBuilderSubmits"
          @change="onChange()"
        >
          Back up toolbox submits
        </b-form-checkbox>
      </b-form-group>
    </b-form>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "ManageAccount",
  store,
  components: {},
  data() {
    return {
      accountSettings: JSON.parse(JSON.stringify(this.$store.state.accountSettings)),
    };
  },
  computed: mapState(["accountEnabled"]),
  methods: {
    onChange() {
      pageManager.pauseFor(3000);

      analyticsManager.track(MessageType.UPDATED_SETTINGS, {
        settings: JSON.parse(JSON.stringify(this.accountSettings)),
      });

      this.$store.commit(MutationType.UPDATE_ACCOUNT_SETTINGS, this.accountSettings);

      toastManager.openToast(`T3 account settings successfully updated`, {
        title: "Updated Account Settings",
        autoHideDelay: 3000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
  },
});
</script>
