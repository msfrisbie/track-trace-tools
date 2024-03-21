import {
  TTT_BACKGROUND_COLOR,
  TTT_BACKGROUND_DEFAULT,
  TTT_BACKGROUND_GRADIENT,
  TTT_BACKGROUND_IMAGE,
  TTT_DARK_MODE,
  TTT_LIGHT_MODE,
} from "@/consts";
import { BackgroundState, DarkModeState } from "@/interfaces";
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

export function controlBackgroundImpl(state: BackgroundState) {
  let klass: string;

  switch (state) {
    case BackgroundState.COLOR:
      klass = TTT_BACKGROUND_COLOR;
      break;
    case BackgroundState.GRADIENT:
      klass = TTT_BACKGROUND_GRADIENT;
      break;
    case BackgroundState.IMAGE:
      klass = TTT_BACKGROUND_IMAGE;
      break;
    default:
    case BackgroundState.DEFAULT:
      klass = TTT_BACKGROUND_DEFAULT;
      break;
  }

  if (document.body.classList.contains(klass)) {
    return;
  }

  document.body.classList.remove(
    TTT_BACKGROUND_COLOR,
    TTT_BACKGROUND_DEFAULT,
    TTT_BACKGROUND_GRADIENT,
    TTT_BACKGROUND_IMAGE
  );
  document.body.classList.add(klass);

  document.body.style.backgroundColor = "";
  document.body.style.background = "";
  document.body.style.backgroundImage = "";

  switch (state) {
    case BackgroundState.COLOR:
      document.body.style.background = `linear-gradient(to right, ${store.state.settings.backgroundColor}, ${store.state.settings.backgroundColor})`;
      break;
    case BackgroundState.GRADIENT:
      document.body.style.background = `linear-gradient(to right, ${store.state.settings.backgroundGradientStartColor}, ${store.state.settings.backgroundGradientEndColor})`;
      break;
    case BackgroundState.IMAGE:
      document.body.style.backgroundImage = `url(${store.state.settings.backgroundImage})`;
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

  if (store.state.settings?.efficientSpacing) {
    document.body.classList.add("ttt-efficient-spacing");
  } else {
    document.body.classList.remove("ttt-efficient-spacing");
  }

  if (store.state.settings?.modalExpand) {
    document.body.classList.add("t3-modal-expand");
  } else {
    document.body.classList.remove("t3-modal-expand");
  }
}

export function controlLogoutBarImpl(hide: boolean) {
  if (pageManager.sessionTimeoutBar) {
    pageManager.sessionTimeoutBar.style.display = hide ? "none" : "block";
  }
}
