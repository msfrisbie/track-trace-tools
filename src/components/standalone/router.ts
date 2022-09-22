import VueRouter, { RouteConfig } from "vue-router";
import Guide from "./Guide.vue";

const routes: Array<RouteConfig> = [
  // {
  //   path: "/connect",
  //   component: Connect
  // },
  {
    path: "*",
    component: Guide
  }
];

const router = new VueRouter({
  routes
});

export default router;
