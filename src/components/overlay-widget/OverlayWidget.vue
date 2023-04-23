<template>
  <div class="ttt-wrapper overlay-widget">
    <div id="overlay-popover-target"></div>

    <div id="foo-container" ref="popovercontainer" style="position: absolute">
      <div id="context-menu-popover" style="width: 1px; height: 1px"></div>

      <b-popover
        target="context-menu-popover"
        triggers="manual"
        placement="right"
        container="foo-container"
        variant="outline-primary"
      >
        <template #title v-if="contextMenuEvent">
          <div class="text-center text-normal text-lg">
            <template v-if="contextMenuEvent.packageTag">
              <dual-color-tag class="text-md" :label="contextMenuEvent.packageTag" />
            </template>

            <template v-if="contextMenuEvent.manifestNumber">
              <span>Manifest {{ contextMenuEvent.zeroPaddedManifestNumber }}</span>
            </template>
          </div>
        </template>

        <context-menu :contextMenuEvent="contextMenuEvent" />
      </b-popover>
    </div>

    <b-toaster
      style="position: fixed; left: 1rem; bottom: 1rem; z-index: 1000000"
      name="ttt-toaster"
    />

    <div style="position: absolute">
      <debug-modal ref="debug" />
      <builder-modal ref="builder" />
      <document-modal ref="document" />
      <promo-modal ref="promo" />
    </div>
  </div>
</template>

<script lang="ts">
import BuilderModal from "@/components/overlay-widget/BuilderModal.vue";
import ContextMenu from "@/components/overlay-widget/ContextMenu.vue";
import DebugModal from "@/components/overlay-widget/debug/DebugModal.vue";
import DocumentModal from "@/components/overlay-widget/DocumentModal.vue";
import PromoModal from "@/components/overlay-widget/PromoModal.vue";
import DualColorTag from "@/components/overlay-widget/shared/DualColorTag.vue";
import { ModalAction, ModalType } from "@/consts";
import { IContextMenuEvent, IModalEvent, modalManager } from "@/modules/modal-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import store from "@/store/page-overlay/index";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { BootstrapVue } from "bootstrap-vue";
import { debounceTime } from "rxjs/operators";
import Vue from "vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";

Vue.use(BootstrapVue);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("font-awesome-icon", FontAwesomeIcon);

export default Vue.extend({
  name: "OverlayWidget",
  store,
  components: {
    BuilderModal,
    DebugModal,
    DocumentModal,
    ContextMenu,
    DualColorTag,
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

    document.addEventListener("keydown", (e) => {
      // ß is the macOS alt value
      if (e.altKey && (e.key === "ß" || e.key === "s")) {
        (this.$refs.document as any)?.hide();
        (this.$refs.promo as any)?.hide();
        (this.$refs.builder as any)?.hide();
        (this.$refs.debug as any)?.toggle();
      }

      // † is the macOS alt value
      else if (e.altKey && (e.key === "†" || e.key === "t")) {
        (this.$refs.document as any)?.hide();
        (this.$refs.debug as any)?.hide();
        (this.$refs.promo as any)?.hide();
        (this.$refs.builder as any)?.toggle();
      }
    });

    document.addEventListener("click", () => {
      modalManager.dispatchContextMenuEvent(null);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modalManager.dispatchContextMenuEvent(null);
      }
    });

    // document.addEventListener("scroll", () => {
    //   modalManager.dispatchContextMenuEvent(null);
    // });

    modalManager
      .hoverMenu$()
      .pipe(debounceTime(100))
      .subscribe(async (e: IContextMenuEvent | null) => {
        this.$data.contextMenuEvent = e;

        if (!e) {
          this.$root.$emit("bv::hide::popover", "context-menu-popover");
          return;
        }

        // @ts-ignore
        this.$refs.popovercontainer.style.left = e.x + 10 + "px";
        // @ts-ignore
        this.$refs.popovercontainer.style.top = e.y + "px";

        this.$root.$emit("bv::show::popover", "context-menu-popover");
      });

    modalManager
      .modal$()
      .subscribe(async ({ modalType, modalAction, modalEventOptions }: IModalEvent) => {
        let modal = null;

        switch (modalType) {
          case ModalType.DEBUG:
            modal = this.$refs.debug;
            break;
          case ModalType.BUILDER:
            modal = this.$refs.builder;
            break;
          case ModalType.DOCUMENT:
            modal = this.$refs.document;
            break;
          case ModalType.PROMO:
            modal = this.$refs.promo;
            break;
          default:
            throw new Error("Invalid modal type");
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
            throw new Error("Invalid modal action");
        }
      });
  },
});
</script>
