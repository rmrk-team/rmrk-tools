import { Change } from "../changelog";
export declare class NFT {
    readonly block: number;
    readonly collection: string;
    readonly name: string;
    readonly instance: string;
    readonly transferable: number;
    readonly data?: string;
    readonly sn: string;
    readonly metadata?: string;
    forsale: BigInt | boolean;
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
export interface NFTMetadata {
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
export interface Reactionmap {
    [unicode: string]: string[];
}
