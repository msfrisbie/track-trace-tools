<template>
  <!-- need this wrapping element to absorb the inherited classes -->

  <div>
    <div ref="mainmenu" class="flex-grow w-full">
      <div class="grid grid-cols-2 gap-6 p-6 bg-white max-w-4xl mx-auto">
        <template v-for="option of options">
          <div v-bind:key="option.title" v-if="option.visible"
            class="p-4 border shadow-md rounded-lg flex flex-col gap-6 items-stretch text-center ttt-purple-border"
            v-bind:class="option.cardClass">
            <div class="text-purple-600 font-semibold text-xl mb-2">{{ option.title }}</div>
            <div class="text-gray-700 text-md flex-grow" v-html="option.body"></div>
            <div class="grid gap-2 items-stretch" v-bind:class="option.buttonsClass">
              <template v-for="action of option.actions">
                <b-button v-bind:key="action.ctaText" variant="outline-primary"
                  @click.stop.prevent="open({ url: action.url, route: action.route })">
                  {{ action.ctaText }}
                </b-button>
              </template>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent } from "@/consts";
import { IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { hasPlusImpl } from "@/utils/plus";
import { notAvailableMessage } from "@/utils/text";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

interface IOption {
  title: string;
  body: string;
  cardClass: string;
  buttonsClass: string;
  actions: {
    ctaText: string;
    route?: string;
    url?: string;
  }[],
  visible: boolean;
}

export default Vue.extend({
  name: "BuilderDefaultView",
  router,
  store,
  components: {
  },
  data() {
    return {
      notAvailableMessage: notAvailableMessage(),
    };
  },
  computed: {
    ...mapState<IPluginState>({
      pluginAuth: (state: IPluginState) => state.pluginAuth,
      clientValues: (state: IPluginState) => state.client.values,
      authState: (state: IPluginState) => state.pluginAuth.authState,
      credentials: (state: IPluginState) => state.credentials,
      accountEnabled: (state: IPluginState) => state.accountEnabled,
      flags: (state: IPluginState) => state.flags,
      debugMode: (state: IPluginState) => state.debugMode,
      notificationCount: (state: IPluginState) => state.announcements.notificationCount,
    }),
    hasPlus(): boolean {
      return hasPlusImpl();
    },
    options(): IOption[] {
      return [
        {
          title: `Thanks for subscribing to T3+!`,
          body: `You're all set to use T3+. 
          
Premium T3+ features are enabled for this Metrc username.`,
          cardClass: "col-span-2",
          buttonsClass: "grid-cols-2 justify-center",
          actions: [
            {
              ctaText: `MANAGE T3+`,
              url: `https://dash.trackandtrace.tools`
            },
            {
              ctaText: `LEARN WHAT'S POSSIBLE WITH T3+`,
              url: `https://github.com/classvsoftware/t3-wiki/wiki/T3+`
            }
          ],
          visible: hasPlusImpl()
        },
        {
          title: `You're using T3 Free`,
          body: `Subscribe to T3+ to unlock reports, scan sheets, CSV form fill, history explorer, and more. <br><br>Not sure if T3+ is for you?? T3+ has a 30-day free trial.`,
          cardClass: "col-span-2",
          buttonsClass: "grid-cols-2 justify-center",
          actions: [
            {
              ctaText: `START YOUR T3+ FREE TRIAL`,
              url: `https://dash.trackandtrace.tools`
            },
            {
              ctaText: `LEARN WHAT'S POSSIBLE WITH T3+`,
              url: `https://github.com/classvsoftware/t3-wiki/wiki/T3+`
            }
          ],
          visible: !hasPlusImpl()
        },
        {
          title: `T3 Chrome Extension Features`,
          body: `Discover how to use all the different pieces of the Track & Trace Tools Chrome Extension to accelerate your Metrc workflows.`,
          cardClass: "",
          buttonsClass: "grid-cols-1",
          actions: [
            {
              ctaText: `BASIC FEATURES`,
              url: `https://github.com/classvsoftware/t3-wiki/wiki/T3-Chrome-Extension-:-Primary-Features`
            },
            {
              ctaText: `T3+ FEATURES`,
              url: `https://github.com/classvsoftware/t3-wiki/wiki/T3-Chrome-Extension-:-T3+-Features`
            }
          ],
          visible: true
        },
        {
          title: `T3 Wiki`,
          body: `Want to learn about everything that T3 has to offer? Head over to the T3 wiki to learn more about everything the T3 platform has to offer.`,
          cardClass: "",
          buttonsClass: "grid-cols-1",
          actions: [
            {
              ctaText: `VISIT THE T3 WIKI`,
              url: `https://trackandtrace.tools/wiki`
            }
          ],
          visible: true
        },
        {
          title: `T3 Community Forum`,
          body: `Ask questions, request features, and read about the latest updates on the T3 Community Forum.`,
          cardClass: "",
          buttonsClass: "grid-cols-1",
          actions: [
            {
              ctaText: `VISIT THE T3 FORUM`,
              url: `https://trackandtrace.tools/community`
            }
          ],
          visible: true
        },
        {
          title: `T3 API`,
          body: `Generate reports, load bulk data, and automate Metrc actions with the T3 API.`,
          cardClass: "",
          buttonsClass: "grid-cols-1",
          actions: [
            {
              ctaText: `GETTING STARTED WITH THE API`,
              url: `https://github.com/classvsoftware/t3-wiki/wiki/T3-API-:-Getting-Started`
            },
            {
              ctaText: `READ THE T3 API DOCUMENTATION`,
              url: `https://trackandtrace.tools/api`
            }
          ],
          visible: true
        },
        {
          title: `T3 Settings`,
          body: `Manage your T3 settings to enable/disable various pieces of T3, set Metrc defaults, and customize Metrc's appearance.`,
          cardClass: "",
          buttonsClass: "grid-cols-1",
          actions: [
            {
              ctaText: `MANAGE T3 SETTINGS`,
              route: `/settings/all`
            },
          ],
          visible: true
        },
        {
          title: `Bug Reports`,
          body: `Track & Trace Tools is maintained by just one person. I do my best to keep the extension running smoothly, but problems are unavoidable. Reports from users like you are an important way for me to quickly fix these problems. `,
          cardClass: "",
          buttonsClass: "grid-cols-1",
          actions: [
            {
              ctaText: `REPORT A BUG`,
              url: `https://docs.google.com/forms/d/e/1FAIpQLSd2hQFwtXyv1Bco9nHN9d4tEqkgbhe3w-WdbZAemBCTD_19VQ/viewform`
            }
          ],
          visible: true
        }
      ];
    }
  },
  methods: {
    ...mapActions({}),
    open({ route, url, handler }: { route?: string; url?: string; handler?: Function }) {
      if (!route && !url && !handler) {
        throw new Error("Must provide a route or URL or handler");
      }

      if (route) {
        analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
          action: `Navigated to ${route}`,
        });

        this.$router.push(route);
      }

      if (url) {
        analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
          action: `Navigated to ${url}`,
        });

        window.open(url, "_blank");
      }

      if (handler) {
        analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
          action: "Calling handler",
        });

        handler();
      }
    },
  },
  async created() { },
});
</script>
