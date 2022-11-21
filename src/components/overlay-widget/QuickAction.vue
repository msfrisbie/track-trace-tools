<template>
  <div
    v-if="quickActionVisible"
    @click="toggleQuickActionVisible({})"
    class="quick-action-bg absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center p-12"
  >
    <b-card @click.stop.prevent class="w-full h-full shadow-2xl" no-body>
      <b-tabs class="h-full" pills card vertical>
        <b-tab title="ADD STRAIN" active
          ><b-card-text><quick-strain></quick-strain></b-card-text
        ></b-tab>
        <b-tab title="ADD ITEM"
          ><b-card-text><quick-item></quick-item></b-card-text
        ></b-tab>
      </b-tabs>
    </b-card>
  </div>
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { QuickActionActions } from "@/store/page-overlay/modules/quickAction/consts";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import QuickItem from "./QuickItem.vue";
import QuickStrain from "./QuickStrain.vue";

export default Vue.extend({
  name: "QuickAction",
  store,
  router,
  props: {},
  components: {
    QuickStrain,
    QuickItem,
  },
  computed: {
    ...mapState({
      quickActionVisible: (state: any) => state.quickAction.quickActionVisible,
    }),
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions({
      toggleQuickActionVisible: `quickAction/${QuickActionActions.TOGGLE_QUICK_ACTION_VISIBLE}`,
    }),
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped>
.quick-action-bg {
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
