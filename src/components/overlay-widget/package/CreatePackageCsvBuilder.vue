<template>
  <div>Example</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { CreatePackageCsvColumns } from '@/store/page-overlay/modules/create-package-csv/consts';

export default Vue.extend({
  name: 'CreatePackageCsvBuilder',
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([])
  },
  data() {
    return {
      columns: [
        {
          value: CreatePackageCsvColumns.NEW_PACKAGE_TAG,
          required: true,
          defaultDescription: ''
        },
        {
          value: CreatePackageCsvColumns.LOCATION_NAME,
          required: false,
          defaultDescription: 'Same location as 1st parent package'
        },
        {
          value: CreatePackageCsvColumns.ITEM_NAME,
          required: false,
          defaultDescription: 'Same item as 1st parent package'
        },
        {
          value: CreatePackageCsvColumns.NEW_PACKAGE_QUANTITY,
          required: false,
          defaultDescription: 'Sum of parent quantities'
        },
        {
          value: CreatePackageCsvColumns.NEW_PACKAGE_UNIT,
          required: false,
          defaultDescription: 'Same unit as parent package'
        },
        {
          value: CreatePackageCsvColumns.PACKAGED_DATE,
          required: false,
          defaultDescription: 'Today'
        },
        {
          value: CreatePackageCsvColumns.NOTE,
          required: false,
          defaultDescription: ''
        },
        {
          value: CreatePackageCsvColumns.PRODUCTION_BATCH_NUMBER,
          required: false,
          defaultDescription: ''
        },
        {
          value: CreatePackageCsvColumns.IS_DONATION,
          required: false,
          defaultDescription: ''
        },
        {
          value: CreatePackageCsvColumns.IS_TRADE_SAMPLE,
          required: false,
          defaultDescription: ''
        },
        {
          value: CreatePackageCsvColumns.EXPIRATION_DATE,
          required: false,
          defaultDescription: 'Same as parent package'
        },
      ]
    };
  },
  methods: {},
  async created() {},
  async mounted() {}
});
</script>

<style type="text/scss" lang="scss" scoped></style>
