import {
  BaseConsolidated,
  NftclassConsolidated,
  NFTConsolidated,
} from "../consolidator";
import { NftClass } from "../../../classes/nft-class";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "./types";
import { Base } from "../../../classes/base";

export class InMemoryAdapter implements IConsolidatorAdapter {
  public nfts: NFTConsolidated[];
  public nftclasses: NftclassConsolidated[];
  public bases: BaseConsolidated[];
  constructor() {
    this.nfts = [];
    this.nftclasses = [];
    this.bases = [];
  }

  public async getAllNFTs() {
    return this.nfts;
  }

  public async getAllNftclasss() {
    return this.nftclasses;
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
      forsale: BigInt(0),
    };
  }

  public async updateNFTConsume(nft: NFT, consolidatedNFT: NFTConsolidated) {
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
      instance: nft.instance,
      id: nft.getId(),
    });
  }

  public async updateNftclassMint(nftclass: NftclassConsolidated) {
    return this.nftclasses.push(nftclass);
  }

  public async updateBase(base: BaseConsolidated) {
    return this.bases.push(base);
  }

  public async updateNftclassIssuer(
    nftclass: NftClass,
    consolidatedNftclass: NftclassConsolidated
  ) {
    const nftclassIndex = this.nftclasses.findIndex(
      (nftItem) => nftItem.id === consolidatedNftclass.id
    );
    this.nftclasses[nftclassIndex] = {
      ...this.nftclasses[nftclassIndex],
      issuer: nftclass?.issuer,
      changes: nftclass?.changes,
    };
  }

  public async getNFTById(id: string) {
    return this.nfts.find((nft) => nft.id === id);
  }

  public async getNftclassById(id: string) {
    return this.nftclasses.find((nftclass) => nftclass.id === id);
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
