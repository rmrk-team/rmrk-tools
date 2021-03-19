import { Remark } from "../remark";
import { NFT } from "../../..";
import { OP_TYPES } from "../../constants";
import { Collection } from "../../..";

export const validateMintNFT = (
  remark: Remark,
  nft: NFT,
  nftParentCollection?: Collection
) => {
  if (!nftParentCollection) {
    throw new Error(
      `NFT referencing non-existant parent collection ${nft.collection}`
    );
  }

  nft.owner = nftParentCollection.issuer;
  if (remark.caller != nft.owner) {
    throw new Error(
      `Attempted issue of NFT in non-owned collection. Issuer: ${nftParentCollection.issuer}, caller: ${remark.caller}`
    );
  }

  if (nft.owner === "") {
    throw new Error(
      `[${OP_TYPES.MINTNFT}] Somehow this NFT still doesn't have an owner.`
    );
  }
};
