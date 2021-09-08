import { NFT } from "../../../classes/nft";
import { Collection } from "../../../classes/collection";
import {
  BaseConsolidated,
  CollectionConsolidated,
  NFTConsolidated,
} from "../consolidator";
import { Base } from "../../../classes/base";
import { AcceptEntityType } from "../../../classes/accept";

export interface IConsolidatorAdapter {
  updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNftResadd(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateEquip(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNftAccept(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    entity: AcceptEntityType
  ): Promise<any>;
  updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTBurn(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTMint(nft: NFT): Promise<any>;
  updateSetPriority(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateSetAttribute(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateCollectionMint(collection: CollectionConsolidated): Promise<any>;
  updateBase(base: Base): Promise<any>;
  updateBaseEquippable(
    base: Base,
    consolidatedBase: BaseConsolidated
  ): Promise<any>;
  updateBaseThemeAdd(
    base: Base,
    consolidatedBase: BaseConsolidated
  ): Promise<any>;
  updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated
  ): Promise<any>;
  updateBaseIssuer(
    base: Base,
    consolidatedBase: BaseConsolidated
  ): Promise<any>;
  updateNFTChildrenRootOwner(nft: NFT): Promise<any>;
  getNFTById(id: string): Promise<NFTConsolidated | undefined>;
  getCollectionById(id: string): Promise<CollectionConsolidated | undefined>;
  getBaseById(id: string): Promise<BaseConsolidated | undefined>;
  getNFTByIdUnique(id: string): Promise<NFTConsolidated | undefined>;
  getAllNFTs?: () => Promise<NFTConsolidated[]>;
  getAllCollections?: () => Promise<CollectionConsolidated[]>;
  getAllBases?: () => Promise<BaseConsolidated[]>;
}
