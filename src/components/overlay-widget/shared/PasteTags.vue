<template>
  <div class="w-full flex flex-col items-center space-y-4">
    <b-form-textarea
      id="textarea"
      v-model="tagsText"
      :value="tagsText"
      @input="updateTags($event)"
      placeholder="EXAMPLE00000000000001234, EXAMPLE00000000000005678"
      rows="3"
      :state="invalidTags"
    ></b-form-textarea>

    <div class="text-red-500" v-if="invalidTags === false">
      Something pasted is not a valid Metrc tag
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import { isValidTag } from "@/utils/tags";
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
    invalidTags(): boolean | null {
      if (this.$data.tagsText.length === 0) {
        return null;
      }

      return this.potentialTags().length === this.validTags().length;
    },
  },
  data() {
    return {
      tagsText: "",
    };
  },
  watch: {},
  async mounted() {},
  async created() {},
});
</script>

<style type="text/scss" lang="scss"></style>
