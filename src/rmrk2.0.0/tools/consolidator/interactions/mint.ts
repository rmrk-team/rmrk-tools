import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { NftClass } from "../../../classes/nft-class";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner, isValidAddressPolkadotAddress } from "../utils";

export const validateMintNFT = async (
  remark: Remark,
  nft: NFT,
  dbAdapter: IConsolidatorAdapter,
  nftParentClass?: NftClass
) => {
  if (!nftParentClass) {
    throw new Error(
      `NFT referencing non-existant parent nft class ${nft.nftclass}`
    );
  }

  const rootowner = await findRealOwner(nft.getId(), dbAdapter);
  nft.rootowner = rootowner;

  if (isValidAddressPolkadotAddress(nft.owner)) {
    if (remark.caller !== nftParentClass.issuer) {
      throw new Error(
        `Attempted issue of NFT in non-owned nft class. Issuer: ${nftParentClass.issuer}, caller: ${remark.caller}`
      );
    }
  }

  // nft.owner can be already set if mint remark has recipient field that allows to mint directly onto another nft
  nft.owner = nft.owner || remark.caller;

  if (nft.owner === "") {
    throw new Error(
      `[${OP_TYPES.MINT}] Somehow this NFT still doesn't have an owner.`
    );
  }
};
