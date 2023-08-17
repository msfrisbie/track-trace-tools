<template>
  <div class="flex flex-column-shim flex-col">
    <b-form @submit="onSubmit" @reset="onReset" autocomplete="off">
      <b-form-group id="input-group-1" label="Start Tag:" label-for="input-1">
        <vue-typeahead-bootstrap
          id="input-1"
          v-model="form.startTag"
          :data="availableTags"
          type="text"
          required
          placeholder="1A4400000000000000000001"
        />
        <p class="text-red-400" v-if="startTagInvalid">
          {{ form.startTag }} is not a valid Metrc tag
        </p>
      </b-form-group>

      <b-form-group id="input-group-2" label="End Tag:" label-for="input-2">
        <vue-typeahead-bootstrap
          id="input-2"
          v-model="form.endTag"
          :data="availableTags"
          type="text"
          required
          placeholder="1A4400000000000000000010"
        />

        <p class="text-red-400" v-if="endTagInvalid">{{ form.endTag }} is not a valid Metrc tag</p>
      </b-form-group>

      <p class="text-red-400" v-if="!startTagInvalid && !endTagInvalid && isInvalidTagRange">
        This doesn't look like a valid tag range. <br />Make sure the start tag has a lower number
        than the end tag.
      </p>

      <div class="mt-6">
        <b-button type="submit" variant="primary" class="mr-2" :disabled="!tagRange.length"
          >VOID {{ tagRange.length }} TAGS</b-button
        >
        <!-- <b-button type="reset" variant="danger">Reset</b-button> -->
      </div>
    </b-form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { TaskType, METRC_TAG_REGEX, MessageType } from "@/consts";
import { isValidTag, generateTagRangeOrError } from "@/utils/tags";
import { mapState } from "vuex";
import { MutationType } from "@/mutation-types";
import { createTask } from "@/utils/tasks";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { authManager } from "@/modules/auth-manager.module";

interface TaskForm {
  startTag: string;
  endTag: string;
}

export default Vue.extend({
  name: "DeprecatedVoidTagForm",
  store,
  computed: {
    startTagInvalid(): boolean {
      return this.form.startTag.length > 0 && !isValidTag(this.form.startTag);
    },
    endTagInvalid(): boolean {
      return this.form.endTag.length > 0 && !isValidTag(this.form.endTag);
    },
    tagRange(): Array<string> {
      try {
        return generateTagRangeOrError(this.form.startTag, this.form.endTag);
      } catch (e) {
        return [];
      }

      return [];
    },
    isInvalidTagRange(): boolean {
      if (!isValidTag(this.form.startTag) || !isValidTag(this.form.endTag)) {
        return false;
      }

      try {
        generateTagRangeOrError(this.form.startTag, this.form.endTag);

        return false;
      } catch (e) {
        return true;
      }

      return true;
    },
    ...mapState(["currentView"]),
  },
  async mounted() {
    await authManager.authStateOrError();

    this.availableTags = (await primaryDataLoader.availableTags({})).map((tag) => tag.Label);
  },
  data(): { form: TaskForm; availableTags: any } {
    return {
      availableTags: [],
      form: {
        startTag: "",
        endTag: "",
      } as TaskForm,
    };
  },
  methods: {
    async onSubmit(evt: any) {
      evt.preventDefault();

      if (!window.confirm("Are you sure you wish to void these tags?")) {
        return;
      }

      analyticsManager.track(MessageType.VOIDED_TAGS);

      for (let tag of generateTagRangeOrError(this.form.startTag, this.form.endTag)) {
        store.commit(
          MutationType.ENQUEUE_TASK,
          await createTask(TaskType.VOID_TAGS, {
            tag,
          })
        );
      }
    },
    onReset(evt: any) {},
  },
});
</script>
