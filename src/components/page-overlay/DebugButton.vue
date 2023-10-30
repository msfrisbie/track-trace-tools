<template>
  <b-button-group style="box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5)">
    <b-button
      @click="openDebugModal($event)"
      variant="light"
      class="flex flex-row items-center space-x-2"
      ><span>DEBUG</span></b-button
    >
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '@/store/page-overlay/index';
import { modalManager } from '@/modules/modal-manager.module';
import { ModalType } from '@/consts';

export default Vue.extend({
  name: 'DebugButton',
  store,
  components: {},
  data() {
    return {};
  },
  mounted() {},
  computed: {},
  methods: {
    openDebugModal() {
      modalManager.dispatchModalEvent(ModalType.DEBUG);
    },
  },
});
</script>

<style type="text/scss" lang="scss">
// Override metrc bootstrap
#popover-container {
  .btn-group {
    border-radius: 4px;
    padding-top: 0;
  }
}
</style>
