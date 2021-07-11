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
  const { pending, id, metadata, base, media, slot } = resaddEntity;

  // JSON.parse would remove unwanted undefines
  nft.resources.push(
    JSON.parse(JSON.stringify({ pending, id, metadata, base, media, slot }))
  );
  // If this is the first resource being added and is immediatly accepted, set default priority array
  if (accepted) {
    if (!nft.priority.includes(resaddEntity.id)) {
      nft.priority.push(resaddEntity.id);
    }
  }
};
