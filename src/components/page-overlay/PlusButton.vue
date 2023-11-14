<template>
  <div
    title="T3+"
    @click="openBuilder($event)"
    class="cursor-pointer rounded bg-gradient-to-r from-purple-800 hover:from-purple-900 to-purple-400 hover:to-purple-500 flex flex-col items-center justify-center text-xl font-semibold text-white text-center"
    style="width: 52px; height: 52px; border: 1px solid white"
  >
    <span>T3+</span>
  </div>
</template>

<script lang="ts">
import { ModalAction, ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "PlusButton",
  store,
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
