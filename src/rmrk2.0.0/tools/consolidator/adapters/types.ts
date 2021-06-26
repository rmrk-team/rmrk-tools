import { NFT } from "../../../classes/nft";
import { NftClass } from "../../../classes/nft-class";
import { CollectionConsolidated, NFTConsolidated } from "../consolidator";

export interface IConsolidatorAdapter {
  updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTConsume(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTMint(nft: NFT): Promise<any>;
  updateCollectionMint(nftclass: CollectionConsolidated): Promise<any>;
  updateCollectionIssuer(
    nftclass: NftClass,
    consolidatedCollection: CollectionConsolidated
  ): Promise<any>;
  getNFTById(id: string): Promise<NFTConsolidated | undefined>;
  getCollectionById(id: string): Promise<CollectionConsolidated | undefined>;
  getNFTByIdUnique(id: string): Promise<NFTConsolidated | undefined>;
  getAllNFTs?: () => Promise<NFTConsolidated[]>;
  getAllCollections?: () => Promise<CollectionConsolidated[]>;
}
