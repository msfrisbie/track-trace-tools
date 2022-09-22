<template>
  <div 
    class="flex flex-col space-y-4 col-span-2" 
    style="height: 25vh; margin-bottom: 4vh;"
  >
    <div class="flex flex-col row-span-2 toolkit-scroll overflow-y-auto p-1">
      <transition-group name="list">
        <template v-for="item in items">
          <b-list-group-item
            :key="item.Name"
            class="
              list-group-item
              flex flex-row
              items-center
              justify-start
              space-x-4
              flex-nowrap
            "
          >

          <picker-icon
            icon="archive"
            style="width: 5rem"
            class="flex-shrink-0"
            :text="unitOfMeasureAndWeight(item)"
          />

          <item-card
            class="flex-grow"
            :batchNumber="item.Name"
            :categoryName="item.Category.Name"
            :unitOfMeasure="item.UnitOfMeasureName"
          />

          <b-button
            class="px-4 text-red-500 hover:text-red-800"
            variant="link"
            @click="removeItem(item)"
          >
            &#215;
          </b-button
          >
          </b-list-group-item>
        </template>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import PickerIcon from "./PickerIcon.vue";
import ItemCard from "./ItemCard.vue";
import { IItemTemplate } from "@/interfaces";
import { UnitOfMeasureName, unitOfMeasureNameToAbbreviation } from "@/utils/units";

export default Vue.extend({
  name: "ItemDataList",
  store,
  router,
  props: {
    items: Array as () => IItemTemplate[],
  },
  components: {PickerIcon, ItemCard},
  computed: {
    ...mapState([])    
  },
  data() {
    return {};
  },
  methods: {
    removeItem(item: IItemTemplate) {
      this.$emit("update:items", this.items.filter((x: IItemTemplate) => x !== item));
    },
    unitOfMeasureNameToAbbreviation,
    unitOfMeasureAndWeight(item: IItemTemplate): string {
      let unitOfMeasureAndWeight: string = '';
      if(item.UnitWeightUnitOfMeasureName)
        unitOfMeasureAndWeight = `${item.UnitWeight} ${unitOfMeasureNameToAbbreviation(item.UnitWeightUnitOfMeasureName as UnitOfMeasureName || '')}`;
      return unitOfMeasureAndWeight;
    },
  },
  async created() {},
  async mounted() {}
});
</script>

<style type="text/scss" lang="scss">
.hover-reveal-target .hover-reveal {
  display: none !important;
}

.hover-reveal-target:hover .hover-reveal {
  display: block !important;
}

.custom-control-label {
  width: 100%;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
