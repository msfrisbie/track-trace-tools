<template>
  <b-button-group v-if="isScrolledDown" style="box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.5)">
    <b-button
      @click="scrollToTop($event)"
      variant="light"
      class="flex flex-row items-center space-x-2"
      ><span>TOP</span><font-awesome-icon icon="level-up-alt"
    /></b-button>
  </b-button-group>
</template>

<script lang="ts">
import store from '@/store/page-overlay/index';
import { merge, Subject } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import Vue from 'vue';

const TOP_THRESHOLD_PX = 300;

export default Vue.extend({
  name: 'ScrollButton',
  store,
  components: {},
  data() {
    return {
      isScrolledDown: false,
    };
  },
  mounted() {
    const scrollSubject = new Subject<any>();
    document.addEventListener('scroll', () => scrollSubject.next());

    merge(scrollSubject.pipe(throttleTime(200)), scrollSubject.pipe(debounceTime(500))).subscribe(
      () => {
        this.$data.isScrolledDown = document.body.scrollTop > TOP_THRESHOLD_PX
          || document.documentElement.scrollTop > TOP_THRESHOLD_PX;
      },
    );
  },
  computed: {},
  methods: {
    scrollToTop() {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    },
  },
});
</script>

<style type="text/scss" lang="scss">
// Override metrc bootstrap
#popover-container {
  .btn-group {
    border-radius: 4px;
    padding-top: 0;
  }
}
</style>
