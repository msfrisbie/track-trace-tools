<template>
  <div>
    <div class="max-w-xl text-gray-800 flex flex-col space-y-12">
      <div class="text-2xl text-center">
        With <span class="ttt-purple">Transfer Tools</span>, creating and managing transfers is fast
        and simple.
      </div>

      <div class="grid grid-cols-2 gap-8" style="grid-template-columns: auto 1fr">
        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon size="2x" icon="bolt" class="ttt-purple inline-block" />
        </div>

        <div class="text-lg text-start">Transfer builder opens instantly - no waiting</div>

        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon size="2x" icon="history" class="ttt-purple inline-block" />
        </div>

        <div class="text-lg text-start">
          Pick from facilities, drivers, and vehicles you've recently used
        </div>

        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon size="2x" icon="map-marker-alt" class="ttt-purple inline-block" />
        </div>

        <div class="text-lg text-start">Automatically fill directions from Google Maps</div>

        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon size="2x" icon="exchange-alt" class="ttt-purple inline-block" />
        </div>

        <div class="text-lg text-start">Simplified process for same-site transfers</div>

        <div class="flex flex-col items-center justify-center">
          <font-awesome-icon size="2x" icon="clipboard-check" class="ttt-purple inline-block" />
        </div>

        <div class="text-lg text-start">TTT can submit directly to Metrc for you.</div>

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
      </div>

      <div class="flex flex-col items-center">
        <b-button variant="success" @click="$router.replace('/transfer')">GET STARTED </b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store/page-overlay/index";
import Vue from "vue";

export default Vue.extend({
  name: "TransferToolsHelp",
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
