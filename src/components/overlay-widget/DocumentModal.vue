<template>
  <!-- animation is breaking modal, disable -->
  <b-modal
    id="document-modal"
    modal-class="ttt-modal"
    content-class="ttt-content"
    dialog-class="ttt-dialog"
    body-class="document-body toolkit-scroll flex flex-column-shim flex-col items-center p-0"
    size="xl"
    :static="true"
    no-fade
    centered
    hide-header
    ref="document"
    @hidden="handleClose()"
  >
    <template #modal-footer>
      <div class="w-full grid grid-cols-3 place-items-center">
        <div
          class="flex flex-row justify-start items-center space-x-2 opacity-30"
          style="place-self: center start"
        >
          <track-trace-tools-logo fill="#49276a" :inverted="true" />

          <span class="sans-serif font-extralight tracking-widest text-3xl">T3</span>
        </div>

        <template v-if="documentUrls.length > 1">
          <div class="flex flex-row justify-center items-center space-x-4">
            <b-button
              v-for="(documentUrl, index) of documentUrls"
              :key="documentUrl"
              variant="primary"
              @click="showDocument(documentUrl)"
            >
              {{ index + 1 }} OF {{ documentUrls.length }}
            </b-button>
          </div>
        </template>
      </div>
    </template>

    <div v-show="!ready" class="doc-container w-full flex flex-col items-center justify-center">
      <b-spinner style="color: #49276a" />
    </div>

    <iframe
      v-show="ready"
      ref="iframe"
      type="application/pdf"
      :src="documentUrl"
      class="doc-container w-full"
    />
  </b-modal>
</template>

<script lang="ts">
import TrackTraceToolsLogo from '@/components/shared/TrackTraceToolsLogo.vue';
import { MessageType } from '@/consts';
import { analyticsManager } from '@/modules/analytics-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import { debugLogFactory } from '@/utils/debug';
import Vue from 'vue';

const debugLog = debugLogFactory('DocumentModal.vue');

const blobUrlCache: Map<string, string> = new Map();

export default Vue.extend({
  name: 'DocumentModal',
  components: {
    TrackTraceToolsLogo,
  },
  data() {
    return {
      documentUrl: null,
      ready: false,
      documentUrls: [],
      printedUrls: new Set(),
      loadHandler: null,
    };
  },
  methods: {
    handleClose() {
      this.$data.documentUrl = null;
      this.$data.documentUrls = [];
      this.$data.printedUrls = new Set();

      this.resetLoadHandler();
    },
    resetLoadHandler() {
      if (this.$data.loadHandler) {
        // @ts-ignore
        this.$refs.iframe.removeEventListener('load', this.$data.loadHandler);
        this.$data.loadHandler = null;
      }
    },
    async showDocument(documentUrl: string, print: boolean) {
      this.$data.ready = false;

      let blobUrl = null;

      if (blobUrlCache.has(documentUrl)) {
        blobUrl = blobUrlCache.get(documentUrl);
      }

      if (!blobUrl) {
        toastManager.openToast('Opening file...', {
          title: 'T3',
          autoHideDelay: 2000,
          variant: 'primary',
          appendToast: true,
          toaster: 'ttt-toaster',
          solid: true,
        });

        const response = await fetch(documentUrl);

        let blob = await response.blob();

        // Lab PDF is returned as application/octed, which the browser is downloading
        // https://stackoverflow.com/questions/18998543/set-content-type-on-blob/50875615
        // https://stackoverflow.com/questions/20508788/do-i-need-content-type-application-octet-stream-for-file-download
        blob = blob.slice(0, blob.size, 'application/pdf');

        blobUrl = URL.createObjectURL(blob);

        blobUrlCache.set(documentUrl, blobUrl);
      }

      this.$data.documentUrl = blobUrl;
      this.$data.ready = true;

      // PDF is rendered, everything after here can error without UX consequence

      // const apiKeyState = await apiKeyManager.apiKeyStateOrNull();
    },
    hide() {
      this.$bvModal.hide('document-modal');
    },
    toggle() {
      // @ts-ignore
      this.$refs.document.toggle();
    },
    async show({ documentUrls, print = false }: { documentUrls: string[]; print?: boolean }) {
      this.resetLoadHandler();

      this.$data.documentUrls = documentUrls;

      debugLog(async () => [JSON.parse(JSON.stringify(documentUrls))]);

      this.$data.printedUrls = new Set();

      if (print) {
        // show() is called when the modal opens, always attempt a print

        this.$data.loadHandler = () => {
          // @ts-ignore
          const iframeUrl = this.$refs.iframe.contentWindow.location.href;

          if (!iframeUrl.includes('http')) {
            // Is a null url like about:blank
            return;
          }

          if (this.$data.printedUrls.has(iframeUrl)) {
            return;
          }

          debugLog(async () => ['printing on load', iframeUrl]);

          // @ts-ignore
          this.$refs.iframe.contentWindow.print();

          this.$data.printedUrls.add(iframeUrl);
        };

        // @ts-ignore
        this.$refs.iframe.addEventListener('load', this.$data.loadHandler);
      }

      this.showDocument(documentUrls[0], print);

      this.$bvModal.show('document-modal');

      analyticsManager.track(MessageType.VIEWED_DOCUMENTS, {
        documentUrls,
      });
    },
  },
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss">
.document-body {
  // If min-height is set, scroll doesn't work
  max-height: none !important;
  height: calc(90vh - 200px);
  overflow-y: auto;
}

.doc-container {
  height: 80vh;
}
</style>
