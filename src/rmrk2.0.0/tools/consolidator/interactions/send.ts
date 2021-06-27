import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { Send } from "../../../classes/send";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "../adapters/types";
import { doesRecipientExists, findRealOwner } from "../utils";

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

  const realOwner = await findRealOwner(sendEntity.id, dbAdapter);
  // Check if allowed to issue send - if owner == caller
  if (realOwner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-owned NFT ${sendEntity.id}, real owner: ${realOwner}`
    );
  }

  // If recipient is not a polkadot account then it must be an existing NFT
  const recipientExists = await doesRecipientExists(
    sendEntity.recipient,
    dbAdapter
  );
  if (recipientExists) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send NFT to a non existing NFT ${sendEntity.recipient}.`
    );
  }

  if (nft.transferable === 0 || nft.transferable >= remark.block) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-transferable NFT ${sendEntity.id}.`
    );
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
  nft.rootowner = realOwner;

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
