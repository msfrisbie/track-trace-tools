import { IAuthState, ICurrentUser } from "@/interfaces";
import { OAuthState } from "./consts";

export interface IPluginAuthState {
  authState: IAuthState | null;
  oAuthState: OAuthState;
  // The following fields are bundled and set together
  identity: string | null;
  token: string | null;
  tokenExpires: number | null;
  email: string | null;
  currentUser: ICurrentUser | null;
}
