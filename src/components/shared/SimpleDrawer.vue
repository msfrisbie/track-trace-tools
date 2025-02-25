<template>
  <div class="flex flex-col gap-2 items-stretch">
    <b-button @click="isOpen = !isOpen" :size="size" :variant="variant"
      >{{ isOpen ? "-" : "+" }} {{ toggleText }}</b-button
    >

    <template v-if="isOpen">
      <slot></slot>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';

export default Vue.extend({
  name: 'SimpleDrawer',
  store,
  router,
  props: {
    toggleText: String,
    size: {
      type: String,
      required: false,
      default: 'sm'
    },
    variant: {
      type: String,
      required: false,
      default: 'outline-dark'
    },
    initialOpen: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {},
  async created() {},
  async mounted() {
    this.$data.isOpen = !!this.$props.initialOpen;
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
