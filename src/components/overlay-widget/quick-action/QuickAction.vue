<template>
  <div
    v-if="quickActionVisible"
    @click="toggleQuickActionVisible({})"
    class="quick-action-bg absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center p-12"
  >
    <b-card header-class="ttt-purple" @click.stop.prevent class="w-full h-full shadow-2xl" no-body>
      <template #header>
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-row items-center justify-start gap-2 text-lg">
            <font-awesome-icon icon="bolt"></font-awesome-icon>
            <span>QUICK ACTIONS</span>
          </div>
          <font-awesome-icon
            class="cursor-pointer"
            icon="times"
            @click="toggleQuickActionVisible({})"
          ></font-awesome-icon>
        </div>
      </template>

      <b-tabs class="h-full" pills card vertical>
        <b-tab title="ADD STRAIN" active
          ><b-card-text><quick-strain></quick-strain></b-card-text
        ></b-tab>
        <b-tab title="ADD ITEM"
          ><b-card-text><quick-item></quick-item></b-card-text
        ></b-tab>
        <b-tab title="FINISH PACKAGES" v-if="false"
          ><b-card-text><quick-finish></quick-finish></b-card-text
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
import QuickFinish from "../quick-action/QuickFinish.vue";
import QuickItem from "../quick-action/QuickItem.vue";
import QuickStrain from "../quick-action/QuickStrain.vue";

export default Vue.extend({
  name: "QuickAction",
  store,
  router,
  props: {},
  components: {
    QuickStrain,
    QuickItem,
    QuickFinish,
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
  z-index: 1000;
}
</style>
