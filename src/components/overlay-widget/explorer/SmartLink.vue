<template>
  <b-button
    size="sm"
    variant="outline-primary"
    class="flex flex-row gap-2 items-center"
    @click="
      reset().then(() =>
        submitQuery({
          queryString: text,
          targetType: targetType,
        })
      )
    "
  >
    <font-awesome-icon :icon="icon" size="sm"></font-awesome-icon>
    <span class="flex-grow text-center text-xs">{{ text }}</span>
  </b-button>
</template>

<script lang="ts">
import { IPluginState } from '@/interfaces';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { ExplorerActions, ExplorerTargetType } from '@/store/page-overlay/modules/explorer/consts';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  name: 'SmartLink',
  store,
  router,
  props: {
    text: String,
    targetType: String as () => ExplorerTargetType,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      explorer: (state: IPluginState) => state.explorer,
    }),
    icon(): string {
      switch (this.targetType) {
        case ExplorerTargetType.PLANT_BATCH:
          return 'seedling';
        case ExplorerTargetType.PLANT:
          return 'leaf';
        case ExplorerTargetType.PACKAGE:
          return 'box';
        case ExplorerTargetType.HARVEST:
          return 'cut';
        // case ExplorerTargetType.INCOMING_TRANSFER:
        case ExplorerTargetType.OUTGOING_TRANSFER:
          return 'truck';
        default:
          return '';
      }
    },
  },
  data() {
    return {
      ExplorerTargetType,
    };
  },
  methods: {
    ...mapActions({
      reset: `explorer/${ExplorerActions.RESET}`,
      submitQuery: `explorer/${ExplorerActions.SUBMIT_QUERY}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
