import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { Resadd } from "../../../classes/resadd";
import { findRealOwner } from "../utils";
import { IConsolidatorAdapter } from "../adapters/types";

export const resAddInteraction = async (
  remark: Remark,
  resaddEntity: Resadd,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.RESADD}] Attempting to add resource on a non-existant NFT ${resaddEntity.nftId}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.RESADD}] Attempting to add resource on burned NFT ${resaddEntity.nftId}`
    );
  }

  const nftClass = await dbAdapter.getNftclassById(nft.nftclass);
  if (!nftClass || nftClass.issuer !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.RESADD}] Attempting to add resource to NFT in non-owned collection ${nft.nftclass}`
    );
  }

  // If NFT owner is adding this resource then immediatly accept it
  const rootowner = await findRealOwner(nft.owner, dbAdapter);

  const accepted = rootowner === remark.caller;
  resaddEntity.pending = !accepted;

  nft.resources.push(resaddEntity);
  // If this is the first resource being added and is immediatly accepted, set default priority array
  if (nft.resources.length === 1 && accepted) {
    nft.priority = [0];
  }
};
