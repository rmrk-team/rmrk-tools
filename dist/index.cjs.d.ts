import { ApiPromise } from "@polkadot/api";
type Remark = {
    block: number;
    interaction_type: string;
    caller: string;
    version: string;
    remark: string;
};
/**
 * The JSON adapter expects to find a JSON array with elements
 * adhering to the following format in the provided filepath:
 *
 {
 block: 5437981,
 calls: [
 {
 call: 'system.remark',
 value: '0x726d726b3a3a53454e443a...633350444e4336706533',
 caller: 'DmUVjSi8id22vcH26btyVsVq39p8EVPiepdBEYhzoLL8Qby'
 }
 ]
 }
 */
declare class JsonAdapter {
    private inputData;
    constructor(filePath: string);
    getInputDataRaw(): JsonRow[];
    getRemarks(): Remark[];
}
type Call = {
    call: string;
    value: string;
    caller: string;
};
type JsonRow = {
    block: number;
    calls: Call[];
};
// import * as fs from "fs";
declare class Consolidator {
    private adapter?;
    private invalidCalls;
    private collections;
    private nfts;
    constructor(initializedAdapter?: JsonAdapter);
    private findExistingCollection;
    private updateInvalidCalls;
    private mint;
    private mintNFT;
    private send;
    private emote;
    private changeIssuer;
    consolidate(rmrks?: Remark[]): void;
}
type Change = {
    field: string;
    old: string;
    new: string;
    caller: string;
    block: number;
    valid: boolean;
};
declare class Collection {
    readonly block: number;
    readonly name: string;
    readonly max: number;
    issuer: string;
    readonly symbol: string;
    readonly id: string;
    readonly metadata: string;
    static V: string;
    private changes;
    loadedMetadata?: CollectionMetadata;
    constructor(block: number, name: string, max: number, issuer: string, symbol: string, id: string, metadata: string);
    mint(): string;
    change_issuer(address: string): string;
    addChange(c: Change): Collection;
    getChanges(): Change[];
    static generateId(pubkey: string, symbol: string): string;
    static fromRemark(remark: string, block?: number): Collection | string;
    /**
     * TBD - hard dependency on Axios / IPFS to fetch remote
     */
    private load_metadata;
}
interface CollectionMetadata {
    description?: string;
    attributes: Attribute[];
    external_url?: string;
    image?: string;
    image_data?: string;
}
interface Attribute {
    display_type: DisplayType;
    trait_type: string;
    value: number | string;
}
declare enum DisplayType {
    null = 0,
    "boost_number" = 1,
    "number" = 2,
    "boost_percentage" = 3
}
declare class NFT {
    readonly block: number;
    readonly collection: string;
    readonly name: string;
    readonly instance: string;
    readonly transferable: number;
    readonly data?: string;
    readonly sn: string;
    readonly metadata?: string;
    reactions: Reactionmap;
    private changes;
    owner: string;
    static V: string;
    loadedMetadata?: NFTMetadata;
    constructor(block: number, collection: string, name: string, instance: string, transferable: number, sn: string, metadata?: string, data?: string);
    getId(): string;
    addChange(c: Change): NFT;
    mintnft(): string;
    send(recipient: string): string;
    // @todo build this out, maybe data type?
    static checkDataFormat(data: string): boolean;
    static fromRemark(remark: string, block?: number): NFT | string;
    /**
     * @param price In plancks, so 10000000000 for 0.01 KSM. Set to 0 if canceling listing.
     */
    list(price: number): string;
    buy(): string;
    consume(): string;
    /**
     * TBD - hard dependency on Axios / IPFS to fetch remote
     */
    private load_metadata;
}
interface NFTMetadata {
    external_url?: string;
    image?: string;
    image_data?: string;
    description?: string;
    name?: string;
    attributes: Attribute[];
    background_color?: string;
    animation_url?: string;
    youtube_url?: string;
}
interface Reactionmap {
    [unicode: string]: string[];
}
type BlockCalls = {
    block: number;
    calls: BlockCall[];
};
type BlockCall = {
    call: string;
    value: string;
    caller: string;
};
declare const _default: (api: ApiPromise, from: number, to: number, prefixes: string[]) => Promise<BlockCalls[]>;
declare namespace utils {
    type Remark = {
        block: number;
        interaction_type: string;
        caller: string;
        version: string;
        remark: string;
    };
    const getApi: (wsEndpoint: string) => Promise<ApiPromise>;
    const getLatestBlock: (api: ApiPromise) => Promise<number>;
    const getLatestFinalizedBlock: (api: ApiPromise) => Promise<number>;
    const deeplog: (obj: any) => void;
    const stringIsAValidUrl: (s: string) => boolean;
    const prefixToArray: (prefix: string) => string[];
    type Call = {
        call: string;
        value: string;
        caller: string;
    };
    type Block = {
        block: number;
        calls: Call[];
    };
    const getRemarksFromBlocks: (blocks: Block[]) => Remark[];
}
export { Consolidator, Collection as c100, NFT as n100, _default as fetchRemarks, utils };
