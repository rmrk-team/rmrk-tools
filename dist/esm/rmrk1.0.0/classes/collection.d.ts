import { Change } from "../changelog";
export declare class Collection {
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
export interface CollectionMetadata {
    description?: string;
    attributes: Attribute[];
    external_url?: string;
    image?: string;
    image_data?: string;
}
export interface Attribute {
    display_type: DisplayType;
    trait_type: string;
    value: number | string;
}
export declare enum DisplayType {
    null = 0,
    "boost_number" = 1,
    "number" = 2,
    "boost_percentage" = 3
}
