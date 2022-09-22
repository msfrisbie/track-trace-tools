<template>
  <!-- animation is breaking modal, disable -->
  <b-modal
    id="search-modal"
    modal-class="ttt-modal"
    size="xl"
    :static="true"
    no-fade
    centered
    hide-footer
    header-bg-variant="light"
    body-class="ttt-search-modal-body"
  >
    <!-- hide-footer -->

    <!-- <template #modal-header>
      <div class="flex flex-row space-x-2">
        <b-button
          variant="dark"
          @click="showPackageSearch()"
          :pressed="isPackageSearchActive"
          >Packages</b-button
        >
        <b-button
          variant="dark"
          @click="showTransferSearch()"
          :pressed="isTransferSearchActive"
          >Transfers</b-button
        >
        <b-button
          variant="dark"
          @click="showTagSearch()"
          :pressed="isTagSearchActive"
          >Tags</b-button
        >
      </div>
    </template> -->

    <template #modal-header>
      <div class="flex flex-row space-x-4 items-center" style="width: 100%">
        <div class="flex flex-row justify-center items-center" style="width: 2rem">
          <font-awesome-icon icon="search" size="2x" class="text-white" />
        </div>

        <vue-typeahead-bootstrap
          id="search"
          ref="search"
          v-model="queryString"
          :data="omniQueryStringHistory"
          type="text"
          required
          placeholder="Packages, Transfers, Tags..."
          class="flex-grow"
          :minMatchingChars="1"
          @input="search($event)"
          @hit="search($event)"
          size="md"
          style="background-color: #005587"
        >
          <!-- <template slot="prepend">
          <b-input-group-text>
            <font-awesome-icon icon="search" />
          </b-input-group-text>
        </template> -->

          <template slot="append" v-if="queryString.length > 0">
            <b-button variant="dark" @click="search('')"
              ><font-awesome-icon icon="backspace"
            /></b-button>
          </template>

          <template slot="suggestion" slot-scope="{ data, htmlText }">
            <div class="flex flex-row space-x-2 items-center">
              <font-awesome-icon :icon="['far', 'clock']" />

              <span v-html="htmlText"></span>
            </div>
          </template>
        </vue-typeahead-bootstrap>
      </div>
    </template>

    <!-- <template v-if="isPackageSearchActive"> -->
    <overlay-package-search-widget :queryString="queryString" />
    <!-- </template> -->

    <!-- <template v-if="isTransferSearchActive"> -->
    <overlay-transfer-search-widget :queryString="queryString" />
    <!-- </template> -->

    <!-- <template v-if="isTagSearchActive"> -->
    <overlay-tag-search-widget :queryString="queryString" />
    <!-- </template> -->
  </b-modal>
</template>

<script lang="ts">
import OverlayPackageSearchWidget from "@/components/overlay-widget/OverlayPackageSearchWidget.vue";
import OverlayTagSearchWidget from "@/components/overlay-widget/OverlayTagSearchWidget.vue";
import OverlayTransferSearchWidget from "@/components/overlay-widget/OverlayTransferSearchWidget.vue";
import { authManager } from "@/modules/auth-manager.module";
import { MutationType } from "@/mutation-types";
import store from "@/store/page-overlay/index";
import { Subject } from "rxjs";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";
import Vue from "vue";
import { mapState } from "vuex";

interface ComponentData {
  searchSubject: BehaviorSubject<string>;
  onDestroyed: Subject<any>;
}

export default Vue.extend({
  name: "SearchModal",
  data(): ComponentData {
    return {
      queryString: "",
      searchSubject: new BehaviorSubject(this.$store.state.omniQueryString),
      onDestroyed: new Subject(),
    } as ComponentData;
  },
  store,
  computed: {
    // placeholder() {
    //   if (this.isPackageSearchActive) {
    //     return "Tag #, item, harvest, strain...";
    //   }

    //   if (this.isTransferSearchActive) {
    //     return "Manifest number, source/destination license...";
    //   }

    //   if (this.isTagSearchActive) {
    //     return "Tag number";
    //   }

    //   return null;
    // },
    // isPackageSearchActive() {
    //   return [null, SearchModalView.PACKAGE_SEARCH].includes(
    //     this.searchModalView
    //   );
    // },
    // isTransferSearchActive() {
    //   return this.searchModalView === SearchModalView.TRANSFER_SEARCH;
    // },
    // isTagSearchActive() {
    //   return this.searchModalView === SearchModalView.TAG_SEARCH;
    // },
    ...mapState(["searchModalView", "omniQueryString", "omniQueryStringHistory"]),
  },
  components: {
    OverlayPackageSearchWidget,
    OverlayTransferSearchWidget,
    OverlayTagSearchWidget,
  },
  methods: {
    show() {
      this.$bvModal.show("search-modal");
    },
    // showPackageSearch() {
    //   this.$store.commit(
    //     MutationType.SET_SEARCH_MODAL_VIEW,
    //     SearchModalView.PACKAGE_SEARCH
    //   );
    // },
    // showTransferSearch() {
    //   this.$store.commit(
    //     MutationType.SET_SEARCH_MODAL_VIEW,
    //     SearchModalView.TRANSFER_SEARCH
    //   );
    // },
    // showTagSearch() {
    //   this.$store.commit(
    //     MutationType.SET_SEARCH_MODAL_VIEW,
    //     SearchModalView.TAG_SEARCH
    //   );
    // },
    async search(query: string) {
      this.$data.searchSubject.next(query);
    },
  },
  async mounted() {
    await authManager.authStateOrError();

    const subject: BehaviorSubject<string> = this.$data.searchSubject;

    subject
      .asObservable()
      .pipe(takeUntil(this.$data.onDestroyed), distinctUntilChanged(), debounceTime(500))
      .subscribe((query: string) => {
        this.$store.commit(MutationType.SET_OMNI_QUERY_STRING, query);

        this.$data.queryString = query;
      });
  },
});
</script>
