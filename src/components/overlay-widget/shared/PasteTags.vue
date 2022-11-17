<template>
  <div class="w-full flex flex-col items-stretch space-y-4">
    <b-form-textarea
      id="textarea"
      v-model="tagsText"
      :value="tagsText"
      @input="updateTags()"
      placeholder="EXAMPLE00000000000001234, EXAMPLE00000000000005678"
      rows="3"
      :state="invalidTags"
    ></b-form-textarea>

    <div class="text-red-500" v-if="invalidTags === false">
      Something pasted is not a valid Metrc tag
    </div>

    <b-form-group
      label="Autofill a range of tags:"
      :valid-feedback="validFeedback"
      :invalid-feedback="invalidFeedback"
      :state="state"
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
import { BButton, BFormGroup, BFormInput, BFormTextarea } from "bootstrap-vue";
import Vue from "vue";

export default Vue.extend({
  name: "PlantPicker",
  store,
  components: {},
  props: {},
  methods: {
    updateTags() {
      this.$emit("update:tags", this.validTags());
    },
    setTags() {
      this.$data.tagsText = this.tagRange.join("\n");
      this.$data.startTag = "";
      this.$data.endTag = "";
      this.updateTags();
    },
    potentialTags(): string[] {
      return this.$data.tagsText.split(/[\n ]+/).filter((x: string) => x.length > 0);
    },
    validTags(): string[] {
      return this.potentialTags().filter((x) => isValidTag(x));
    },
    clearForm() {
      this.$data.tagsText = "";
    },
  },
  computed: {
    state() {
      if (!this.$data.startTag && !this.$data.endTag) {
        return null;
      }

      try {
        validTagPairOrError(this.$data.startTag, this.$data.endTag);
        return true;
      } catch (e) {
        return false;
      }
    },
    validFeedback(): string {
      try {
        return `${numTagsInRange(this.$data.startTag, this.$data.endTag)} tags in this range`;
      } catch (e) {
        return "";
      }
    },
    invalidFeedback(): string {
      try {
        validTagPairOrError(this.$data.startTag, this.$data.endTag);
        return "";
      } catch (e) {
        return (e as Error).toString();
      }
    },
    tagRange(): string[] {
      try {
        return generateTagRangeOrError(this.$data.startTag, this.$data.endTag);
      } catch (e) {
        return [];
      }
    },
    invalidTags(): boolean | null {
      if (this.$data.tagsText.length === 0) {
        return null;
      }

      return this.potentialTags().length === this.validTags().length;
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
