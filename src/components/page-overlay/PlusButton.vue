<template>
  <div id="plus-popover-target" :title="isChristmasSeason ? '🎄 33% OFF T3+ 🎄' : 'T3+'" @click="openBuilder($event)"
    :class="[
      'cursor-pointer rounded flex flex-col items-center justify-center text-xl font-semibold text-white text-center ',
      isChristmasSeason ? 'bg-gray-800 text-red-500 border-2 border-red-500' : 'border-1 border-white bg-gradient-to-r from-purple-800 hover:from-purple-900 to-purple-400 hover:to-purple-500'
    ]" style="height: 52px;" v-bind:style="{ width: isChristmasSeason ? '160px' : '100px' }">
    <span>{{ isChristmasSeason ? '🎄 33% OFF T3+ 🎄' : 'GET T3+' }}</span>

    <template v-if="isChristmasSeason">

      <b-popover target="plus-popover-target" triggers="hover" placement="topleft" variant="dark" ref="plus-popover"
        container="popover-container" custom-class="blackfriday-popover">
        <template #title>
          <div class="flex flex-row items-center space-x-2 text-white">
            <track-trace-tools-logo class="h-6" fill="#49276a" :inverted="true" />
            <span class="text-2xl font-bold">T3+ BLACK FRIDAY DISCOUNT</span>
          </div>
        </template>

        <div style="min-width: 200px" class="flex flex-col space-y-2 text-base text-white text-xl">
          <p>For a limited time, enjoy <span class="font-semibold text-red-500">33% off</span> a T3+ subscription</p>
          <p class="py-6">Use coupon code <span class="font-semibold text-red-500 font-mono">BLACKFRIDAY</span> at
            checkout on Stripe
            to claim your discount.
          </p>

          <b-button variant="danger" @click="openBuilder($event)">LEARN MORE</b-button>
        </div>
      </b-popover>
    </template>
    <template v-else>

      <b-popover target="plus-popover-target" triggers="hover" placement="topleft" variant="light" ref="plus-popover"
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
    </template>

  </div>
</template>

<script lang="ts">
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import store from "@/store/page-overlay/index";
import { isChristmasSeasonImpl } from "@/utils/misc";
import Vue from "vue";

export default Vue.extend({
  name: "PlusButton",
  store,
  components: {
    TrackTraceToolsLogo,
  },
  data() {
    return {
    };
  },
  computed: {
    isChristmasSeason() {
      return isChristmasSeasonImpl();
    },
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
