import {
  BaseConsolidated,
  CollectionConsolidated,
  NFTConsolidated,
} from "../consolidator";
import { Collection } from "../../../classes/collection";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "./types";
import { Base } from "../../../classes/base";
import { AcceptEntityType } from "../../../classes/accept";

export class InMemoryAdapter implements IConsolidatorAdapter {
  public nfts: NFTConsolidated[];
  public collections: CollectionConsolidated[];
  public bases: BaseConsolidated[];
  constructor() {
    this.nfts = [];
    this.collections = [];
    this.bases = [];
  }

  public async getAllNFTs() {
    return this.nfts;
  }

  public async getAllCollections() {
    return this.collections;
  }

  public async getAllBases() {
    return this.bases;
  }

  public async updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      reactions: nft?.reactions,
    };
  }

  public async updateBaseEquippable(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    const baseIndex = this.bases.findIndex(
      (baseItem) => baseItem.id === consolidatedBase.id
    );
    this.bases[baseIndex] = {
      ...this.bases[baseIndex],
      parts: base?.parts,
    };
  }

  public async updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      forsale: nft?.forsale,
      changes: nft?.changes,
    };
  }

  public async updateEquip(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      children: nft.children,
    };
  }

  public async updateSetPriority(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      priority: nft.priority,
    };
  }

  public async updateNftAccept(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    entity: AcceptEntityType
  ) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    if (entity == "NFT") {
      this.nfts[nftIndex] = {
        ...this.nfts[nftIndex],
        children: nft?.children,
        priority: nft?.priority || this.nfts[nftIndex].priority,
      };
    } else if (entity === "RES") {
      this.nfts[nftIndex] = {
        ...this.nfts[nftIndex],
        resources: nft?.resources,
        priority: nft?.priority || this.nfts[nftIndex].priority,
      };
    }
  }

  public async updateNftResadd(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      resources: nft?.resources,
      priority: nft?.priority || this.nfts[nftIndex].priority,
    };
  }

  public async updateNFTChildrenRootOwner(
    nft: NFT | NFTConsolidated,
    rootowner?: string
  ) {
    if (nft.children && nft.children.length > 0) {
      const promises = nft.children.map(async (child) => {
        const nftIndex = this.nfts.findIndex(
          (nftItem) => nftItem.id === child.id
        );
        if (
          this.nfts[nftIndex]?.children &&
          this.nfts[nftIndex]?.children.length > 0
        ) {
          await this.updateNFTChildrenRootOwner(
            this.nfts[nftIndex],
            rootowner || nft.rootowner
          );
        }
        this.nfts[nftIndex] = {
          ...this.nfts[nftIndex],
          rootowner: rootowner || nft.rootowner,
        };
      });

      await Promise.all(promises);
    }
  }

  public async updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      owner: nft?.owner,
      changes: nft?.changes,
      forsale: nft?.forsale,
    };
  }

  public async updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      changes: nft?.changes,
      owner: nft?.owner,
      rootowner: nft?.rootowner,
      forsale: BigInt(0),
      pending: nft?.pending,
    };
  }

  public async updateNFTBurn(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      burned: nft?.burned,
      changes: nft?.changes,
      forsale: BigInt(nft.forsale) > BigInt(0) ? BigInt(0) : nft.forsale,
    };
  }

  public async updateNFTMint(nft: NFT) {
    this.nfts.push({
      ...nft,
      symbol: nft.symbol,
      id: nft.getId(),
    });
  }

  public async updateCollectionMint(collection: CollectionConsolidated) {
    return this.collections.push(collection);
  }

  public async updateBase(base: Base) {
    return this.bases.push({
      ...base,
      id: base.getId(),
    });
  }

  public async updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated
  ) {
    const collectionIndex = this.collections.findIndex(
      (nftItem) => nftItem.id === consolidatedCollection.id
    );
    this.collections[collectionIndex] = {
      ...this.collections[collectionIndex],
      issuer: collection?.issuer,
      changes: collection?.changes,
    };
  }

  public async updateBaseIssuer(
    base: Base,
    consolidatedBase: BaseConsolidated
  ) {
    const baseIndex = this.bases.findIndex(
      (baseItem) => baseItem.id === consolidatedBase.id
    );
    this.bases[baseIndex] = {
      ...this.bases[baseIndex],
      issuer: base?.issuer,
      changes: base?.changes,
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

  public async getBaseById(id: string) {
    return this.bases.find((base) => base.id === id);
  }
}
