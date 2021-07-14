import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { Collection } from "../../../classes/collection";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner, isValidAddressPolkadotAddress } from "../utils";

export const validateMintNFT = async (
  remark: Remark,
  nft: NFT,
  dbAdapter: IConsolidatorAdapter,
  nftParentCollection?: Collection
) => {
  if (!nftParentCollection) {
    throw new Error(
      `NFT referencing non-existant parent collection ${nft.collection}`
    );
  }

  if (nft.owner) {
    if (isValidAddressPolkadotAddress(nft.owner)) {
      if (remark.caller !== nftParentCollection.issuer) {
        throw new Error(
          `Attempted issue of NFT in non-owned collection. Issuer: ${nftParentCollection.issuer}, caller: ${remark.caller}`
        );
      }
    } else {
      const rootowner = await findRealOwner(nft.owner, dbAdapter);
      nft.rootowner = rootowner || remark.caller;

      // Add NFT as child of new owner
      const newOwner = await dbAdapter.getNFTById(nft.owner);
      const childIndex =
        (newOwner &&
          newOwner.children.findIndex((child) => child.id === nft.getId())) ||
        -1;
      if (newOwner && childIndex < 0) {
        newOwner.children.push({
          id: nft.getId(),
          equipped: "",
          pending: rootowner !== remark.caller,
        });
      }
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
