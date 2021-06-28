import { NFT } from "../../../classes/nft";
import { NftClass } from "../../../classes/nft-class";
import {
  BaseConsolidated,
  NftclassConsolidated,
  NFTConsolidated,
} from "../consolidator";
import { Base } from "../../../classes/base";

export interface IConsolidatorAdapter {
  updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTConsume(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTMint(nft: NFT): Promise<any>;
  updateNftclassMint(nftclass: NftclassConsolidated): Promise<any>;
  updateBase(base: BaseConsolidated): Promise<any>;
  updateBaseEquippable(
    base: Base,
    consolidatedBase: BaseConsolidated
  ): Promise<any>;
  updateNftclassIssuer(
    nftclass: NftClass,
    consolidatedNftclass: NftclassConsolidated
  ): Promise<any>;
  updateBaseIssuer(
    base: Base,
    consolidatedBase: BaseConsolidated
  ): Promise<any>;
  getNFTById(id: string): Promise<NFTConsolidated | undefined>;
  getNftclassById(id: string): Promise<NftclassConsolidated | undefined>;
  getBaseById(id: string): Promise<BaseConsolidated | undefined>;
  getNFTByIdUnique(id: string): Promise<NFTConsolidated | undefined>;
  getAllNFTs?: () => Promise<NFTConsolidated[]>;
  getAllNftclasss?: () => Promise<NftclassConsolidated[]>;
  getAllBases?: () => Promise<BaseConsolidated[]>;
}
