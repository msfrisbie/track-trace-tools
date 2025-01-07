<template>
  <div class="ttt-wrapper overlay-widget">
    <div id="overlay-popover-target"></div>

    <div id="foo-container" ref="popovercontainer" style="position: absolute">
      <div id="context-menu-popover" style="width: 1px; height: 1px"></div>

      <b-popover target="context-menu-popover" triggers="manual" placement="right" container="foo-container"
        variant="outline-primary">
        <template #title v-if="contextMenuEvent">
          <div class="text-center text-normal text-lg">
            <template v-if="contextMenuEvent.packageTag">
              <metrc-tag :label="contextMenuEvent.packageTag" sideText="PACKAGE"></metrc-tag>
            </template>

            <template v-if="contextMenuEvent.manifestNumber">
              <span>Manifest {{ contextMenuEvent.zeroPaddedManifestNumber }}</span>
            </template>
          </div>
        </template>

        <context-menu :contextMenuEvent="contextMenuEvent" />
      </b-popover>
    </div>

    <b-toaster style="position: fixed; left: 1rem; bottom: 1rem; z-index: 1000000" name="ttt-toaster" />

    <div style="position: absolute">
      <debug-modal ref="debugmodal" />
      <builder-modal ref="buildermodal" />
      <document-modal ref="documentmodal" />
      <promo-modal ref="promomodal" />
      <search-modal ref="searchmodal" />
    </div>
  </div>
</template>

<script lang="ts">
import BuilderModal from '@/components/overlay-widget/BuilderModal.vue';
import ContextMenu from '@/components/overlay-widget/ContextMenu.vue';
import DebugModal from '@/components/overlay-widget/debug/DebugModal.vue';
import DocumentModal from '@/components/overlay-widget/DocumentModal.vue';
import PromoModal from '@/components/overlay-widget/PromoModal.vue';
import SearchModal from '@/components/overlay-widget/SearchModal.vue';
import MetrcTag from '@/components/overlay-widget/shared/MetrcTag.vue';
import { ModalAction, ModalType } from '@/consts';
import { IContextMenuEvent, IModalEvent, modalManager } from '@/modules/modal-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import store from '@/store/page-overlay/index';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { BootstrapVue } from 'bootstrap-vue';
import { debounce } from "lodash-es";
import { debounceTime } from 'rxjs/operators';
import Vue from 'vue';
import Fragment from 'vue-fragment';
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap';

Vue.use(BootstrapVue);
Vue.use(Fragment.Plugin);
Vue.component('vue-typeahead-bootstrap', VueTypeaheadBootstrap);
Vue.component('font-awesome-icon', FontAwesomeIcon);

export default Vue.extend({
  name: 'OverlayWidget',
  store,
  components: {
    BuilderModal,
    DebugModal,
    DocumentModal,
    SearchModal,
    ContextMenu,
    MetrcTag,
    PromoModal,
  },
  data() {
    return {
      contextMenuEvent: null,
    };
  },
  async mounted() {
    toastManager.toast$().subscribe(({ text, options }) => {
      this.$bvToast.toast(text, options);
    });

    // Define handlers
    const handleEscapeKey = () => {
      modalManager.dispatchContextMenuEvent(null);
    };

    const handleAltKeyCombos = (e: KeyboardEvent) => {
      switch (e.key) {
        case "œ": // macOS alt value for 'q'
        case "q":
          (this.$refs.documentmodal as any)?.hide();
          (this.$refs.promomodal as any)?.hide();
          (this.$refs.buildermodal as any)?.hide();
          (this.$refs.debugmodal as any)?.toggle();
          (this.$refs.searchmodal as any)?.hide();
          break;

        case "†": // macOS alt value for 't'
        case "t":
          (this.$refs.documentmodal as any)?.hide();
          (this.$refs.debugmodal as any)?.hide();
          (this.$refs.promomodal as any)?.hide();
          (this.$refs.buildermodal as any)?.toggle();
          (this.$refs.searchmodal as any)?.hide();
          break;

        case "ß": // macOS alt value for 's'
        case "s":
          (this.$refs.documentmodal as any)?.hide();
          (this.$refs.debugmodal as any)?.hide();
          (this.$refs.promomodal as any)?.hide();
          (this.$refs.buildermodal as any)?.hide();
          (this.$refs.searchmodal as any)?.toggle();
          break;

        default:
          // Handle other keys if needed
          break;
      }
    };

    // Combined keydown handler
    const keydownHandler = debounce((e) => {
      if (e.key === "Escape") {
        handleEscapeKey();
        return;
      }

      if (e.altKey) {
        handleAltKeyCombos(e);
      }
    }, 150); // Adjust debounce delay as needed

    const clickHandler = debounce(() => {
      modalManager.dispatchContextMenuEvent(null);
    }, 150); // Adjust debounce delay as needed

    // Assign handlers
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("click", clickHandler);

    modalManager
      .hoverMenu$()
      .pipe(debounceTime(100))
      .subscribe(async (e: IContextMenuEvent | null) => {
        this.$data.contextMenuEvent = e;

        if (!e) {
          this.$root.$emit('bv::hide::popover', 'context-menu-popover');
          return;
        }

        // @ts-ignore
        this.$refs.popovercontainer.style.left = `${e.x + 10}px`;
        // @ts-ignore
        this.$refs.popovercontainer.style.top = `${e.y}px`;

        this.$root.$emit('bv::show::popover', 'context-menu-popover');
      });

    modalManager
      .modal$()
      .subscribe(async ({ modalType, modalAction, modalEventOptions }: IModalEvent) => {
        let modal = null;

        switch (modalType) {
          case ModalType.DEBUG:
            modal = this.$refs.debugmodal;
            break;
          case ModalType.BUILDER:
            modal = this.$refs.buildermodal;
            break;
          case ModalType.DOCUMENT:
            modal = this.$refs.documentmodal;
            break;
          case ModalType.PROMO:
            modal = this.$refs.promomodal;
            break;
          case ModalType.SEARCH:
            modal = this.$refs.searchmodal;
            break;
          default:
            throw new Error('Invalid modal type');
        }

        switch (modalAction) {
          case ModalAction.OPEN:
            // @ts-ignore
            modal.show(modalEventOptions);
            break;
          case ModalAction.CLOSE:
            // @ts-ignore
            modal.hide(modalEventOptions);
            break;
          default:
            throw new Error('Invalid modal action');
        }
      });
  },
});
</script>
