import { NFT } from "../../../rmrk1.0.0/classes/nft";
import { Collection } from "../../../rmrk1.0.0/classes/collection";
import { CollectionConsolidated, NFTConsolidated } from "../consolidator";

export interface IConsolidatorAdapter {
  updateNFTEmote(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<any>;
  updateNFTList(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<any>;
  updateNFTBuy(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<any>;
  updateNFTSend(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<any>;
  updateNFTConsume(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<any>;
  updateNFTMint(nft: NFT, updatedAtBlock: number): Promise<any>;
  updateCollectionMint(collection: CollectionConsolidated): Promise<any>;
  updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated,
    updatedAtBlock: number
  ): Promise<any>;
  getNFTById(id: string): Promise<NFTConsolidated | undefined>;
  getCollectionById(id: string): Promise<CollectionConsolidated | undefined>;
  getNFTByIdUnique(id: string): Promise<NFTConsolidated | undefined>;
  getAllNFTs?: () => Promise<Record<string, NFTConsolidated>>;
  getAllCollections?: () => Promise<Record<string, CollectionConsolidated>>;
}
