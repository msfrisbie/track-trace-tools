<template>
  <div class="flex flex-col flex-grow justify-between">
    <div class="flex flex-col space-y-6">
      <task-selector-form />

      <task-form-manifold />

      <!-- <queue-view /> -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TaskSelectorForm from '@/components/page-overlay/forms/TaskSelectorForm.vue';
import TaskFormManifold from '@/components/page-overlay/TaskFormManifold.vue';
import { mapState } from 'vuex';
import QueueView from '@/components/page-overlay/QueueView.vue';

export default Vue.extend({
  name: 'PageOverlayBody',
  components: {
    TaskSelectorForm,
    TaskFormManifold,
    // QueueView
  },
});
</script>
