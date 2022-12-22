const path: string = window.location.pathname;

export async function manageLoginRedirect() {
  // const match = path.match(METRC_INDUSTRY_LICENSE_PATH_REGEX);
  // let license = null;
  // // TODO lookup home license
  // if (match) {
  //     license = match[1];
  // }
  // if (store.state.navigateOnNextLoad) {
  //     // The previous page told us to redirect,
  //     // but we need to check that the login was successful
  //     // const authState: IAuthState | null = await authManager.authStateOrNull();
  //     if (license) {
  //         // A login just happened, so trigger a
  //         // redirect when the page loads
  //         let path = null;
  //         // Redirect should not interfere with site use. Unset
  //         // in all situations, even if a redirect is not triggered.
  //         store.commit(MutationType.SET_REDIRECT, false);
  //         switch (store.state.settings?.landingPage) {
  //             case LandingPage.TRANSFERS:
  //                 path = `/industry/${license}/transfers/licensed`;
  //                 break;
  //             case LandingPage.TRANSFER_HUB:
  //                 path = `/industry/${license}/transfers/hub`;
  //                 break;
  //             case LandingPage.PACKAGES:
  //                 path = `/industry/${license}/packages`;
  //                 break;
  //             case LandingPage.PLANTS:
  //                 path = `/industry/${license}/plants`;
  //                 break;
  //             case LandingPage.DEFAULT:
  //             default:
  //                 break;
  //         }
  //         if (path) {
  //             window.location.href = path;
  //         }
  //     } else {
  //         // Login was not successful, do not redirect
  //         store.commit(MutationType.SET_REDIRECT, false);
  //     }
  // } else {
  //     const currentLocation = window.location.pathname;
  //     if (currentLocation === '/log-in') {
  //         store.commit(MutationType.SET_REDIRECT, true);
  //     } else {
  //         store.commit(MutationType.SET_REDIRECT, false);
  //     }
  // }
}
