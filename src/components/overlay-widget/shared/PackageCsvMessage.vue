<template>
  <div>
    <div>{{ unpackedMsg.text }}</div>
    <div class="flex flex-row gap-1">
      <b-badge
        v-for="readableCoordinate of unpackedMsg.readableCellCoordinates"
        v-bind:key="readableCoordinate"
        >{{ readableCoordinate }}</b-badge
      >
    </div>
  </div>
</template>

<script lang="ts">
import { IPluginState } from "@/interfaces";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { IRowGroupMessage } from "@/store/page-overlay/modules/create-package-csv/interfaces";
import { cellIdentifierFromCoordinates } from "@/utils/csv";
import Vue from "vue";
import { mapState } from "vuex";

interface IExtendedRowGroupMessage extends IRowGroupMessage {
  readableCellCoordinates: string[];
}

export default Vue.extend({
  name: "PackageCsvMessage",
  store,
  router,
  props: {
    msg: Object as () => IRowGroupMessage,
  },
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
    }),
    unpackedMsg(): IExtendedRowGroupMessage {
      return {
        ...this.msg,
        readableCellCoordinates: this.msg.cellCoordinates.map(({ rowIndex, columnIndex }) =>
          cellIdentifierFromCoordinates({ rowIndex: rowIndex + 1, columnIndex })
        ),
      };
    },
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
