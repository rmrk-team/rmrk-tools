import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import { Remark } from "./remark";
export declare class Consolidator {
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
    consolidate(rmrks?: Remark[]): {
        nfts: N100[];
        collections: C100[];
    };
}
