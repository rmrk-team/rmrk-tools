import { Remark } from "../remark";
import { List } from "../../../classes/list";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import {
  consolidatedNFTtoInstance,
  findRealOwner,
  isValidAddressPolkadotAddress,
  validateTransferability,
} from "../utils";
import { IConsolidatorAdapter } from "../adapters/types";

export const listForSaleInteraction = async (
  remark: Remark,
  listEntity: List,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
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

  // Check if allowed to send parent NFT. ( owner is Polkadot address )
  if (isValidAddressPolkadotAddress(nft.owner) && nft.owner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list non-owned NFT ${listEntity.id}, real owner: ${nft.owner}`
    );
  }

  const rootowner =
    nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));
  // Check if allowed to send child NFT by rootowner and owner is another NFT id
  if (!isValidAddressPolkadotAddress(nft.owner) && rootowner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.LIST}] Attempting to list non-owned NFT ${listEntity.id}, real rootowner: ${rootowner}`
    );
  }

  if (listEntity.price !== BigInt(0)) {
    validateTransferability(nft, remark, OP_TYPES.LIST);
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
