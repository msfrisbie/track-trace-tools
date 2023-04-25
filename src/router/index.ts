import ActiveProjectView from "@/components/overlay-widget/ActiveProjectView.vue";
import AdminListView from "@/components/overlay-widget/admin/AdminListView.vue";
import LayoutSandbox from "@/components/overlay-widget/admin/LayoutSandbox.vue";
import PickerSandbox from "@/components/overlay-widget/admin/PickerSandbox.vue";
import BuilderDefaultView from "@/components/overlay-widget/BuilderDefaultView.vue";
import CultivatorBuilderListView from "@/components/overlay-widget/cultivation/CultivatorBuilderListView.vue";
import CultivatorToolsHelp from "@/components/overlay-widget/cultivation/CultivatorToolsHelp.vue";
import DestroyPlantsBuilder from "@/components/overlay-widget/cultivation/DestroyPlantsBuilder.vue";
import HarvestBuilder from "@/components/overlay-widget/cultivation/HarvestBuilder.vue";
import ManicureBuilder from "@/components/overlay-widget/cultivation/ManicureBuilder.vue";
import MotherBuilderList from "@/components/overlay-widget/cultivation/MotherBuilderList.vue";
import MotherPlantBatchPackageBuilder from "@/components/overlay-widget/cultivation/MotherPlantBatchPackageBuilder.vue";
import MotherPlantPackageBuilder from "@/components/overlay-widget/cultivation/MotherPlantPackageBuilder.vue";
import MovePlantsBuilder from "@/components/overlay-widget/cultivation/MovePlantsBuilder.vue";
import PackImmaturePlantsBuilder from "@/components/overlay-widget/cultivation/PackImmaturePlantsBuilder.vue";
import PromoteImmaturePlantsBuilder from "@/components/overlay-widget/cultivation/PromoteImmaturePlantsBuilder.vue";
import ReplacePlantBatchTagsBuilder from "@/components/overlay-widget/cultivation/ReplacePlantBatchTagsBuilder.vue";
import ReplacePlantTagsBuilder from "@/components/overlay-widget/cultivation/ReplacePlantTagsBuilder.vue";
import UnpackImmaturePlantsBuilder from "@/components/overlay-widget/cultivation/UnpackImmaturePlantsBuilder.vue";
import MetrcExplorer from "@/components/overlay-widget/explorer/MetrcExplorer.vue";
import MiscellaneousListView from "@/components/overlay-widget/miscellaneous/MiscellaneousListView.vue";
import FinishPackagesBuilder from "@/components/overlay-widget/package/FinishPackagesBuilder.vue";
import ItemTemplateBuilder from "@/components/overlay-widget/package/ItemTemplateBuilder.vue";
import MergePackagesBuilder from "@/components/overlay-widget/package/MergePackagesBuilder.vue";
import MovePackagesBuilder from "@/components/overlay-widget/package/MovePackagesBuilder.vue";
import PackageBuilderListView from "@/components/overlay-widget/package/PackageBuilderListView.vue";
import PackageHistory from "@/components/overlay-widget/package/PackageHistory.vue";
import PackageToolsHelp from "@/components/overlay-widget/package/PackageToolsHelp.vue";
import SplitPackageBuilder from "@/components/overlay-widget/package/SplitPackageBuilder.vue";
import TransferBuilder from "@/components/overlay-widget/transfer/TransferBuilder.vue";
import TransferTemplateBuilder from "@/components/overlay-widget/transfer/TransferTemplateBuilder.vue";
import TransferToolsHelp from "@/components/overlay-widget/transfer/TransferToolsHelp.vue";
import UnavailablePage from "@/components/overlay-widget/UnavailablePage.vue";
import FinalizeSalesReceiptsForm from "@/components/page-overlay/forms/FinalizeSalesReceiptsForm.vue";
import SettingsForm from "@/components/page-overlay/forms/SettingsForm.vue";
import VoidTagForm from "@/components/page-overlay/forms/VoidTagForm.vue";
import GoogleSheetsExport from "@/components/page-overlay/GoogleSheetsExport.vue";
import ManageAccount from "@/components/page-overlay/ManageAccount.vue";
import QuickScripts from "@/components/page-overlay/QuickScripts.vue";
import Screenshot from "@/components/page-overlay/Screenshot.vue";
import VueRouter, { RouteConfig } from "vue-router";

