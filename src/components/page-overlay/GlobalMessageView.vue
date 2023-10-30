<template>
  <div
    class="p-4 space-y-4 bg-white border-top border-gray-400"
    v-if="loadingMessage || errorMessage || flashMessage"
  >
    <p v-if="flashMessage" class="flex flex-row justify-center align-center text-gray-700">
      {{ flashMessage }}
    </p>

    <p v-if="loadingMessage" class="flex flex-row justify-center align-center text-gray-500">
      <b-spinner small class="mr-2" />{{ loadingMessage }}
    </p>

    <p v-if="errorMessage" class="flex flex-row justify-center align-center text-red-400">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '@/store/page-overlay/index';
import { mapState } from 'vuex';
import { MutationType } from '@/mutation-types';

export default Vue.extend({
  name: 'GlobalMessageView',
  store,
  computed: mapState(['loadingMessage', 'errorMessage', 'flashMessage']),
  mounted() {
    store.commit(MutationType.SET_LOADING_MESSAGE, null);
    store.commit(MutationType.SET_ERROR_MESSAGE, null);
    store.commit(MutationType.SET_FLASH_MESSAGE, null);
  },
});
</script>
