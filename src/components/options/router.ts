import VueRouter, { RouteConfig } from "vue-router";
import Changelog from "./tabs/Changelog.vue";
import CustomFeatures from "./tabs/CustomFeatures.vue";
import Faq from "./tabs/Faq.vue";
import Plus from "./tabs/Plus.vue";
import GoogleSheets from "./tabs/GoogleSheets.vue";
import License from "./tabs/License.vue";
import PrivacyPolicy from "./tabs/PrivacyPolicy.vue";
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
    path: "/plus",
    component: Plus,
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
    path: "/privacy-policy",
    component: PrivacyPolicy,
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
