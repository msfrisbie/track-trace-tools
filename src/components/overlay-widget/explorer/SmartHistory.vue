<template>
  <div class="flex flex-col items-stretch">
    <div
      class="border border-purple-100 border-solid"
      v-bind:class="[idx % 2 === 0 ? 'bg-purple-100' : '0']"
      v-for="(historyEntry, idx) of explorer.history"
      v-bind:key="idx + historyEntry.RecordedDateTime"
    >
      <div class="grid grid-cols-2 p-4">
        <template v-for="(description, index) of historyEntry.Descriptions">
          <div
            v-bind:class="{ 'font-bold': index === 0, 'mb-4': index === 0 }"
            v-bind:key="description"
          >
            {{ description }}
          </div>
          <div v-bind:key="'_' + description">
            <smart-links :description="description"></smart-links>
          </div>
        </template>

        <div class="col-span-2 text-gray-500 text-xs mt-4">
          {{ new Date(historyEntry.RecordedDateTime) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { ExplorerTargetType } from '@/store/page-overlay/modules/explorer/consts';
import Vue from 'vue';
import { mapState } from 'vuex';
import SmartLinks from './SmartLinks.vue';

export default Vue.extend({
  name: 'SmartHistory',
  store,
  router,
  props: {},
  components: {
    SmartLinks,
  },
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
  },
  data() {
    return {
      ExplorerTargetType,
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
