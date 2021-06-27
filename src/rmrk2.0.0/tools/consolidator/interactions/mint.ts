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
      `NFT referencing non-existant parent nft class ${nft.nftclass}`
    );
  }

  // nft.owner can be alrready set if mint remark has recipient field that allows to mint directly onto another nft
  nft.owner = nft.owner || nftParentClass.issuer;
  if (remark.caller != nftParentClass.issuer) {
    throw new Error(
      `Attempted issue of NFT in non-owned nft class. Issuer: ${nftParentClass.issuer}, caller: ${remark.caller}`
    );
  }

  if (nft.owner === "") {
    throw new Error(
      `[${OP_TYPES.MINT}] Somehow this NFT still doesn't have an owner.`
    );
  }
};
