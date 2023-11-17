<template>
  <font-awesome-icon :icon="icon" v-bind:style="{ color: iconColor }" />
</template>

<script lang="ts">
import { IIndexedTransferData } from '@/interfaces';
import Vue from 'vue';

export default Vue.extend({
  name: 'TransferIcon',
  props: {
    transfer: Object as () => IIndexedTransferData,
  },
  computed: {
    icon() {
      return 'box';
      //   const category = this.pkg.Item.ProductCategoryName;

      //   if (category.includes("Flower") || category.includes("Shake")) {
      //     return "cannabis";
      //   }

      //   if (category.includes("Capsule")) {
      //     return "capsules";
      //   }

      //   if (category.includes("Extract")) {
      //     return "tint";
      //   }

      //   if (category.includes("Other Concentrate")) {
      //     return "vial";
      //   }

      //   if (category.includes("Pre-Roll")) {
      //     return "joint";
      //   }

      //   if (category.includes("Edible")) {
      //     return "cookie-bite";
      //   }

      //   if (category.includes("Tincture")) {
      //     return "eye-dropper";
      //   }

      //   if (category.includes("Topical")) {
      //     return "pump-medical";
      //   }

      //   if (category.includes("Waste")) {
      //     return "trash-alt";
      //   }

      //   if (
      //     category.includes("Clone") ||
      //     category.includes("Plant") ||
      //     category.includes("Seeds")
      //   ) {
      //     return "seedling";
      //   }

      //   return "box";
    },
    iconColor() {
      return '#49276a';
      //   if (this.pkg.Quantity === 0) {
      //     return "rgba(0,0,0,0.3)";
      //   } else {
      //     return "#49276a";
      //   }
    },
  },
});
</script>
