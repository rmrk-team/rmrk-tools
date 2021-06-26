import { CollectionConsolidated, NFTConsolidated } from "../consolidator";
import { Collection } from "../../../classes/collection";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "./types";

export class InMemoryAdapter implements IConsolidatorAdapter {
  public nfts: NFTConsolidated[];
  public collections: CollectionConsolidated[];
  constructor() {
    this.nfts = [];
    this.collections = [];
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
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      reactions: nft?.reactions,
      updatedAtBlock,
    };
  }

  public async updateNFTList(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
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
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
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
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
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
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      burned: nft?.burned,
      changes: nft?.changes,
      forsale: BigInt(nft.forsale) > BigInt(0) ? BigInt(0) : nft.forsale,
      updatedAtBlock,
    };
  }

  public async updateNFTMint(nft: NFT, updatedAtBlock: number) {
    this.nfts.push({
      ...nft,
      instance: nft.instance,
      id: nft.getId(),
      updatedAtBlock: nft.updatedAtBlock || updatedAtBlock,
    });
  }

  public async updateCollectionMint(collection: CollectionConsolidated) {
    return this.collections.push(collection);
  }

  public async updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated,
    updatedAtBlock: number
  ) {
    const collectionIndex = this.collections.findIndex(
      (nftItem) => nftItem.id === consolidatedCollection.id
    );
    this.collections[collectionIndex] = {
      ...this.collections[collectionIndex],
      issuer: collection?.issuer,
      changes: collection?.changes,
      updatedAtBlock,
    };
  }

  public async getNFTById(id: string) {
    return this.nfts.find((nft) => nft.id === id);
  }

  public async getCollectionById(id: string) {
    return this.collections.find((collection) => collection.id === id);
  }

  /**
   * Find existing NFT by id
   */
  public async getNFTByIdUnique(id: string) {
    return this.nfts.find((nft) => {
      return nft.id === id;
    });
  }
}
