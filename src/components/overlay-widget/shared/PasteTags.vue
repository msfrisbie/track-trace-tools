<template>
  <div class="w-full flex flex-col items-stretch space-y-4">
    <b-form-textarea
      id="textarea"
      v-model="tagsText"
      :value="tagsText"
      @input="updateTags()"
      placeholder="EXAMPLE00000000000001234, EXAMPLE00000000000005678"
      rows="3"
      :state="validTagsState"
    ></b-form-textarea>

    <template v-if="validTagsState === false">
      <template v-if="tagSetHasInvalidTags">
        <div class="text-red-500">Something pasted is not a valid Metrc tag</div>
      </template>
      <template v-else>
        <template v-if="tagSetHasNonmatchingTags">
          <div class="text-red-500">
            <p>One or more of these tags cannot be used. Check the following:</p>
            <ol class="list-decimal">
              <li>All the tags are for the current license</li>
              <li>All tags are unused</li>
              <li>All the tags are of the correct type (package vs plant)</li>
            </ol>
          </div>
        </template>
        <template v-if="tagSetHasDuplicateTags">
          <div class="text-red-500">
            <p>One or more tags is a duplicate</p>
          </div>
        </template>
      </template>

      <b-button size="sm" @click="showBadTags = !showBadTags"> TOGGLE BAD TAGS LIST </b-button>

      <template v-if="showBadTags">
        <b-card>
          <template v-if="tagSetHasInvalidTags">
            <p class="font-bold">These do not appear to be valid Metrc tags:</p>
            <ul class="list-disc">
              <li v-for="invalidTag of invalidTags" v-bind:key="invalidTag">
                {{ invalidTag }}
              </li>
            </ul>
          </template>
          <template v-if="tagSetHasNonmatchingTags">
            <p class="font-bold">
              These look like they are correct Metrc tags, but cannot be used for this tool:
            </p>
            <ul class="list-disc">
              <li v-for="nonmatchingTag of nonmatchingTags" v-bind:key="nonmatchingTag">
                {{ nonmatchingTag }}
              </li>
            </ul>
          </template>
          <template v-if="tagSetHasDuplicateTags">
            <p class="font-bold">These are duplicate tags:</p>
            <ul class="list-disc">
              <li v-for="duplicateTag of duplicateTags" v-bind:key="duplicateTag">
                {{ duplicateTag }}
              </li>
            </ul>
          </template>
        </b-card>
      </template>
    </template>

    <b-form-group
      label="Autofill a range of tags:"
      :valid-feedback="validFeedback"
      :invalid-feedback="invalidFeedback"
      :state="autofillState"
    >
      <b-input-group>
        <b-form-input placeholder="Start tag" v-model="startTag"></b-form-input>
        <b-form-input placeholder="End tag" v-model="endTag"></b-form-input>
        <b-button v-if="tagRange.length > 0" @click="setTags()"
          >FILL {{ tagRange.length }} TAGS</b-button
        >
      </b-input-group>
    </b-form-group>
  </div>
</template>

<script lang="ts">
import store from '@/store/page-overlay/index';
import {
  generateTagRangeOrError,
  getDuplicates,
  isValidTag,
  numTagsInRange,
  validTagPairOrError,
} from '@/utils/tags';
import Vue from 'vue';

export default Vue.extend({
  name: 'PlantPicker',
  store,
  components: {},
  props: {
    sourceLabels: Array as () => string[],
  },
  methods: {
    updateTags() {
      // @ts-ignore
      this.$emit('update:tags', this.validTagsImpl());
    },
    setTags() {
      // @ts-ignore
      this.$data.tagsText = this.tagRangeImpl().join('\n');
      this.$data.startTag = '';
      this.$data.endTag = '';
      // @ts-ignore
      this.updateTags();
    },
    potentialTagsImpl(): string[] {
      return this.$data.tagsText.split(/[\n\s,]+/).filter((x: string) => x.length > 0);
    },
    validTagsImpl(): string[] {
      // @ts-ignore
      return this.potentialTagsImpl().filter((x: string) => isValidTag(x)).sort();
    },
    invalidTagsImpl(): string[] {
      // @ts-ignore
      return this.potentialTagsImpl().filter((x: string) => !isValidTag(x)).sort();
    },
    duplicateTagsImpl(): string[] {
      return getDuplicates(this.potentialTagsImpl().filter((x) => isValidTag(x))).sort();
    },
    matchingTagsImpl(): string[] {
      // @ts-ignore
      return this.potentialTagsImpl().filter((x: string) => this.$props.sourceLabels.includes(x)).sort();
    },
    nonmatchingTagsImpl(): string[] {
      return this.potentialTagsImpl().filter(
        (x: string) => isValidTag(x) && !this.$props.sourceLabels.includes(x),
      ).sort();
    },
    tagRangeImpl(): string[] {
      try {
        // @ts-ignore
        return generateTagRangeOrError(this.$data.startTag, this.$data.endTag);
      } catch (e) {
        return [];
      }
    },
    clearForm() {
      this.$data.tagsText = '';
    },
  },
  computed: {
    autofillState() {
      // @ts-ignore
      if (!this.$data.startTag && !this.$data.endTag) {
        return null;
      }

      try {
        // @ts-ignore
        validTagPairOrError(this.$data.startTag, this.$data.endTag);
        return true;
      } catch (e) {
        return false;
      }
    },
    validFeedback(): string {
      try {
        // @ts-ignore
        return `${numTagsInRange(this.$data.startTag, this.$data.endTag)} tags in this range`;
      } catch (e) {
        return '';
      }
    },
    invalidFeedback(): string {
      try {
        // @ts-ignore
        validTagPairOrError(this.$data.startTag, this.$data.endTag);
        return '';
      } catch (e) {
        return (e as Error).toString();
      }
    },
    invalidTags(): string[] {
      return this.invalidTagsImpl();
    },
    nonmatchingTags(): string[] {
      return this.nonmatchingTagsImpl();
    },
    duplicateTags(): string[] {
      return this.duplicateTagsImpl();
    },
    tagRange(): string[] {
      // @ts-ignore
      return this.tagRangeImpl();
    },
    tagSetHasInvalidTags(): boolean {
      // @ts-ignore
      return this.invalidTagsImpl().length > 0;
    },
    tagSetHasNonmatchingTags(): boolean {
      // @ts-ignore
      return this.nonmatchingTagsImpl().length > 0;
    },
    tagSetHasDuplicateTags(): boolean {
      // @ts-ignore
      return this.duplicateTagsImpl().length > 0;
    },
    validTagsState(): boolean | null {
      // @ts-ignore
      if (this.$data.tagsText.length === 0) {
        return null;
      }

      // @ts-ignore
      if (this.invalidTagsImpl().length > 0) {
        return false;
      }

      // @ts-ignore
      if (this.nonmatchingTagsImpl().length > 0) {
        return false;
      }

      // @ts-ignore
      if (this.duplicateTagsImpl().length > 0) {
        return false;
      }

      return true;
    },
  },
  data() {
    return {
      startTag: '',
      endTag: '',
      tagsText: '',
      showBadTags: false,
    };
  },
  watch: {},
  async mounted() {},
  async created() {},
});
</script>

<style type="text/scss" lang="scss"></style>
