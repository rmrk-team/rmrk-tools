import { Remark } from "../remark";
import { List } from "../../../classes/list";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import { isValidAddressPolkadotAddress } from "../utils";

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

  if (!isValidAddressPolkadotAddress(nft.owner)) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list NFT ${listEntity.id} who's owner is another NFT ${nft.owner}.`
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
