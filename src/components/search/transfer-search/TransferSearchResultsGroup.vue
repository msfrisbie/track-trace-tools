<template>
  <div v-if="transfers.length > 0" class="border-purple-300 border-b">
    <div class="p-4 flex flex-row items-center border-purple-300">
      <div class="flex flex-row items-center space-x-4">
        <font-awesome-icon :icon="groupIcon" class="text-3xl text-gray-400" />

        <div class="text-xl text-gray-500">{{ transfers.length }}&nbsp;{{ sectionName }}s:</div>
      </div>

      <div class="flex-grow"></div>
    </div>

    <transfer-search-result-preview
      v-for="(transfer, index) in visibleTransfers"
      :key="transfer.Id"
      :transfer="transfer"
      :selected="
        !!transferSearchState.selectedTransferMetadata &&
        transfer.Id === transferSearchState.selectedTransferMetadata.transferData.Id &&
        sectionName === transferSearchState.selectedTransferMetadata.sectionName
      "
      :idx="index"
      v-on:selected-transfer="showTransferDetail($event)"
    />

    <div
      v-if="!showAll && !expanded && transfers.length > previewLength"
      class="cursor-pointer flex flex-row justify-center items-center hover:bg-purple-100"
      @click.stop.prevent="showAll = true"
    >
      <span class="text-gray-500 p-2">{{ transfers.length - previewLength }}&nbsp;MORE</span>
    </div>
  </div>
</template>

<script lang="ts">
import TransferSearchResultPreview from "@/components/search/transfer-search/TransferSearchResultPreview.vue";
import { TransferFilterIdentifiers } from "@/consts";
import { IIndexedTransferData, IPluginState } from "@/interfaces";
import { searchManager } from "@/modules/search-manager.module";
import store from "@/store/page-overlay/index";
import { ISelectedTransferMetadata } from "@/store/page-overlay/modules/transfer-search/interfaces";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "TransferSearchResultsGroup",
  store,
  components: { TransferSearchResultPreview },
  data(): {
    // destroyed$: Subject<void>;
    // selectedTransferMetadata: ISelectedTransferMetadata | null;
    showAll: boolean;
  } {
    return {
      // destroyed$: new Subject(),
      // selectedTransferMetadata: null,
      showAll: false,
    };
  },
  props: {
    sectionName: String,
    transfers: Array as () => IIndexedTransferData[],
    transferFilterIdentifier: String as () => TransferFilterIdentifiers,
    sectionPriority: Number,
    expanded: Boolean,
    previewLength: Number,
  },
  watch: {
    transfers: {
      immediate: true,
      handler(newValue, oldValue) {
        if (!newValue || newValue.length === 0) {
          return;
        }

        const candidateMetadata: ISelectedTransferMetadata = {
          transferData: newValue[0],
          sectionName: this.sectionName,
          priority: this.sectionPriority,
        };

        if (
          !this.$store.state.transferSearch.selectedTransferMetadata ||
          this.$store.state.transferSearch.selectedTransferMetadata.priority >=
            candidateMetadata.priority
        ) {
          this.$store.state.transferSearch.selectedTransferMetadata = candidateMetadata;
        }

        // searchManager.selectedTransfer
        //   .asObservable()
        //   .pipe(take(1))
        //   .subscribe((transferMetadata) => {
        //     if (
        //       newValue.length > 0 &&
        //       !newValue.find((x: any) => x.Id === transferMetadata?.transferData.Id)
        //     ) {
        //       searchManager.maybeInitializeSelectedTransfer(
        //         newValue[0],
        //         this.sectionName,
        //         this.sectionPriority
        //       );
        //     }
        //   });
      },
    },
  },
  computed: {
    visibleTransfers() {
      return this.expanded || this.$data.showAll
        ? this.transfers
        : this.transfers.slice(0, this.previewLength);
    },
    groupIcon() {
      switch (this.sectionName) {
        case "incoming transfer":
          return "truck";
        case "outgoing transfer":
          return "truck-loading";
        case "rejected transfer":
          return "undo";
        default:
          return "truck";
      }
    },
    ...mapState<IPluginState>({
      transferSearchState: (state: IPluginState) => state.transferSearch,
    }),
  },
  methods: {
    showTransferDetail(transferData: IIndexedTransferData) {
      // searchManager.selectedTransfer.next({
      //   transferData,
      //   sectionName: this.sectionName,
      //   priority: this.sectionPriority,
      // });

      this.$store.state.transferSearch.selectedTransferMetadata = {
        transferData,
        sectionName: this.sectionName,
        priority: this.sectionPriority,
      };
    },
  },
  // created() {
  //   searchManager.selectedTransfer
  //     .asObservable()
  //     .pipe(takeUntil(this.$data.destroyed$))
  //     .subscribe(
  //       (selectedTransferMetadata) =>
  //         (this.$data.selectedTransferMetadata = selectedTransferMetadata)
  //     );
  // },
  // beforeDestroy() {
  //   this.$data.destroyed$.next(null);
  // },
});
</script>
