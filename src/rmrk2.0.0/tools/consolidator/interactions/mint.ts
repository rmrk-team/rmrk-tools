import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { NftClass } from "../../../classes/nft-class";

export const validateMintNFT = (
  remark: Remark,
  nft: NFT,
  nftParentClass?: NftClass
) => {
  if (!nftParentClass) {
    throw new Error(
      `NFT referencing non-existant parent collection ${nft.collection}`
    );
  }

  nft.owner = nftParentClass.issuer;
  if (remark.caller != nft.owner) {
    throw new Error(
      `Attempted issue of NFT in non-owned collection. Issuer: ${nftParentClass.issuer}, caller: ${remark.caller}`
    );
  }

  if (nft.owner === "") {
    throw new Error(
      `[${OP_TYPES.MINT}] Somehow this NFT still doesn't have an owner.`
    );
  }
};
