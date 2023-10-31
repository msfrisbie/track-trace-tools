<template>
  <div>
    <table style="border-spacing: 0.5rem 0; border-collapse: separate">
      <!-- <tr>
        <td class="text-gray-400">Email:</td>
        <td class="font-bold">{{ authState.identity }}</td>
      </tr>
      <tr>
        <td class="text-gray-400">Facility:</td>
        <td class="font-bold">{{ authState.license }}</td>
      </tr> -->
    </table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import store from "@/store/page-overlay/index";
import { MutationType } from "@/mutation-types";
import { mapState } from "vuex";

export default Vue.extend({
  name: "AuthView",
  store,
});
</script>
