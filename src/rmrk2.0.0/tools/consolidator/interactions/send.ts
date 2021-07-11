import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { Send } from "../../../classes/send";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "../adapters/types";
import {
  doesRecipientExists,
  findRealOwner,
  isValidAddressPolkadotAddress,
} from "../utils";

export const sendInteraction = async (
  remark: Remark,
  sendEntity: Send,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-existant NFT ${sendEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send burned NFT ${sendEntity.id}`
    );
  }

  const rootowner = await findRealOwner(sendEntity.id, dbAdapter);
  // Check if allowed to issue send - if owner == caller
  if (rootowner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-owned NFT ${sendEntity.id}, real owner: ${rootowner}`
    );
  }

  // If recipient is not a polkadot account then it must be an existing NFT
  const recipientExists = await doesRecipientExists(
    sendEntity.recipient,
    dbAdapter
  );

  if (!recipientExists) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send NFT to a non existing NFT ${sendEntity.recipient}.`
    );
  }

  if (nft.transferable === 0 || nft.transferable >= remark.block) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-transferable NFT ${sendEntity.id}.`
    );
  }

  if (!isValidAddressPolkadotAddress(sendEntity.recipient)) {
    // Remove NFT from children of previous owner
    const oldOwner = await dbAdapter.getNFTById(nft.owner);

    if (oldOwner?.children && oldOwner?.children[sendEntity.id]) {
      delete oldOwner.children[sendEntity.id];
      if (Object.keys(oldOwner.children).length < 1) {
        oldOwner.children = null;
      }
    }

    // Add NFT as child of new owner
    const newOwner = await dbAdapter.getNFTById(sendEntity.recipient);
    if (newOwner && !newOwner?.children?.[sendEntity.id]) {
      if (!newOwner.children) {
        newOwner.children = {};
      }
      const rootNewOwner = await findRealOwner(sendEntity.recipient, dbAdapter);
      newOwner.children[sendEntity.id] = {
        id: sendEntity.id,
        pending: rootNewOwner !== remark.caller,
        equipped: "",
      };
    }
  }

  nft.addChange({
    field: "owner",
    old: nft.owner,
    new: sendEntity.recipient,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.SEND,
  } as Change);

  nft.owner = sendEntity.recipient;
  nft.rootowner = rootowner;

  // Cancel LIST, if any
  if (nft.forsale > BigInt(0)) {
    nft.addChange({
      field: "forsale",
      old: nft.forsale,
      new: BigInt(0),
      caller: remark.caller,
      block: remark.block,
      opType: OP_TYPES.SEND,
    } as Change);
    nft.forsale = BigInt(0);
  }
};
