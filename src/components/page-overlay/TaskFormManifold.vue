<template>
  <div>
    <settings-form v-if="!currentView || currentView == settings" />
    <csv-links v-if="currentView == createCsv" />
    <screenshot v-if="currentView == screenshot" />
    <void-tag-form v-if="currentView == voidTags" />
    <package-note-form v-if="currentView == packageNote" />
    <reorder-tags-form v-if="currentView == reorderTags" />
    <finalize-sales-receipts-form v-if="currentView == finalizeSales" />
    <manage-account v-if="currentView == manageAccount" />
  </div>
</template>

<script lang="ts">
import PackageNoteForm from "@/components/page-overlay/forms/DeprecatedPackageNoteForm.vue";
import ReorderTagsForm from "@/components/page-overlay/forms/DeprecatedReorderTagsForm.vue";
import FinalizeSalesReceiptsForm from "@/components/page-overlay/forms/FinalizeSalesReceiptsForm.vue";
import SettingsForm from "@/components/page-overlay/forms/SettingsForm.vue";
import VoidTagForm from "@/components/page-overlay/forms/VoidTagForm.vue";
import ManageAccount from "@/components/page-overlay/ManageAccount.vue";
import Screenshot from "@/components/page-overlay/Screenshot.vue";
import { ToolkitView } from "@/consts";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "TaskFormManifold",
  computed: mapState(["currentView"]),
  data() {
    return {
      settings: ToolkitView.SETTINGS,
      createCsv: ToolkitView.CREATE_CSV,
      screenshot: ToolkitView.SCREENSHOT,
      voidTags: ToolkitView.VOID_TAGS,
      packageNote: ToolkitView.ADD_PACKAGE_NOTE,
      reorderTags: ToolkitView.REORDER_TAGS,
      finalizeSales: ToolkitView.FINALIZE_SALES,
      manageAccount: ToolkitView.MANAGE_ACCOUNT,
    };
  },
  components: {
    PackageNoteForm,
    ReorderTagsForm,
    Screenshot,
    SettingsForm,
    VoidTagForm,
    FinalizeSalesReceiptsForm,
    ManageAccount,
  },
});
</script>
