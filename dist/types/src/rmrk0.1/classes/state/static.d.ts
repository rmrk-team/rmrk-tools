import { State } from "../../types/state";
import { Collection } from "../collection";
import { NFT } from "../nft";
export declare class StaticState implements State {
    private filepath;
    constructor(filepath: string);
    getAllCollections(): Promise<Collection[]>;
    getCollection(id: string): Promise<Collection>;
    getLastSyncedBlock(): Promise<number>;
    getNFTsForCollection(id: string): Promise<NFT[]>;
    getNFT(id: string): Promise<NFT>;
    getNFTsForAccount(account: string): Promise<NFT[]>;
    refresh(): Promise<StaticState>;
}
