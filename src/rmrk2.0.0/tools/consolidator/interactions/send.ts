import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { Send } from "../../../classes/send";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "../adapters/types";
import {
  consolidatedNFTtoInstance,
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

  if (nft.transferable === 0 || nft.transferable >= remark.block || (((nft.block - nft.transferable) < remark.block) && (nft.transferable < 0))) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-transferable NFT ${sendEntity.id}.`
    );
  }

  const rootNewOwner = await findRealOwner(sendEntity.recipient, dbAdapter);

  if (!isValidAddressPolkadotAddress(nft.owner)) {
    // Remove NFT from children of previous owner
    const oldOwner = await dbAdapter.getNFTById(nft.owner);

    const oldOwnerChildIndex =
      oldOwner &&
      oldOwner.children.findIndex((child) => child.id === sendEntity.id);

    if (
      oldOwner &&
      typeof oldOwnerChildIndex !== "undefined" &&
      oldOwnerChildIndex > -1
    ) {
      oldOwner.children.splice(oldOwnerChildIndex, 1);
    }
  }

  if (!isValidAddressPolkadotAddress(sendEntity.recipient)) {
    // Add NFT as child of new owner
    const newOwner = await dbAdapter.getNFTById(sendEntity.recipient);
    const newOwnerChild =
      newOwner && newOwner.children.find((child) => child.id === sendEntity.id);

    if (newOwner && !newOwnerChild) {
      newOwner.children.push({
        id: sendEntity.id,
        pending: rootNewOwner !== remark.caller,
        equipped: "",
      });

      nft.pending = rootNewOwner !== remark.caller;
    }
  }

  if (nft.children && nft.children.length > 0) {
    const promises = nft.children.map(async (child) => {
      const childNftConsolidated = await dbAdapter.getNFTById(child.id);
      const childNft = consolidatedNFTtoInstance(childNftConsolidated);
      if (childNft?.forsale && childNftConsolidated) {
        childNft.addChange({
          field: "forsale",
          old: childNft.forsale,
          new: BigInt(0),
          caller: remark.caller,
          block: remark.block,
          opType: OP_TYPES.SEND,
        } as Change);
        childNft.forsale = BigInt(0);
        await dbAdapter.updateNFTSend(childNft, childNftConsolidated);
      }
      return childNft;
    });

    await Promise.all(promises);
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
  nft.rootowner = rootNewOwner;

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
