<template>
  <b-tab title="Changelog"
    ><b-card-text class="flex flex-col gap-4 items-center">
      <div class="max-w-lg flex flex-col gap-4">
        <p class="text-2xl ttt-purple">v0.4.0</p>

        <ul class="list-disc">
          <li>Remove popup window</li>
          <li>Tag range selection</li>
          <li>Fix plural noun in submit view</li>
          <li>Enable lab test views on all origins</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.3.0</p>

        <ul class="list-disc">
          <li>Update plant filter</li>
          <li>Allow for uniform distribution of weight for batch operations</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.2.4</p>

        <ul class="list-disc">
          <li>Adjust item picker formatting</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.2.3</p>

        <ul class="list-disc">
          <li>Adjust promo slider styling</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.2.2</p>

        <ul class="list-disc">
          <li>Additional TTT promo slider content</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.2.1</p>

        <ul class="list-disc">
          <li>Fix TTT promo slider</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.2.0</p>

        <ul class="list-disc">
          <li>Add TTT promo slider</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.1.0</p>

        <ul class="list-disc">
          <li>Add TTT dashboard</li>
          <li>Fix font loading</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.0.3</p>

        <ul class="list-disc">
          <li>Remove transfer origin check</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.0.2</p>

        <ul class="list-disc">
          <li>Fix unit tests</li>
          <li>Update CircleCI</li>
          <li>Remove access control list blockers</li>
        </ul>

        <p class="text-2xl ttt-purple">v0.0.1</p>

        <ul class="list-disc">
          <li>Initial release</li>
        </ul>
      </div>
    </b-card-text></b-tab
  >
</template>

<script lang="ts">
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "Changelog",
  store,
  router,
  props: {},
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
