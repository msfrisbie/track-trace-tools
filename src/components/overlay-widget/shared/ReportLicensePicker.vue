<template>
  <div class="flex flex-col items-stretch">
    <b-form-group label="Licenses:">
      <b-form-checkbox-group
        v-model="formFilters.licenses"
        :options="formFilters.licenseOptions"
      ></b-form-checkbox-group>
    </b-form-group>
    <b-button-group>
      <b-button variant="outline-primary" size="sm" @click="formFilters.licenses = []"
        >SELECT NONE</b-button
      >
      <b-button
        variant="outline-primary"
        size="sm"
        @click="formFilters.licenses = [...formFilters.licenseOptions]"
        >SELECT ALL</b-button
      >
    </b-button-group>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "Example",
  store,
  router,
  props: {
    formFilters: Object as () => {
      licenses: string[];
      licenseOptions: string[];
    },
  },
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
