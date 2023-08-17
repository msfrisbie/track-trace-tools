<template>
  <div class="flex flex-column-shim flex-col">
    <b-form @submit="onSubmit" @reset="onReset" autocomplete="off">
      <b-form-group id="input-group-1" label="Start Tag:" label-for="input-1">
        <vue-typeahead-bootstrap
          id="input-1"
          v-model="form.startTag"
          :data="activePackages"
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
          :data="activePackages"
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

      <b-form-group id="input-group-3" label="Note:" label-for="input-3">
        <b-form-textarea id="input-3" v-model="form.note" type="text" required></b-form-textarea>
      </b-form-group>

      <div class="mt-6">
        <b-button
          type="submit"
          variant="primary"
          class="mr-2"
          :disabled="startTagInvalid || !form.note.length"
          >ADD NOTE TO {{ tagRange.length }} PACKAGES</b-button
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
import { createTask } from "@/utils/tasks";
import { mapState } from "vuex";
import { MutationType } from "@/mutation-types";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { authManager } from "@/modules/auth-manager.module";

interface PackageNoteTask {
  startTag: string;
  endTag: string;
  note: string;
}

export default Vue.extend({
  name: "PackageNoteForm",
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

    this.activePackages = (await primaryDataLoader.activePackages()).map((pkg) => pkg.Label);
  },
  data(): { activePackages: any; form: PackageNoteTask } {
    return {
      activePackages: [],
      form: {
        startTag: "",
        endTag: "",
        note: "",
      } as PackageNoteTask,
    };
  },
  methods: {
    async onSubmit(evt: any) {
      analyticsManager.track(MessageType.VOIDED_TAGS);

      evt.preventDefault();

      for (let tag of generateTagRangeOrError(this.form.startTag, this.form.endTag)) {
        store.commit(
          MutationType.ENQUEUE_TASK,
          await createTask(TaskType.ADD_PACKAGE_NOTE, {
            tag,
            note: this.form.note,
          })
        );
      }
    },
    onReset(evt: any) {},
  },
});
</script>
