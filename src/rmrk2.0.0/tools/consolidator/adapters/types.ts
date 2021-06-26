import { NFT } from "../../../classes/nft";
import { NftClass } from "../../../classes/nft-class";
import { NftclassConsolidated, NFTConsolidated } from "../consolidator";

export interface IConsolidatorAdapter {
  updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTConsume(nft: NFT, consolidatedNFT: NFTConsolidated): Promise<any>;
  updateNFTMint(nft: NFT): Promise<any>;
  updateNftclassMint(nftclass: NftclassConsolidated): Promise<any>;
  updateNftclassIssuer(
    nftclass: NftClass,
    consolidatedNftclass: NftclassConsolidated
  ): Promise<any>;
  getNFTById(id: string): Promise<NFTConsolidated | undefined>;
  getNftclassById(id: string): Promise<NftclassConsolidated | undefined>;
  getNFTByIdUnique(id: string): Promise<NFTConsolidated | undefined>;
  getAllNFTs?: () => Promise<NFTConsolidated[]>;
  getAllNftclasss?: () => Promise<NftclassConsolidated[]>;
}
