<template>
  <div>
    <div class="max-w-xl text-gray-800 flex flex-col space-y-12">
      <div class="text-2xl text-center">
        Using <span class="ttt-purple">Cultivation Tools</span>, tasks that normally take hours can
        be finished in less than a minute.
      </div>

      <div class="grid grid-cols-2 gap-8" style="grid-template-columns: auto 1fr">
        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon
            size="2x"
            style="width: "
            icon="clipboard-check"
            class="ttt-purple inline-block"
          />
        </div>

        <div class="text-lg text-start">
          TTT can submit directly to Metrc for you, or you can download the CSVs to submit yourself.
        </div>

        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon
            size="2x"
            icon="exclamation-triangle"
            class="ttt-purple inline-block"
          />
        </div>

        <div class="text-lg text-start">
          TTT will ignore random Metrc errors and ensure everything is sent to Metrc.
        </div>

        <!-- <div class="flex flex-col items-center justify-center">
          <font-awesome-icon size="2x" icon="save" class="ttt-purple inline-block" />
        </div> -->

        <!-- <div class="text-lg text-start">
          After you connect TTT, TTT can backup what you submit.
        </div> -->
      </div>

      <div class="flex flex-col items-center">
        <b-button variant="success" @click="$router.replace('/cultivator')">GET STARTED </b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "CultivatorToolsHelp",
  store,
  components: {},
  data() {
    return {};
  },
  mounted() {},
  computed: {},
  methods: {},
});
</script>

<style type="text/scss" lang="scss"></style>
