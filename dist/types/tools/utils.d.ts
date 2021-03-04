import { ApiPromise } from "@polkadot/api";
import { Remark } from "./consolidator/remark";
export declare const getApi: (wsEndpoint: string) => Promise<ApiPromise>;
export declare const getLatestBlock: (api: ApiPromise) => Promise<number>;
export declare const getLatestFinalizedBlock: (api: ApiPromise) => Promise<number>;
export declare const deeplog: (obj: any) => void;
export declare const stringIsAValidUrl: (s: string) => boolean;
export declare const prefixToArray: (prefix: string) => string[];
declare type Call = {
    call: string;
    value: string;
    caller: string;
};
declare type Block = {
    block: number;
    calls: Call[];
};
export declare const getRemarksFromBlocks: (blocks: Block[]) => Remark[];
export {};
