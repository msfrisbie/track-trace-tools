import { IAuthState, ICurrentUser } from "@/interfaces";
import { OAuthState, T3ApiAuthState } from "./consts";

export interface IPluginAuthState {
  authState: IAuthState | null;
  oAuthState: OAuthState;
  t3ApiAuthState: T3ApiAuthState;
  // The following fields are bundled and set together
  identity: string | null;
  token: string | null;
  tokenExpires: number | null;
  email: string | null;
  currentUser: ICurrentUser | null;
}
