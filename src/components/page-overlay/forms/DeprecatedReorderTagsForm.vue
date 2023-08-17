<template>
  <div class="flex flex-column-shim flex-col">
    <b-form @submit="onSubmit" @reset="onReset" autocomplete="off">
      <div class="flex flex-row space-x-4">
        <b-form-group id="input-group-1" label="Plant tags:" label-for="input-1" class="flex-grow">
          <b-input
            id="input-1"
            v-model="form.plantTagCount"
            min="0"
            :max="maxOrderSizes.maxPlantOrderSize"
            type="number"
            required
          />
          <b-form-text>Max: {{ maxOrderSizes.maxPlantOrderSize }}</b-form-text>
        </b-form-group>

        <b-form-group
          id="input-group-2"
          label="Package tags:"
          label-for="input-2"
          class="flex-grow"
        >
          <b-input
            id="input-2"
            v-model="form.packageTagCount"
            min="0"
            :max="maxOrderSizes.maxPackageOrderSize"
            type="number"
            required
          />
          <b-form-text>Max: {{ maxOrderSizes.maxPackageOrderSize }}</b-form-text>
        </b-form-group>
      </div>

      <div class="flex flex-row space-x-4">
        <b-form-group id="input-group-3" label="Contact Name" label-for="input-3">
          <b-input id="input-3" v-model="form.contactInfo.contactName" type="text" required />
        </b-form-group>

        <b-form-group id="input-group-4" label="Phone #" label-for="input-4">
          <b-input id="input-4" v-model="form.contactInfo.phoneNumber" type="text" required />
        </b-form-group>
      </div>

      <b-form-group id="input-group-5" label="Address 1" label-for="input-5">
        <b-input id="input-5" v-model="form.contactInfo.address.address1" type="text" required />
      </b-form-group>

      <b-form-group id="input-group-6" label="Address 2" label-for="input-6">
        <b-input id="input-6" v-model="form.contactInfo.address.address2" type="text" />
      </b-form-group>

      <div class="flex flex-row space-x-4">
        <b-form-group id="input-group-7" label="City" label-for="input-7">
          <b-input id="input-7" v-model="form.contactInfo.address.city" type="text" required />
        </b-form-group>

        <b-form-group id="input-group-8" label="State" label-for="input-8">
          <b-input id="input-8" v-model="form.contactInfo.address.state" type="text" required />
        </b-form-group>

        <b-form-group id="input-group-9" label="Zip" label-for="input-9">
          <b-input id="input-9" v-model="form.contactInfo.address.zip" type="text" required />
        </b-form-group>
      </div>

      <b-button type="submit" variant="primary" class="mt-2">REORDER TAGS</b-button>
    </b-form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { TaskType, METRC_TAG_REGEX, MessageType } from "@/consts";
import { mapState } from "vuex";
import { MutationType } from "@/mutation-types";
import { createTask } from "@/utils/tasks";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { extractIContactInfoFromITagOrderData } from "@/utils/address";
import {
  IContactInfo,
  IExtractedITagOrderData,
  ITagOrderData,
  IReorderTagsFormData,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";

export default Vue.extend({
  name: "ReorderTagsForm",
  store,
  computed: {
    ...mapState(["currentView"]),
  },
  async mounted() {
    await authManager.authStateOrError();

    const previousTagOrders: Array<ITagOrderData> = await primaryDataLoader.previousTagOrders();

    for (let previousTagOrder of previousTagOrders) {
      this.contactInfos.push(extractIContactInfoFromITagOrderData(previousTagOrder));
    }

    const tagOrderData: IExtractedITagOrderData =
      await primaryDataLoader.getExtractedITagOrderModalData();

    // We aggregate multiple addresses, but the 0th one in this array is the most recent order
    this.contactInfos.push(tagOrderData.contactInfo);

    if (this.contactInfos.length > 0) {
      this.form.contactInfo = this.contactInfos[0];
    }

    this.maxOrderSizes.maxPlantOrderSize = tagOrderData.maxPlantOrderSize;
    this.maxOrderSizes.maxPackageOrderSize = tagOrderData.maxPackageOrderSize;

    this.form.plantTagCount = tagOrderData.maxPlantOrderSize;
    this.form.packageTagCount = tagOrderData.maxPackageOrderSize;
  },
  data(): {
    form: IReorderTagsFormData;
    contactInfos: Array<IContactInfo>;
    maxOrderSizes: { maxPlantOrderSize: number; maxPackageOrderSize: number };
  } {
    return {
      contactInfos: [],
      maxOrderSizes: {
        maxPlantOrderSize: 0,
        maxPackageOrderSize: 0,
      },
      form: {
        plantTagCount: 0,
        packageTagCount: 0,
        contactInfo: {
          contactName: "",
          phoneNumber: "",
          address: {
            address1: "",
            address2: "",
            city: "",
            state: "",
            zip: "",
          },
        },
      },
    };
  },
  methods: {
    async onSubmit(evt: any) {
      evt.preventDefault();

      if (!window.confirm("Are you sure you wish to place this tag order?")) {
        return;
      }

      analyticsManager.track(MessageType.REORDERED_TAGS);

      store.commit(
        MutationType.ENQUEUE_TASK,
        await createTask(TaskType.REORDER_TAGS, JSON.parse(JSON.stringify(this.form)))
      );
    },
    onReset(evt: any) {},
  },
});
</script>
