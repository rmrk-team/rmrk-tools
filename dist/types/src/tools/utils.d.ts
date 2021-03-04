import { ApiPromise } from "@polkadot/api";
export declare const getApi: (wsEndpoint: string) => Promise<ApiPromise>;
export declare const getLatestBlock: (api: ApiPromise) => Promise<number>;
export declare const getLatestFinalizedBlock: (api: ApiPromise) => Promise<number>;
export declare const deeplog: (obj: any) => void;
export declare const stringIsAValidUrl: (s: string) => boolean;
export declare const prefixToArray: (prefix: string) => string[];
