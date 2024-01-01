<template>
  <div class="flex flex-column-shim flex-col">
    <b-form-group label="I want to...">
      <b-form-select v-model="selected" :options="options" @change="onChange($event)">
      </b-form-select>
    </b-form-group>
  </div>
</template>

<script lang="ts">
import { MessageType, ToolkitView } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'TaskSelector',
  store,
  computed: {
    ...mapState(['currentView']),
  },
  data(): { selected: any; options: any } {
    return {
      selected: store.state.currentView || ToolkitView.SETTINGS,
      options: [
        {
          text: 'What would you like to do?',
          value: null,
          disabled: true,
        },
        {
          value: ToolkitView.SETTINGS,
          text: 'Edit Toolkit Settings',
        },
        {
          label: 'Sales',
          options: [
            {
              value: ToolkitView.FINALIZE_SALES,
              text: 'Finalize sales',
            },
          ],
        },
        {
          label: 'Tags',
          options: [
            {
              value: ToolkitView.VOID_TAGS,
              text: 'Void multiple tags',
            },
            // {
            //   value: ToolkitView.REORDER_TAGS,
            //   text: "Reorder tags",
            // },
          ],
        },
        // {
        //   label: "Packages",
        //   options: [
        //     {
        //       value: ToolkitView.ADD_PACKAGE_NOTE,
        //       text: "Add a note to multiple packages",
        //     },
        //   ],
        // },
      ],
    } as { selected: any; options: any };
  },
  methods: {
    onChange(event: ToolkitView) {
      store.commit(MutationType.SELECT_VIEW, event);

      analyticsManager.track(MessageType.SELECTED_VIEW, {
        view: event,
      });
    },
  },
});
</script>
