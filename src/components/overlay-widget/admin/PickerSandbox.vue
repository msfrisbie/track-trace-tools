<template>
  <div class="w-full flex flex-col space-y-8">
    <b-tabs
      class="w-full"
      content-class="mt-3"
      v-on:changed="
        many = [];
        one = null;
      "
    >
      <!-- TODO not all of these work properly yet -->
      <b-tab lazy title="Plant Picker">
        <plant-picker :selectedPlants.sync="many" />
      </b-tab>
      <b-tab lazy title="Package Picker">
        <package-picker :selectedPackages.sync="many" />
      </b-tab>
      <b-tab lazy title="Plant Batch Picker">
        <plant-batch-picker :selectedPlantBatches.sync="many" />
      </b-tab>
      <b-tab lazy title="Location Picker">
        <location-picker :location.sync="one" />
      </b-tab>
      <b-tab lazy title="Strain Picker">
        <strain-picker :strain.sync="one" :enableHotStrainCreate="true" />
      </b-tab>
      <b-tab lazy title="Tag Picker">
        <tag-picker :selectedTags.sync="many" tagTypeName="CannabisPlant" :tagCount="125" />
      </b-tab>
      <b-tab lazy title="Harvest Picker">
        <harvest-picker :harvest.sync="one" />
      </b-tab>
      <b-tab lazy title="Item Picker">
        <item-picker :item.sync="one" />
      </b-tab>
    </b-tabs>

    {{ JSON.stringify(one ? one : many, null, 2) }}
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import PlantPicker from "@/components/overlay-widget/shared/PlantPicker.vue";
import PackagePicker from "@/components/overlay-widget/shared/PackagePicker.vue";
import PlantBatchPicker from "@/components/overlay-widget/shared/PlantBatchPicker.vue";
import LocationPicker from "@/components/overlay-widget/shared/LocationPicker.vue";
import ItemPicker from "@/components/overlay-widget/shared/ItemPicker.vue";
import StrainPicker from "@/components/overlay-widget/shared/StrainPicker.vue";
import TagPicker from "@/components/overlay-widget/shared/TagPicker.vue";
import HarvestPicker from "@/components/overlay-widget/shared/HarvestPicker.vue";

export default Vue.extend({
  name: "PickerSandbox",
  store,
  router,
  props: {},
  components: {
    PlantPicker,
    PackagePicker,
    PlantBatchPicker,
    LocationPicker,
    ItemPicker,
    StrainPicker,
    TagPicker,
    HarvestPicker
  },
  computed: {
    ...mapState([])
  },
  data() {
    return {
      many: [],
      one: null
    };
  },
  methods: {},
  async created() {},
  async mounted() {}
});
</script>

<style type="text/scss" lang="scss" scoped></style>
