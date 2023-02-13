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
            One or more of these tags cannot be used in this tool. Ensure you have pasted the
            correct type of tag.
          </div>
        </template>
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
import store from "@/store/page-overlay/index";
import {
  generateTagRangeOrError,
  isValidTag,
  numTagsInRange,
  validTagPairOrError,
} from "@/utils/tags";
import Vue from "vue";

export default Vue.extend({
  name: "PlantPicker",
  store,
  components: {},
  props: {
    sourceLabels: Array as () => string[],
  },
  methods: {
    updateTags() {
      // @ts-ignore
      this.$emit("update:tags", this.validTags());
    },
    setTags() {
      // @ts-ignore
      this.$data.tagsText = this.tagRangeImpl().join("\n");
      this.$data.startTag = "";
      this.$data.endTag = "";
      // @ts-ignore
      this.updateTags();
    },
    potentialTags(): string[] {
      return this.$data.tagsText.split(/[\n ]+/).filter((x: string) => x.length > 0);
    },
    validTags(): string[] {
      // @ts-ignore
      return this.potentialTags().filter((x: string) => isValidTag(x));
    },
    matchingTags(): string[] {
      // @ts-ignore
      return this.potentialTags().filter((x: string) => this.$props.sourceLabels.includes(x));
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
      this.$data.tagsText = "";
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
        return "";
      }
    },
    invalidFeedback(): string {
      try {
        // @ts-ignore
        validTagPairOrError(this.$data.startTag, this.$data.endTag);
        return "";
      } catch (e) {
        return (e as Error).toString();
      }
    },
    tagRange(): string[] {
      // @ts-ignore
      return this.tagRangeImpl();
    },
    tagSetHasInvalidTags(): boolean {
      // @ts-ignore
      return this.potentialTags().length !== this.validTags().length;
    },
    tagSetHasNonmatchingTags(): boolean {
      // @ts-ignore
      return this.potentialTags().length !== this.matchingTags().length;
    },
    validTagsState(): boolean | null {
      // @ts-ignore
      if (this.$data.tagsText.length === 0) {
        return null;
      }

      // @ts-ignore
      if (this.potentialTags().length !== this.validTags().length) {
        return false;
      }

      // @ts-ignore
      if (this.potentialTags().length !== this.matchingTags().length) {
        return false;
      }

      return true;
    },
  },
  data() {
    return {
      startTag: "",
      endTag: "",
      tagsText: "",
    };
  },
  watch: {},
  async mounted() {},
  async created() {},
});
</script>

<style type="text/scss" lang="scss"></style>
