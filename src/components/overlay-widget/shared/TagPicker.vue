<template>
  <div class="flex flex-col items-center space-y-4 px-4">
    <template v-if="sourceTags.length > 0">
      <b-dropdown
        style="width: 420px"
        :text="selectedMenuItem.toUpperCase()"
        variant="outline-primary"
        class="w-full"
        menu-class="w-100 pt-0 pb-0"
        block
        rounded
      >
        <b-dropdown-item
          :active="selectedMenuItem === selectedMenuState.SELECTION"
          @click="selectedMenuItem = selectedMenuState.SELECTION"
        >
          <div class="pt-2 pb-2">{{ selectedMenuState.SELECTION }}</div>
        </b-dropdown-item>
        <div class="border-b border-solid border-inherit"></div>
        <b-dropdown-item
          :active="selectedMenuItem === selectedMenuState.PASTED_TAGS"
          @click="selectedMenuItem = selectedMenuState.PASTED_TAGS"
        >
          <div class="pt-2 pb-2">{{ selectedMenuState.PASTED_TAGS }}</div>
        </b-dropdown-item>
      </b-dropdown>

      <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
        <div
          style="width: 420px"
          class="toolkit-scroll flex flex-col items-center h-4/6 overflow-y-auto p-1"
        >
          <div
            class="w-full flex flex-col flex-grow items-center space-y-2"
            style="max-height: 25vh"
          >
            <div
              class="w-full hover-reveal-target flex flex-row items-center justify-between space-x-8 text-lg"
              v-for="(tag, index) in tagsPage"
              :key="tag.Label"
            >
              <div class="flex flex-col flex-grow">
                <template v-if="pageOffset + index > 0">
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <b-button
                      variant="outline-success"
                      class="hover-reveal"
                      size="sm"
                      @click="addBefore(pageOffset + index)"
                      >CHECK {{ pageOffset + index }} BEFORE</b-button
                    >

                    <b-button
                      variant="outline-danger"
                      class="hover-reveal"
                      size="sm"
                      @click="removeBefore(pageOffset + index)"
                      >UNCHECK {{ pageOffset + index }} BEFORE</b-button
                    >
                  </div>
                </template>

                <b-form-checkbox
                  class="hover:bg-purple-50"
                  size="md"
                  v-model="selectedTagsMirror"
                  :value="tag"
                >
                  <div class="p-1 flex flex-row space-x-2 items-center justify-between">
                    <picker-card :label="tag.Label" />

                    <span class="text-sm text-gray-300">{{ index + pageOffset + 1 }}</span>
                  </div>
                </b-form-checkbox>

                <template v-if="sourceTags.length - (pageOffset + index) - 1 > 0">
                  <div class="grid grid-cols-2 gap-2 mt-2">
                    <b-button
                      variant="outline-success"
                      class="hover-reveal"
                      size="sm"
                      @click="addAfter(pageOffset + index)"
                    >
                      CHECK
                      {{ sourceTags.length - (pageOffset + index) - 1 }}
                      AFTER</b-button
                    >

                    <b-button
                      variant="outline-danger"
                      class="hover-reveal"
                      size="sm"
                      @click="removeAfter(pageOffset + index)"
                    >
                      UNCHECK
                      {{ sourceTags.length - (pageOffset + index) - 1 }}
                      AFTER</b-button
                    >
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <paste-tags
        v-if="selectedMenuItem === selectedMenuState.PASTED_TAGS"
        :sourceLabels="sourceTags.map((x) => x.Label)"
        :tags.sync="pastedTags"
        ref="pasteTags"
      >
      </paste-tags>
    </template>

    <template v-if="selectedMenuItem === selectedMenuState.SELECTION">
      <template v-if="sourceTags.length > tagsPageSize">
        <div class="flex flex-row justify-between items-center" style="width: 420px">
          <div>
            <b-button
              :disabled="!hasPrevPage"
              variant="outline-info"
              @click="tagsPageIndex -= min(tagsPageIndex, 10)"
              >&lt;&lt;</b-button
            >
            <b-button :disabled="!hasPrevPage" variant="outline-info" @click="tagsPageIndex -= 1"
              >&lt;</b-button
            >
          </div>

          <span>{{ tagsPageIndex + 1 }} of {{ pages }}</span>

          <div>
            <b-button :disabled="!hasNextPage" variant="outline-info" @click="tagsPageIndex += 1"
              >&gt;</b-button
            >
            <b-button
              :disabled="!hasNextPage"
              variant="outline-info"
              @click="tagsPageIndex += min(10, pages - tagsPageIndex - 1)"
              >&gt;&gt;</b-button
            >
          </div>
        </div>
      </template>
    </template>

    <span class="text-center text-xl font-bold"
      ><animated-number :number="selectedTags.length" /> tags selected</span
    >

    <template v-if="selectedTags.length > 0">
      <div class="flex flex-col items-center">
        <span class="text-center text-md text-gray-500"
          >First tag: {{ selectedTags[0].Label }}</span
        >

        <span class="text-center text-md text-gray-500"
          >Last tag: {{ selectedTags[selectedTags.length - 1].Label }}</span
        >
      </div>
      <span class="text-purple-500 underline cursor-pointer" @click="clear()">CLEAR</span>
    </template>

    <!-- <template v-if="isTagsExcluded">
      <span class="text-red-500">{{ tagsExcluded }} tags excluded</span>
    </template> -->

    <error-readout
      v-if="error || inflight"
      :inflight="inflight"
      :error="error"
      loadingMessage="Loading tags..."
      errorMessage="Unable to load tags."
      :zeroResultsErrorMessage="error ? error.message : null"
      permissionsErrorMessage="Check that your employee account has 'Manage Tags' permissions."
      v-on:retry="loadTags()"
    />
  </div>
