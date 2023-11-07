<template>
  <div>Example</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';

export default Vue.extend({
  name: 'Example',
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {};
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
