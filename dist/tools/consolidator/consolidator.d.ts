import JsonAdapter from "./adapters/json";
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
    consolidate(rmrks?: Remark[]): void;
}
