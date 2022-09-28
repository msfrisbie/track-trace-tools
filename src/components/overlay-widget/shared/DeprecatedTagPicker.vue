<template>
  <div class="flex flex-col space-y-8 items-stretch">
    <template v-if="tags.length === 0">
      <b-form-group class="w-full" label="Start Tag:" label-size="sm">
        <vue-typeahead-bootstrap
          v-model="tagQuery"
          :data="availableTags"
          type="text"
          :showOnFocus="true"
          :maxMatches="10"
          size="md"
        />

        <template v-if="startTagInvalid">
          <p class="text-red-400">{{ tagQuery }} is not a valid Metrc tag</p>
        </template>
      </b-form-group>

      <template v-if="readout">
        <div class="flex flex-row space-x-2">
          <b-spinner small />
          <span>{{ readout }}</span>
        </div>
      </template>
    </template>

    <template v-else>
      <div
        class="flex flex-col items-center text-lg overflow-y-auto toolkit-scroll p-4"
        style="max-height: 25vh"
      >
        <div class="grid grid-cols-2 gap-8" style="grid-template-columns: auto auto">
          <template v-for="tag of tags">
            <div :key="tag.Label + 'icon'" class="flex flex-col items-center justify-center">
              <font-awesome-icon
                size="2x"
                icon="tag"
                class="ttt-purple opacity-60"
              ></font-awesome-icon>
            </div>

            <picker-card :key="tag.Label + 'card'" :title="tagTitle" :label="tag.Label" />
          </template>
        </div>
      </div>

      <div class="text-center text-lg font-bold">{{ tags.length }} tags selected</div>

      <span class="text-center text-purple-500 underline cursor-pointer" @click="clear()"
        >CLEAR</span
      >
    </template>

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
import ErrorReadout from "@/components/overlay-widget/shared/ErrorReadout.vue";
import PickerCard from "@/components/overlay-widget/shared/PickerCard.vue";
import { ITagData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { DataLoadError, DataLoadErrorType } from "@/modules/data-loader/data-loader-error";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { generateTagRangeOrError, getTagFromOffset, isValidTag } from "@/utils/tags";
import _ from "lodash";
import Vue from "vue";

export default Vue.extend({
  name: "DeprecatedTagPicker",
  components: {
    PickerCard,
    ErrorReadout,
  },
  props: {
    tagTypeName: String as () => "CannabisPlant" | "CannabisPackage",
    tagCount: Number,
    tags: Array as () => ITagData[],
  },
  computed: {
    startTagInvalid(): boolean {
      return this.$data.tagQuery.length > 0 && !isValidTag(this.$data.tagQuery);
    },
    tagTitle() {
      return this.tagTypeName === "CannabisPlant" ? "UNUSED PLANT TAG" : "UNUSED PACKAGE TAG";
    },
  },
  data() {
    return {
      tagQuery: "",
      inflight: false,
      error: null,
      readout: null,
      availableTags: [],
      selectedTags: [],
    };
  },
  methods: {
    async loadTags() {
      this.$data.inflight = false;
      this.$data.error = null;

      try {
        this.$data.inflight = true;
        this.$data.availableTags = (await primaryDataLoader.availableTags({}))
          .filter((tag) => tag.TagTypeName === this.$props.tagTypeName)
          .map((tag) => tag.Label);
      } catch (e) {
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }

      if (this.$data.availableTags.length === 0) {
        console.error("Server returned 0 tags");

        this.$data.error = new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          "Zero results returned"
        );
      }
    },
    clear() {
      this.$data.selectedTags = [];
      this.$data.tagQuery = "";
    },
    async generateTagRange(newValue: string | null) {
      // @ts-ignore
      return this.generateTagRangeImpl(newValue);
    },
    generateTagRangeImpl: _.debounce(async function (newValue: string | null) {
      // This is a sucky way of binding to this
      // @ts-ignore
      const _this: any = this;

      if (!newValue) {
        return;
      }

      if (!isValidTag(newValue)) {
        console.log("invalid tag");
        return;
      }

      const tagRange: string[] = generateTagRangeOrError(
        _this.$data.tagQuery,
        getTagFromOffset(_this.$data.tagQuery, _this.tagCount - 1)
      );

      // TODO if all tags are available in availableTags, just use those

      _this.$data.readout = `Checking ${tagRange.length} tags...`;

      try {
        // Small number of
        if (tagRange.length < 100) {
          const tags: ITagData[] = (
            await Promise.all(tagRange.map((tag) => primaryDataLoader.availableTag(tag)))
          ).filter((tagData: ITagData) => tagData.TagTypeName === _this.$props.tagTypeName);

          _this.$data.selectedTags = tags;
        } else {
          const availableTags = (await primaryDataLoader.availableTags({})).filter(
            (tagData: ITagData) => tagData.TagTypeName === _this.$props.tagTypeName
          );

          const tags: ITagData[] = [];

          for (let tagChars of tagRange) {
            for (let tag of availableTags) {
              if (tag.Label === tagChars) {
                tags.push(tag);
                break;
              }
            }
          }

          _this.$data.selectedTags = tags;
        }
      } catch (e) {
        _this.$data.error = e;
      } finally {
        _this.$data.inflight = false;
        _this.$data.readout = null;
      }
    }, 500),
  },
  watch: {
    tagQuery: {
      immediate: true,
      // https://www.digitalocean.com/community/tutorials/vuejs-lodash-throttle-debounce
      handler(newValue, oldValue) {
        // This is not operating correctly, creates a new fn instance each run
        // _.debounce(this.generateTagRange, 500)(newValue);
        this.generateTagRange(newValue);
      },
    },
    selectedTags: {
      immediate: true,
      handler(newValue: any) {
        this.$emit("update:selectedTags", newValue);
      },
    },
  },
  async mounted() {
    await authManager.authStateOrError();

    this.loadTags();
  },
});
</script>
