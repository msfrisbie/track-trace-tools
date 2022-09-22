<template>
  <div style="height: 100vh">
    <div class="flex flex-col p-4 space-y-6" style="height: 100%; overflow-y: auto">
      <div class="flex flex-row justify-between items-center">
        <title-banner />

        <div class="text-center text-gray-500">v{{ version }}</div>
      </div>

      <b-card no-body class="flex-grow">
        <b-tabs pills card vertical class="flex-grow">
          <b-tab title="License" active
            ><b-card-text class="flex flex-col gap-4"
              ><p>MIT License</p>

              <p>Copyright (c) 2022 Matt Frisbie</p>

              <p>
                Permission is hereby granted, free of charge, to any person obtaining a copy of this
                software and associated documentation files (the "Software"), to deal in the
                Software without restriction, including without limitation the rights to use, copy,
                modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:
              </p>

              <p>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>

              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
                CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
                OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </b-card-text></b-tab
          >
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import TitleBanner from "@/components/shared/TitleBanner.vue";
import { version } from "@/modules/version";
import Vue from "vue";
import router from "./router";

export default Vue.extend({
  name: "Guide",
  router,
  props: {},
  components: {
    TitleBanner,
  },
  computed: {},
  data() {
    return {
      version,
    };
  },
  methods: {},
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
