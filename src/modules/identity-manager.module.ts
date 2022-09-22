import { IAtomicService, IIdentityState } from '@/interfaces';


class IdentityManager implements IAtomicService {
    private _identityStatePromise: Promise<IIdentityState | null>;
    private _identityStateResolver: any;

    // Assumes that the identity can be in exactly one state per page load
    constructor() {
        this._identityStatePromise = new Promise((resolve, reject) => {
            // If identity state cant be acquired in 10s, timeout
            const id = setTimeout(() => reject('Identity state timed out'), 10000);

            this._identityStateResolver = (identityState: any) => {
                clearTimeout(id);
                resolve(identityState);
            };
        });

        this.extractIdentityState();
    }

    async init() { }

    private extractIdentityState() {

    }

    async identityState(): Promise<IIdentityState | null> {
        return await this._identityStatePromise;
    }

    async identityStateOrError(errorMessage: string = 'Missing identity state'): Promise<IIdentityState> {
        const identityState = await this.identityState();

        if (!identityState) {
            throw new Error(errorMessage);
        }

        return identityState;
    }
}

export let identityManager = new IdentityManager();