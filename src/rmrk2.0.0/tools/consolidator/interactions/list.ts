import { Remark } from "../remark";
import { List } from "../../../rmrk1.0.0/classes/list";
import { NFT } from "../../..";
import { OP_TYPES } from "../../constants";
import { Change } from "../../../rmrk1.0.0/changelog";

export const listForSaleInteraction = (
  remark: Remark,
  listEntity: List,
  nft?: NFT
): void => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list non-existant NFT ${listEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list burned NFT ${listEntity.id}`
    );
  }

  // Check if allowed to issue send - if owner == caller
  if (nft.owner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list non-owned NFT ${listEntity.id}, real owner: ${nft.owner}`
    );
  }

  if (nft.transferable === 0 || nft.transferable >= remark.block) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list non-transferable NFT ${listEntity.id}.`
    );
  }

  if (listEntity.price !== nft.forsale) {
    nft.updatedAtBlock = remark.block;
    nft.addChange({
      field: "forsale",
      old: nft.forsale,
      new: listEntity.price,
      caller: remark.caller,
      block: remark.block,
      opType: OP_TYPES.LIST,
    } as Change);

    nft.forsale = listEntity.price;
  }
};
