<template>
  <div class="flex flex-col items-center">
    <div class="max-w-md w-full flex flex-col space-y-6">
      <p class="text-lg">
        Privately share Metrc screenshots with a unique link.
        <b>Only people with the link can see the screenshot.</b>
      </p>

      <b-form-checkbox size="md" v-model="hideBeforeScreenshot">
        Hide TTT before taking screenshot
      </b-form-checkbox>

      <b-form-group label="Delay taking screenshot by:" size="md">
        <b-form-select size="md" v-model="delayMs" :options="delayMsOptions"></b-form-select>
      </b-form-group>

      <b-button size="md" variant="primary" @click="takeScreenshot()">TAKE SCREENSHOT</b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import { pageManager } from "@/modules/page-manager.module";
import { screenshotManager } from "@/modules/screenshot-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { timer } from "rxjs";
import Vue from "vue";

export default Vue.extend({
  name: "Screenshot",
  store,
  data() {
    return {
      hideBeforeScreenshot: true,
      delayMs: 0,
      delayMsOptions: [
        {
          text: "0 seconds",
          value: 0,
        },
        {
          text: "3 seconds",
          value: 3000,
        },
        {
          text: "10 seconds",
          value: 100000,
        },
      ],
    };
  },
  methods: {
    async takeScreenshot() {
      // if (!(await accountManager.accountEnabled())) {
      //   // if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
      //   //   // Do Firefox-related activities
      //   //   modalManager.dispatchModalEvent(ModalType.PERMISSIONS);
      //   // } else {
      //   //   messageBus.sendMessageToBackground(MessageType.OPEN_CONNECT_STANDALONE, {});
      //   // }
      //   return;
      // }

      await timer(this.$data.delayMs).toPromise();

      if (this.$data.hideBeforeScreenshot) {
        this.$store.commit(MutationType.SET_EXPANDED_OVERLAY, false);
        pageManager.setExpandedClass();
        modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.CLOSE);
      }

      await screenshotManager.takeScreenshot({
        downloadFile: false,
        useBackground: true,
        useLegacyScreenshot: this.$store.state.settings?.useLegacyScreenshot,
      });
    },
  },
});
</script>
