import { IAuthState } from "@/interfaces";
import { ICurrentUser } from "@/interfaces";

export interface IPluginAuthState {
    authState: IAuthState | null,
    // The following fields are bundled and set together
    identity: string | null,
    token: string | null,
    tokenExpires: number | null,
    email: string | null,
    currentUser: ICurrentUser | null,
}