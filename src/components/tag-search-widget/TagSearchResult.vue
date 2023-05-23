<template>
  <div @click="setTagLabelFilter" class="cursor-pointer hover:bg-purple-50 px-2 p-4">
    <div class="flex flex-row justify-between items-center mb-2">
      <div class="flex flex-row items-center space-x-2">
        <span class="metrc-tag text-lg font-bold text-purple-500 mr-2">
          {{ tag.Label }}
        </span>

        <b-button variant="outline-secondary" size="sm" @click.stop.prevent="copyToClipboard"
          >COPY TAG</b-button
        >
      </div>

      <b-badge :variant="badgeVariant">{{ displayTagState }}</b-badge>
    </div>

    <div>
      <b-table-simple small fixed>
        <b-tr>
          <b-th class="text-gray-400 whitespace-nowrap">Tag Type</b-th>
          <b-td>
            {{ tag.TagTypeName }}
          </b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-gray-400 whitespace-nowrap">Status</b-th>
          <b-td>
            {{ tag.StatusName }}
          </b-td>
        </b-tr>
      </b-table-simple>
    </div>
  </div>
</template>

<script lang="ts">
import { MessageType, TagFilterIdentifiers, TagState } from "@/consts";
import { ITagData } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { pageManager } from "@/modules/page-manager/page-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { copyToClipboard } from "@/utils/dom";
import Vue from "vue";

export default Vue.extend({
  name: "TagSearchResult",
  store,
  props: {
    tag: Object as () => ITagData,
  },
  computed: {
    badgeVariant() {
      // @ts-ignore
      switch (this.$props.tag.TagState as TagState) {
        case TagState.AVAILABLE:
          return "success";
        case TagState.USED:
          return "danger";
        case TagState.VOIDED:
          return "dark";
        default:
          return null;
      }
    },
    displayTagState() {
      // @ts-ignore
      return this.$props.tag.TagState;
    },
  },
  methods: {
    async setTagLabelFilter() {
      analyticsManager.track(MessageType.SELECTED_TAG);

      // @ts-ignore
      switch (this.$props.tag.TagState as TagState) {
        case TagState.AVAILABLE:
          await pageManager.clickTabStartingWith(pageManager.tagTabs, "Available");
          break;
        case TagState.USED:
          await pageManager.clickTabStartingWith(pageManager.tagTabs, "Used");
          break;
        case TagState.VOIDED:
          await pageManager.clickTabStartingWith(pageManager.tagTabs, "Voided");
          break;
        default:
          return null;
      }

      pageManager.setTagFilter(
        TagFilterIdentifiers.Label,
        // @ts-ignore
        this.$props.tag.Label
      );
    },
    copyToClipboard() {
      copyToClipboard(this.$props.tag.Label);

      setTimeout(() => {
        toastManager.openToast(`'${this.$props.tag.Label}' copied to clipboard`, {
          title: "Copied Tag",
          autoHideDelay: 5000,
          variant: "primary",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
      }, 500);
    },
  },
});
</script>
