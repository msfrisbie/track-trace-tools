<template>
  <b-button
    variant="primary"
    title="T3+"
    style="padding: 0"
    href="https://trackandtrace.tools/plus"
    target="blank"
  >
    <div class="flex flex-col items-center justify-center" style="width: 52px; height: 52px">
      T3+
    </div>
  </b-button>
</template>

<script lang="ts">
import { ModalType } from "@/consts";
import { modalManager } from "@/modules/modal-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "PlusButton",
  store,
  data() {
    return {};
  },
  methods: {},
});
</script>
