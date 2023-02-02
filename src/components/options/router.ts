import VueRouter, { RouteConfig } from "vue-router";
import Changelog from "./tabs/Changelog.vue";
import CustomFeatures from "./tabs/CustomFeatures.vue";
import Faq from "./tabs/Faq.vue";
import GoogleSheets from "./tabs/GoogleSheets.vue";
import License from "./tabs/License.vue";
import Welcome from "./tabs/Welcome.vue";

const routes: Array<RouteConfig> = [
  {
    path: "/license",
    component: License,
  },
  {
    path: "/faq",
    component: Faq,
  },
  {
    path: "/custom-features",
    component: CustomFeatures,
  },
  {
    path: "/changelog",
    component: Changelog,
  },
  {
    path: "/google-sheets",
    component: GoogleSheets,
  },
  {
    path: "*",
    component: Welcome,
  },
];

const router = new VueRouter({
  routes,
  mode: "hash",
});

export default router;