</template>

<script lang="ts">
import AnimatedNumber from '@/components/overlay-widget/shared/AnimatedNumber.vue';
import ErrorReadout from '@/components/overlay-widget/shared/ErrorReadout.vue';
import PickerCard from '@/components/overlay-widget/shared/PickerCard.vue';
import { DATA_LOAD_MAX_COUNT } from '@/consts';
import { ITagData, MetrcTagType } from '@/interfaces';
import { authManager } from '@/modules/auth-manager.module';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import { isValidTag } from '@/utils/tags';
import _ from 'lodash-es';
import { v4 } from 'uuid';
import Vue from 'vue';
import PasteTags from './PasteTags.vue';

const PAGE_SIZE = 25;

export enum SelectedMenuState {
  SELECTION = 'Select Tags',
  PASTED_TAGS = 'Paste Tags',
}

export default Vue.extend({
  name: 'TagPicker',
  components: {
    PickerCard,
    ErrorReadout,
    AnimatedNumber,
    PasteTags,
  },
  props: {
    tagTypeNames: Array as () => MetrcTagType[],
    tagCount: Number,
    selectedTags: Array as () => ITagData[],
  },
  methods: {
    min(...a: number[]) {
      return Math.min(...a);
    },
    max(...a: number[]) {
      return Math.max(...a);
    },
    clear() {
      this.$data.selectedTagsMirror = [];
      // @ts-ignore
      this.$refs.pasteTags.clearForm();
    },
    addBefore(index: number) {
      this.removeBefore(index);
      this.$data.selectedTagsMirror = [
        ...this.$data.sourceTags.slice(0, index),
        ...this.$data.selectedTagsMirror,
      ];
    },
    removeBefore(index: number) {
      this.$data.selectedTagsMirror = this.$data.sourceTags
        .slice(index)
        .filter((x: ITagData) => this.$props.selectedTags.includes(x));
    },
    addAfter(index: number) {
      this.removeAfter(index);
      this.$data.selectedTagsMirror = [
        ...this.$data.selectedTagsMirror,
        ...this.$data.sourceTags.slice(index + 1),
      ];
    },
    removeAfter(index: number) {
      this.$data.selectedTagsMirror = this.$data.sourceTags
        .slice(0, index + 1, this.$data.sourceTags.length)
        .filter((x: ITagData) => this.$props.selectedTags.includes(x));
    },
    filterSelectedByPastedTags() {
      this.$data.selectedTagsMirror = this.$data.sourceTags.filter((x: ITagData) =>
        this.$data.pastedTags.includes(x.Label));
    },
    selectAll() {
      this.$data.selectedTagsMirror = this.$data.sourceTags;
    },
    async loadTags() {
      this.$data.error = null;
      this.$data.inflight = true;

      try {
        const lock = v4();
        this.$data.lockUuid = lock;

        const tags = (await primaryDataLoader.availableTags({ useCache: false })).filter((tag) =>
          this.$props.tagTypeNames.includes(tag.TagTypeName));

        // If there was a subsequent load, don't overwrite
        if (this.$data.lockUuid === lock) {
          this.$data.sourceTags = tags.sort((a: ITagData, b: ITagData) =>
            (a.Label > b.Label ? 1 : -1));

          // This must perform a shallow clone
          this.$data.selectedTagsMirror = [...this.$data.sourceTags].slice(0, this.tagCount);
        } else {
          console.log('Lock not owned, exiting');
          return;
        }
      } catch (e) {
        console.error(e);
        this.$data.error = e;
      }

      this.$data.inflight = false;
    },
  },
  computed: {
    startTagInvalid(): boolean {
      return this.$data.tagQuery.length > 0 && !isValidTag(this.$data.tagQuery);
    },
    tagsPage() {
      const startIdx = PAGE_SIZE * this.$data.tagsPageIndex;
      const endIdx = PAGE_SIZE * (this.$data.tagsPageIndex + 1);
      return this.$data.sourceTags.slice(startIdx, endIdx);
    },
    hasNextPage() {
      return (this.$data.tagsPageIndex + 1) * PAGE_SIZE < this.$data.sourceTags.length;
    },
    hasPrevPage() {
      return this.$data.tagsPageIndex > 0;
    },
    pages() {
      return Math.ceil(this.$data.sourceTags.length / PAGE_SIZE);
    },
    pageOffset() {
      return this.$data.tagsPageIndex * PAGE_SIZE;
    },
    tagsExcluded() {
      return this.$data.sourceTags.length - this.$props.selectedTags.length;
    },
    isTagsExcluded() {
      return this.$props.selectedTags.length < this.$data.sourceTags.length;
    },
    isPastedTags() {
      return this.$data.pastedTags.length > 0;
    },
  },
  data() {
    return {
      sourceTags: [],
      selectedTagsMirror: [],
      tagsPageIndex: 0,
      tagsPageSize: PAGE_SIZE,
      inflight: false,
      error: null,
      maxTagCount: DATA_LOAD_MAX_COUNT,
      lockUuid: null,
      pastedTags: [],
      selectedMenuState: SelectedMenuState,
      selectedMenuItem: SelectedMenuState.SELECTION,
    };
  },
  watch: {
    tagCount: {
      immediate: true,
      handler() {
        this.$data.selectedTagsMirror = [...this.$data.sourceTags].slice(0, this.tagCount);
      },
    },
    selectedTagsMirror: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$emit('update:selectedTags', _.orderBy(newValue, 'Label', 'asc'));
      },
    },
    pastedTags: {
      immediate: true,
      handler(newValue, oldValue) {
        this.filterSelectedByPastedTags();
      },
    },
  },
  async mounted() {},
  async created() {
    await authManager.authStateOrError();

    this.loadTags();
  },
});
</script>

<style type="text/scss" lang="scss">
.hover-reveal-target .hover-reveal {
  display: none !important;
}

.hover-reveal-target:hover .hover-reveal {
  display: block !important;
}
</style>
