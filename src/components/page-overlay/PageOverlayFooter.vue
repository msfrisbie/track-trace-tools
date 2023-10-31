<template>
  <div class="flex flex-col">
    <div class="flex flex-row justify-between">
      <b-button @click="onClick($event)" variant="outline-dark">HIDE</b-button>
    </div>

    <div class="flex flex-row justify-center items-center">
      <p style="position: absolute; bottom: 0" class="text-xs text-gray-400">
        v{{ currentVersion }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PageOverlayFooter",
  store,
  computed: mapState(["currentVersion"]),
  methods: {
    onClick(event: any) {
      store.commit(MutationType.TOGGLE_EXPANDED_OVERLAY);
      pageManager.setExpandedClass();
    },
  },
});
</script>
