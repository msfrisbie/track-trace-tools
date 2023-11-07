<template>
  <div class="flex flex-col space-y-4 items-center">
    <!-- https://mattzollinhofer.github.io/vue-typeahead-bootstrap-docs/examples/examples.html#prepend-append -->

    <b-form-group class="w-full" :label="label" label-size="sm">
      <template v-if="item">
        <b-button-group class="self-start">
          <b-button
            size="md"
            variant="primary"
            class="overflow-x-hidden"
            style="max-width: 400px"
            disabled
            >{{ item.Name }}</b-button
          >
          <b-button
            size="md"
            variant="primary"
            @click="
              $emit('update:item', null);
              itemQuery = '';
            "
            >&#10005;</b-button
          >
        </b-button-group>
      </template>

      <template v-if="!item">
        <vue-typeahead-bootstrap
          v-model="itemQuery"
          :data="items"
          :serializer="(item) => item.Name"
          :minMatchingChars="0"
          :showOnFocus="true"
          :maxMatches="100"
          @hit="$emit('update:item', $event)"
          type="text"
          required
          placeholder="Item name"
          class="w-full"
          size="md"
        />
      </template>
    </b-form-group>

    <error-readout
      v-if="error || inflight"
      class="text-center"
      :inflight="inflight"
      :error="error"
      loadingMessage="Loading items..."
      errorMessage="Unable to load items."
      zeroResultsErrorMessage="Metrc returned 0 eligible items."
      :zeroResultsErrorSuggestionMessage="zeroResultsErrorSuggestionMessage"
      permissionsErrorMessage="Check that your employee account has 'Manage Items' permissions."
      v-on:retry="loadItems()"
    />
  </div>
</template>

<script lang="ts">
import ErrorReadout from '@/components/overlay-widget/shared/ErrorReadout.vue';
import { IClientItemFilters, IIndexedPackageData, IItemData } from '@/interfaces';
import { DataLoadError, DataLoadErrorType } from '@/modules/data-loader/data-loader-error';
import { primaryDataLoader } from '@/modules/data-loader/data-loader.module';
import store from '@/store/page-overlay/index';
import { itemMatchesFilters } from '@/utils/filters';
import _ from 'lodash-es';
import Vue from 'vue';

export default Vue.extend({
  name: 'ItemPicker',
  store,
  components: {
    ErrorReadout,
  },
  async mounted() {
    // @ts-ignore
    this.loadItems();
  },
  props: {
    label: String,
    item: Object as () => IItemData,
    itemFilters: {
      type: Object as () => IClientItemFilters,
      default: (): IClientItemFilters => ({} as IClientItemFilters),
    },
    zeroResultsErrorSuggestionMessage: String,
    selectOwnedItems: Boolean,
  },
  data() {
    return {
      itemQuery: '',
      inflight: false,
      error: null,
      items: [],
    };
  },
  computed: {
    itemOptions() {
      return this.$data.items.map((item: IItemData) => ({
        text: item.Name,
        value: item,
      }));
    },
  },
  watch: {
    itemQuery: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.updateSourceItems();
      },
    },
    item: {
      immediate: true,
      handler(newValue, oldValue) {
        // @ts-ignore
        this.$data.itemQuery = newValue?.Name || '';
      },
    },
  },
  methods: {
    async loadItems() {
      this.$data.inflight = false;
      this.$data.error = null;

      if (this.$data.itemQuery.length === 0) {
        this.$data.items = [];
        return;
      }

      try {
        this.$data.inflight = true;

        const itemMap = new Map<number, IItemData>();

        let items: IItemData[];

        if (this.$props.selectOwnedItems) {
          items = await primaryDataLoader.items();
        } else {
          items = (
            await primaryDataLoader.onDemandPackageItemSearch({ queryString: this.$data.itemQuery })
          ).map((x: IIndexedPackageData) => x.Item);
        }

        for (const item of items) {
          if (itemMatchesFilters(item, this.$props.itemFilters)) {
            itemMap.set(item.Id, item);
          }
        }

        this.$data.items = [...itemMap.values()];
      } catch (e) {
        console.log('error', e);
        this.$data.error = e;
        return;
      } finally {
        this.$data.inflight = false;
      }

      if (this.$data.items.length === 0) {
        console.error('Server returned 0 items');
        this.$data.error = new DataLoadError(
          DataLoadErrorType.ZERO_RESULTS,
          'Zero results returned'
        );
      }
    },
    updateSourceItems() {
      // @ts-ignore
      this.updateSourceItemsImpl();
    },
    updateSourceItemsImpl: _.debounce(async function () {
      // @ts-ignore
      const _this: any = this;

      _this.loadItems();
    }, 500),
  },
});
</script>
