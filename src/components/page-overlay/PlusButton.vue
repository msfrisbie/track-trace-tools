<template>
  <div id="plus-popover-target" title="T3+" @click="openBuilder($event)"
    class="cursor-pointer rounded bg-gradient-to-r from-purple-800 hover:from-purple-900 to-purple-400 hover:to-purple-500 flex flex-col items-center justify-center text-xl font-semibold text-white text-center"
    style="width: 100px; height: 52px; border: 1px solid white">
    <span>GET T3+</span>

    <b-popover target="plus-popover-target" triggers="hover" placement="top" variant="light" ref="plus-popover"
      container="popover-container">
      <template #title>
        <div class="flex flex-row items-center space-x-2">
          <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
          <span class="text-base font-bold">T3+</span>
        </div>
      </template>

      <div style="min-width: 200px" class="flex flex-col space-y-2 text-base">
        <p class="font-semibold text-purple-600">
          You're using the free version of Track &amp; Trace Tools.
        </p>

        <p class="font-bold">Why subscribe to T3+?</p>

        <ul class="list-disc pl-3 pb-4">
          <li>Enable advanced reports and tools</li>
          <li>Early access to new features</li>
          <li>Support the open source project</li>
          <li>Hide the bottom right T3+ badge</li>
        </ul>

        <b-button variant="primary" @click="openBuilder($event)">LEARN MORE</b-button>
      </div>
    </b-popover>
  </div>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "PlusButton",
  store,
  components: {
    TrackTraceToolsLogo,
  },
  data() {
    return {};
  },
  methods: {
    async openBuilder() {
      modalManager.dispatchModalEvent(ModalType.BUILDER, ModalAction.OPEN, {
        initialRoute: "/plus",
      });
    },
  },
});
</script>
