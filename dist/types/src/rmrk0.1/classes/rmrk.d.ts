import { State } from "../types/state";
import { ApiPromise } from "@polkadot/api";
export declare class RMRK {
    static version: number;
    state: State;
    private api;
    constructor(state: State, api: ApiPromise);
    persist: (set: []) => Promise<boolean>;
}
