<template>
  <b-button
    variant="primary"
    title="T3+"
    style="padding: 0"
    @click="openBuilder($event)"
    target="_blank"
  >
    <div
      class="flex flex-col items-center justify-center text-xl font-semibold"
      style="width: 52px; height: 52px"
    >
      <span>T3+</span>
    </div>
  </b-button>
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
