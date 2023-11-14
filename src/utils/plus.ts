import store from "@/store/page-overlay/index";

export function hasPlusImpl(): boolean {
    return store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus;
}
