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
        >NONE</b-button
      >
      <b-button
        variant="outline-primary"
        size="sm"
        @click="
          formFilters.licenses = formFilters.licenseOptions.filter((x) => x === currentLicense)
        "
        >CURRENT</b-button
      >
      <b-button
        variant="outline-primary"
        size="sm"
        @click="formFilters.licenses = [...formFilters.licenseOptions]"
        >ALL</b-button
      >
    </b-button-group>
  </div>
</template>

<script lang="ts">
import { authManager } from "@/modules/auth-manager.module";
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
    return {
      currentLicense: "",
    };
  },
  methods: {},
  async created() {},
  async mounted() {
    this.$data.currentLicense = (await authManager.authStateOrError()).license;
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
