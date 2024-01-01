<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-center gap-8">
      <b-card class="max-w-lg">
        <div class="flex flex-col items-center gap-3">
          <div class="text-md font-bold">What are Quick Scripts?</div>
          <div>Quick Scripts are common Metrc actions that can be done in a single click.</div>
          <div>
            Need a quick script made? Post on the
            <a
              href="https://track-trace-tools.talkyard.net/"
              target="_blank"
              class="underline text-purple-500"
              >community forum!</a
            >
          </div>
        </div>
      </b-card>
      <div class="grid grid-cols-3 gap-8">
        <div
          v-bind:key="quickScript.id"
          v-for="quickScript of quickScripts"
          class="flex flex-col items-center gap-4"
        >
          <b-button
            :disabled="!!quickScript.childOptions"
            variant="outline-primary"
            @click="runQuickScript(quickScript)"
            >{{ quickScript.name }}</b-button
          >

          <div v-if="quickScript.childOptions" class="flex flex-col items-stretch gap-2">
            <div class="grid grid-flow-col auto-cols-max gap-2">
              <b-button
                size="sm"
                variant="outline-dark"
                v-for="childOption of quickScript.childOptions"
                v-bind:key="childOption"
                @click="runQuickScript(quickScript, childOption)"
                >{{ childOption }}</b-button
              >
            </div>
          </div>

          <div class="text-gray-600 text-sm">{{ quickScript.description }}</div>
          <a
            v-if="quickScript.contextLink"
            :href="quickScript.contextLink"
            target="_blank"
            class="underline text-purple-500"
            >Context</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import store from '@/store/page-overlay/index';
import { QUICK_SCRIPTS, runQuickScript } from '@/utils/quick-scripts';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'QuickScripts',
  store,
  data() {
    return {
      quickScripts: QUICK_SCRIPTS,
    };
  },
  mounted() {},
  computed: {
    ...mapState([]),
  },
  destroyed() {},
  methods: {
    runQuickScript,
  },
});
</script>
