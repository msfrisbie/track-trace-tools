<template>
  <div class="flex flex-column-shim flex-col" v-if="taskQueue.length > 0">
    <div>Remaining tasks: {{ taskQueue.length }}</div>

    <div class="h-4">
      <div v-if="queueWrapper.lastCompletedTask">
        {{ queueWrapper.lastCompletedTask.taskName }}...
      </div>
    </div>

    <div class="flex flex-row" v-if="taskQueue.length">
      <b-button class="m-4" variant="primary" @click="purgeTaskQueue()">
        CANCEL ALL
      </b-button>

      <b-button class="m-4" variant="primary" @click="pauseTaskQueue()">
        {{ taskQueuePaused ? "RESUME" : "PAUSE" }}
      </b-button>
    </div>
  </div>
</template>

<script lang="ts">
import store from '@/store/page-overlay/index';
import { TaskType } from '@/consts';
import Vue from 'vue';
import { mapState } from 'vuex';
import { MutationType } from '@/mutation-types';
import { runTask } from '@/utils/tasks';
import { queueWrapper } from '@/modules/queue-wrapper.module';
import { Task } from '@/interfaces';

export default Vue.extend({
  name: 'QueueView',
  store,
  data() {
    return {
      queueWrapper,
    };
  },
  computed: mapState(['taskQueue', 'taskQueuePaused']),
  created() {},
  mounted() {},
  destroyed() {},
  methods: {
    purgeTaskQueue() {
      queueWrapper.purge();
    },
    pauseTaskQueue() {
      queueWrapper.togglePause();
    },
  },
});
</script>
