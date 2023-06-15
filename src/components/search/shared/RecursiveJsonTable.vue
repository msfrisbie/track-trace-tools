<template>
  <div>
    <div
      class="grid grid-cols-3 gap-1 cursor-pointer hover:bg-purple-50"
      v-bind:class="{ 'bg-purple-100': idx % 2 === 0 }"
      v-bind:key="pair[0]"
      v-for="[idx, pair] of formattedTablePairs.entries()"
      @click.stop.prevent="copyToClipboard(pair[1])"
    >
      <div class="p-1 font-semibold text-wrap">{{ pair[0] }}</div>
      <div class="p-1 col-span-2">{{ pair[1] }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { copyToClipboard } from "@/utils/dom";
import { MessageType } from "@/consts";
import { IIndexedTransferData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { toastManager } from "@/modules/toast-manager.module";

export default Vue.extend({
  name: "RecursiveJsonTable",
  store,
  router,
  props: {
    jsonObject: Object as () => Object,
  },
  components: {},
  computed: {
    formattedTablePairs(): [string, any][] {
      function flattenObject(obj: Object) {
        const result = {};

        function recurse(current: any, path = "") {
          for (let key in current) {
            const newPath = path ? `${path}${key}` : key;
            if (typeof current[key] === "object") {
              recurse(current[key], newPath);
            } else {
              // @ts-ignore
              result[newPath] = current[key];
            }
          }
        }

        recurse(obj);

        return result;
      }

      const pairs = Object.entries(flattenObject(this.$props.jsonObject)) as [string, any][];

      return pairs
        .filter(([k, v]) => v !== null)
        .map(([k, v]) => [
          k
            .replace(/([A-Z])/g, " $1")
            .split(" ")
            .filter((word) => word !== "")
            .join(" "),
          v,
        ]);
    },
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {
    copyToClipboard(text: string) {
      analyticsManager.track(MessageType.COPIED_TEXT, {
        value: text,
      });

      copyToClipboard(text);

      toastManager.openToast(`'${text}' copied to clipboard`, {
        title: "Copied Text",
        autoHideDelay: 5000,
        variant: "primary",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
