import { ApiPromise } from "@polkadot/api";
import { Remark } from "./consolidator/remark";
import { SignedBlock } from "@polkadot/types/interfaces/runtime";
import { BlockCall } from "./types";
import { BlockHash } from "@polkadot/types/interfaces/chain";
export declare const getApi: (wsEndpoint: string) => Promise<ApiPromise>;
export declare const getLatestBlock: (api: ApiPromise) => Promise<number>;
export declare const getLatestFinalizedBlock: (api: ApiPromise) => Promise<number>;
export declare const deeplog: (obj: any) => void;
export declare const stringIsAValidUrl: (s: string) => boolean;
export declare const prefixToArray: (prefix: string) => string[];
interface Call {
    call: string;
    value: string;
    caller: string;
}
export declare type Block = {
    block: number;
    calls: Call[];
};
export declare const getRemarksFromBlocks: (blocks: Block[]) => Remark[];
export declare const isBatchInterrupted: (api: ApiPromise, blockHash: BlockHash, extrinsicIndex: number) => Promise<boolean>;
export declare const getBlockCallsFromSignedBlock: (signedBlock: SignedBlock, prefixes: string[], api: ApiPromise) => Promise<BlockCall[] | []>;
export declare const getRemarkData: (dataString: string) => any;
export {};