const routes: Array<RouteConfig> = [
  {
    path: "/",
    component: BuilderDefaultView,
  },
  {
    path: "/help/cultivator",
    name: "Cultivation Tools Help",
    component: CultivatorToolsHelp,
  },
  {
    path: "/help/package",
    name: "Package Tools Help",
    component: PackageToolsHelp,
  },
  {
    path: "/help/transfer",
    name: "Transfer Tools Help",
    component: TransferToolsHelp,
  },
  {
    path: "/help/unavailable",
    name: "Unavailable Tools Help",
    component: UnavailablePage,
  },
  {
    path: "/active-project",
    component: ActiveProjectView,
  },
  {
    path: "/cultivator",
    name: "Cultivation Tools",
    component: CultivatorBuilderListView,
  },
  {
    path: "/package",
    name: "Package Tools",
    component: PackageBuilderListView,
  },
  {
    path: "/transfer",
    redirect: "/transfer/create-transfer",
    // name: "Transfer Tools",
    // component: TransferBuilderListView
  },
  {
    path: "/quick-scripts",
    name: "Quick Scripts",
    component: QuickScripts,
  },
  {
    path: "/package/move-packages",
    name: "Move Packages",
    component: MovePackagesBuilder,
  },
  {
    path: "/package/merge-packages",
    name: "Merge Packages",
    component: MergePackagesBuilder,
  },
  {
    path: "/package/add-item-group",
    name: "Add Item Group",
    component: ItemTemplateBuilder,
  },
  {
    path: "/package/history",
    name: "Package History",
    component: PackageHistory,
  },
  {
    path: "/metrc-explorer",
    name: "Metrc Explorer",
    component: MetrcExplorer,
  },
  {
    path: "/package/split-package",
    name: "Split Package",
    component: SplitPackageBuilder,
  },
  {
    path: "/package/finish-packages",
    name: "Finish Packages",
    component: FinishPackagesBuilder,
  },
  {
    path: "/cultivator/destroy-plants",
    name: "Destroy Plants",
    component: DestroyPlantsBuilder,
  },
  {
    path: "/cultivator/harvest-plants",
    name: "Harvest Plants",
    component: HarvestBuilder,
  },
  {
    path: "/cultivator/manicure-plants",
    name: "Manicure Plants",
    component: ManicureBuilder,
  },
  {
    path: "/cultivator/move-plants",
    name: "Move Plants",
    component: MovePlantsBuilder,
  },
  {
    path: "/cultivator/unpack-immature-plants",
    name: "Unpack Immature Plants",
    component: UnpackImmaturePlantsBuilder,
  },
  {
    path: "/cultivator/pack-immature-plants",
    name: "Pack Immature Plants",
    component: PackImmaturePlantsBuilder,
  },
  {
    path: "/cultivator/retag-plants",
    name: "Retag Plants",
    component: ReplacePlantTagsBuilder,
  },
  {
    path: "/cultivator/retag-plant-batches",
    name: "Retag Plant Batches",
    component: ReplacePlantBatchTagsBuilder,
  },
  {
    path: "/cultivator/promote-immature-plants",
    name: "Promote Immature Plants",
    component: PromoteImmaturePlantsBuilder,
  },
  {
    path: "/cultivator/mother",
    name: "Mother Clones/Seeds",
    component: MotherBuilderList,
  },
  {
    path: "/cultivator/mother/plants",
    name: "Mother Plants",
    component: MotherPlantPackageBuilder,
  },
  {
    path: "/cultivator/mother/plant-batches",
    name: "Mother Plant Batches",
    component: MotherPlantBatchPackageBuilder,
  },
  {
    path: "/transfer/create-transfer",
    name: "Create Transfer",
    component: TransferBuilder,
  },
  {
    path: "/transfer/create-transfer-template",
    name: "Create Transfer Template",
    component: TransferTemplateBuilder,
  },
  {
    path: "/admin/debug-layout",
    name: "LayoutSandbox",
    component: LayoutSandbox,
  },
  {
    path: "/admin/picker-sandbox",
    name: "Picker Sandbox",
    component: PickerSandbox,
  },
  {
    path: "/misc",
    name: "T3",
    component: MiscellaneousListView,
  },
  {
    path: "/screenshot/create-screenshot",
    name: "Screenshot Share",
    component: Screenshot,
  },
  {
    path: "/tags/void-tags",
    name: "Void Tags",
    component: VoidTagForm,
  },
  {
    path: "/google-sheets-export",
    name: "Snapshots",
    component: GoogleSheetsExport,
  },
  {
    path: "/sales/finalize-sales",
    name: "Finalize Sales",
    component: FinalizeSalesReceiptsForm,
  },
  {
    path: "/account/account-detail",
    name: "My Account",
    component: ManageAccount,
  },
  {
    path: "/settings/all",
    name: "Settings",
    component: SettingsForm,
  },
  {
    path: "/admin",
    name: "Admin",
    component: AdminListView,
  },
  {
    path: "*",
    component: { template: `<span>Bad route. <router-link to="/">Home</router-link></span>` },
  },
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
];

const router = new VueRouter({
  mode: "abstract",
  routes,
});

export default router;
