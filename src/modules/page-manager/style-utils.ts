import { TTT_DARK_MODE, TTT_LIGHT_MODE } from "@/consts";
import { DarkModeState } from "@/interfaces";
import store from "@/store/page-overlay/index";
import { pageManager } from "./page-manager.module";

export function controlDarkModeImpl(state: DarkModeState) {
  document.body.classList.remove(TTT_DARK_MODE, TTT_LIGHT_MODE);

  switch (state) {
    case DarkModeState.ENABLED:
      document.body.classList.add(TTT_DARK_MODE);
      break;
    case DarkModeState.DISABLED:
    default:
      document.body.classList.add(TTT_LIGHT_MODE);
      break;
  }
}

export function togglePageVisibilityClassesImpl() {
  if (store.state.settings?.hidePackageSearch) {
    document.body.classList.add("package-search-hidden");
  } else {
    document.body.classList.remove("package-search-hidden");
  }

  if (store.state.settings?.hideTransferSearch) {
    document.body.classList.add("transfer-search-hidden");
  } else {
    document.body.classList.remove("transfer-search-hidden");
  }

  if (store.state.settings?.hideInlineTransferButtons) {
    document.body.classList.add("transfer-buttons-hidden");
  } else {
    document.body.classList.remove("transfer-buttons-hidden");
  }

  if (store.state.demoMode) {
    document.body.classList.add("demo-mode");
  } else {
    document.body.classList.remove("demo-mode");
  }

  if (store.state.settings?.fixMetrcStyling) {
    document.body.classList.add("ttt-styling-fix");
  } else {
    document.body.classList.remove("ttt-styling-fix");
  }
}

export function controlLogoutBarImpl(hide: boolean) {
  if (pageManager.sessionTimeoutBar) {
    pageManager.sessionTimeoutBar.style.display = hide ? "none" : "block";
  }
}

export function setExpandedClassImpl() {
  if (store.state.expanded) {
    document.body.classList.add("ttt-expanded");
  } else {
    document.body.classList.remove("ttt-expanded");
  }
}
