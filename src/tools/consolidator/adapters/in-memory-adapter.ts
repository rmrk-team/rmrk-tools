import { CollectionConsolidated, NFTConsolidated } from "../consolidator";
import { Collection } from "../../../rmrk1.0.0/classes/collection";
import { NFT } from "../../../rmrk1.0.0/classes/nft";
import { IConsolidatorAdapter } from "./types";

export class InMemoryAdapter implements IConsolidatorAdapter {
  public nfts: Record<string, NFTConsolidated>;
  public collections: Record<string, CollectionConsolidated>;
  constructor() {
    this.nfts = {};
    this.collections = {};
  }

  public async getAllNFTs() {
    return this.nfts;
  }

  public async getAllCollections() {
    return this.collections;
  }

  public async updateNFTEmote(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ) {
    this.nfts[consolidatedNFT.id] = {
      ...this.nfts[consolidatedNFT.id],
      reactions: nft?.reactions,
      updatedAtBlock,
    };
  }

  public async updateNFTList(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ) {
    this.nfts[consolidatedNFT.id] = {
      ...this.nfts[consolidatedNFT.id],
      forsale: nft?.forsale,
      changes: nft?.changes,
      updatedAtBlock,
    };
  }

  public async updateNFTBuy(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ) {
    this.nfts[consolidatedNFT.id] = {
      ...this.nfts[consolidatedNFT.id],
      owner: nft?.owner,
      changes: nft?.changes,
      forsale: nft?.forsale,
      updatedAtBlock,
    };
  }

  public async updateNFTSend(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ) {
    this.nfts[consolidatedNFT.id] = {
      ...this.nfts[consolidatedNFT.id],
      changes: nft?.changes,
      owner: nft?.owner,
      forsale: BigInt(0),
      updatedAtBlock,
    };
  }

  public async updateNFTConsume(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ) {
    this.nfts[consolidatedNFT.id] = {
      ...this.nfts[consolidatedNFT.id],
      burned: nft?.burned,
      changes: nft?.changes,
      forsale: BigInt(nft.forsale) > BigInt(0) ? BigInt(0) : nft.forsale,
      updatedAtBlock,
    };
  }

  public async updateNFTMint(nft: NFT, updatedAtBlock: number) {
    this.nfts[nft.getId()] = {
      ...nft,
      instance: nft.instance,
      id: nft.getId(),
      updatedAtBlock: nft.updatedAtBlock || updatedAtBlock,
    };
  }

  public async updateCollectionMint(collection: CollectionConsolidated) {
    return this.collections[collection.id] = collection;
  }

  public async updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated,
    updatedAtBlock: number
  ) {
    this.collections[consolidatedCollection.id] = {
      ...this.collections[consolidatedCollection.id],
      issuer: collection?.issuer,
      changes: collection?.changes,
      updatedAtBlock,
    };
  }

  public async getNFTById(id: string) {
    return this.nfts[id];
  }

  public async getCollectionById(id: string) {
    return this.collections[id];
  }

  /**
   * Find existing NFT by id
   */
  public async getNFTByIdUnique(id: string) {
    return this.nfts[id];
  }
}
