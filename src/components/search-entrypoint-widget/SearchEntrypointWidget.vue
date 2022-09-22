<template>
  <div class="ttt-wrapper">
    <div class="">
      <div class="flex flex-row space-x-2">
        <div class="flex flex-col flex-grow" style="max-width: 600px">
          <b-input-group>
            <b-input-group-prepend
              ><b-input-group-text>
                <font-awesome-icon icon="search" />
              </b-input-group-text>
            </b-input-group-prepend>

            <b-form-input
              type="text"
              @click="openSearchModal"
              @focus="openSearchModal"
            ></b-form-input>
          </b-input-group>
        </div>
      </div>

      <div class="mt-4">
        <package-search-filters />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import PackageSearchFilters from "@/components/package-search-widget/PackageSearchFilters.vue";
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "PackageSearchWidget",
  store,
  components: {
    PackageSearchFilters,
  },
  methods: {
    openSearchModal() {},
  },
});
</script>
