<template>
  <!-- animation is breaking modal, disable -->
  <b-modal v-if="pluginAuth.authState" id="builder-modal" modal-class="ttt-modal" content-class="ttt-content"
    dialog-class="ttt-dialog" size="xl" header-class="builder-header" footer-class="builder-footer" :body-class="`builder-body toolkit-scroll flex flex-column-shim flex-col items-stretch ${$route.path === '/' ? 'p-0' : 'p-0'
      }`" :static="true" no-fade centered ref="builder" @show="handleOpen()" @hidden="handleClose()">
    <template #modal-header>
      <div class="w-full grid grid-cols-3">
        <div class="flex flex-row justify-start">
          <template v-if="$route.path !== '/' && !activeProject">
            <span class="text-lg font-bold cursor-pointer hover:bg-purple-50 p-4 rounded-lg" @click="exit()"
              style="color: #49276a"><font-awesome-icon icon="chevron-left" />
            </span>

            <span class="text-lg font-bold cursor-pointer hover:bg-purple-50 p-4 rounded-lg" @click="goHome()"
              style="color: #49276a"><font-awesome-icon icon="home" />
            </span>
          </template>
        </div>

        <div class="flex flex-col justify-center items-center">
          <template v-if="builderTitle">
            <span class="text-2xl text-gray-500 font-light">{{ builderTitle }}</span>
          </template>

          <template v-else>
            <div class="w-full flex flex-row justify-center items-center space-x-2">
              <track-trace-tools-logo fill="#49276a" :inverted="true" />

              <span class="sans-serif font-extralight tracking-widest text-3xl whitespace-nowrap">T3{{ clientBuildSuffix
                }}</span>
            </div>
          </template>
        </div>

        <div class="flex flex-row justify-end">
          <span class="text-lg font-bold cursor-pointer hover:bg-purple-50 p-4 rounded-lg" @click="toggleFullscreen()"
            style="color: #777777"><font-awesome-icon
              :icon="isFullscreen ? 'compress-arrows-alt' : 'expand-arrows-alt'" /></span>
          <span class="text-lg font-bold cursor-pointer hover:bg-purple-50 p-4 rounded-lg" @click="hide()"
            style="color: #777777"><font-awesome-icon icon="times" /></span>
        </div>
      </div>
    </template>

    <template #modal-footer>
      <div class="w-full grid grid-cols-5 place-items-center">
        <div class="flex flex-row justify-start items-center space-x-2 opacity-30" style="place-self: center start">
          <track-trace-tools-logo fill="#49276a" :inverted="true" />

          <span class="sans-serif font-extralight tracking-widest text-3xl whitespace-nowrap">T3{{ suffix }}</span>
        </div>

        <div class="col-span-3">
          <promo-slideshow></promo-slideshow>
        </div>

        <span class="opacity-30" style="place-self: center end">v{{ currentVersion }}</span>
      </div>
    </template>

    <div class="grid grid-cols-2 h-full"
      v-bind:style="`grid-template-columns: ${$route.path === '/' ? '280px' : '54px'} 1fr;`">
      <builder-menu-button-list></builder-menu-button-list>

      <!-- Uncomment this for debugging routing -->
      <!-- {{ $route }} -->

      <!-- Child views should expand to fill the modal -->
      <router-view class="flex flex-col items-center h-full p-4"></router-view>
    </div>
  </b-modal>
</template>

<script lang="ts">
import PromoSlideshow from "@/components/overlay-widget/PromoSlideshow.vue";
import TrackTraceToolsLogo from "@/components/shared/TrackTraceToolsLogo.vue";
import { AnalyticsEvent, BuilderType } from "@/consts";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { builderManager } from "@/modules/builder-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";
import BuilderMenuButtonList from "./BuilderMenuButtonList.vue";

const activeProjectPath = "/active-project";

export default Vue.extend({
  name: "BuilderModal",
  store,
  router,
  components: {
    TrackTraceToolsLogo,
    PromoSlideshow,
    BuilderMenuButtonList
  },
  methods: {
    async show(modalEventOptions: { builderType: BuilderType; initialRoute: string }) {
      // if (!this.$data.builderType && !this.$data.activeProject) {
      //   this.$data.builderType = modalEventOptions?.builderType;
      // } else {
      //   this.$data.builderType = null;
      // }

      this.$bvModal.show("builder-modal");

      if (this.$data.activeProject && this.$route.path !== activeProjectPath) {
        this.$router.push(activeProjectPath);
        return;
      }

      if (modalEventOptions?.initialRoute && this.$route.path !== modalEventOptions?.initialRoute) {
        this.$router.push(modalEventOptions.initialRoute);
      }
    },
    async hide() {
      this.$bvModal.hide("builder-modal");
    },
    toggle() {
      // @ts-ignore
      this.$refs.builder.toggle();
    },
    toggleFullscreen() {
      if (this.$data.isFullscreen) {
        document.exitFullscreen();
      } else {
        document.querySelector("#builder-modal .modal-content")?.requestFullscreen();
      }
    },
    handleOpen() {
      analyticsManager.track(AnalyticsEvent.OPENED_BUILDER);
    },
    handleClose() {
      analyticsManager.track(AnalyticsEvent.CLOSED_BUILDER);
    },
    exit() {
      this.$router.go(-1);

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        action: "Exited",
      });
    },
    goHome() {
      for (let i = 0; i < 100; ++i) {
        this.$router.go(-1);
      }

      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        action: "Clicked home",
      });
    },
  },
  data() {
    return {
      activeProject: null,
      isFullscreen: false,
    };
  },
  async mounted() {
    document.addEventListener("fullscreenchange", () => {
      this.$data.isFullscreen = !this.$data.isFullscreen;
    });
  },
  async created() {
    this.$data.activeProject = builderManager.activeBuilderProject;

    // Abstract router begins in a void route state that must be initialized
    if (this.$data.activeProject) {
      this.$router.push(activeProjectPath);
    } else {
      this.$router.push("/");
    }

    builderManager.activeBuilderProjectUpdate.subscribe(() => {
      this.$data.activeProject = builderManager.activeBuilderProject;

      if (this.$route.path !== activeProjectPath) {
        this.$router.push(activeProjectPath);
      }
    });
  },
  computed: {
    suffix(): string {
      return store.state.client.t3plus ? "+" : "";
    },
    builderTitle() {
      return this.$route.name?.toUpperCase();
    },
    clientBuildSuffix() {
      if (store.state.client.clientName) {
        return ` (${store.state.client.clientName})`;
      }
      if (store.state.client.t3plus) {
        return "+";
      }
      return "";
    },
    ...mapState([
      "trackedInteractions",
      "settings",
      "accountEnabled",
      "currentVersion",
      "pluginAuth",
    ]),
  },
});
</script>

<style type="text/scss" lang="scss">
.builder-body {
  // If min-height is set, scroll doesn't work
  max-height: none !important;
  height: calc(90vh - 200px);
  overflow-y: auto;
}

.builder-header {
  // border-bottom: 0 !important;
  padding: 0 !important;
}

.builder-footer {
  background-color: white !important;
}
</style>
