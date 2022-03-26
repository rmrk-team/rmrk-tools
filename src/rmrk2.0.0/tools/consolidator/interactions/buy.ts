import { Buy } from "../../../classes/buy";
import { OP_TYPES } from "../../constants";
import { BlockCall } from "../../types";
import { Change, ChangeExtraBalanceTransfer } from "../../../changelog";
import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { encodeAddress } from "@polkadot/keyring";
import {
  consolidatedNFTtoInstance,
  findRealOwner,
  isValidAddressPolkadotAddress,
} from "../utils";
import { IConsolidatorAdapter } from "../adapters/types";

export const buyInteraction = async (
  remark: Remark, // Current remark
  buyEntity: Buy,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT, // NFT in current state
  ss58Format?: number
): Promise<void> => {
  // An NFT was bought after having been LISTed for sale
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.BUY}] Attempting to buy non-existant NFT ${buyEntity.id}`
    );
  }

  const rootowner =
    nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));
  nft.rootowner = rootowner;
  validate(remark, buyEntity, nft, ss58Format);

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
          opType: OP_TYPES.BUY,
        } as Change);
        childNft.forsale = BigInt(0);
        await dbAdapter.updateNFTBuy(childNft, childNftConsolidated);
      }
      return childNft;
    });

    await Promise.all(promises);
  }

  if (!isValidAddressPolkadotAddress(nft.owner)) {
    const oldOwner = await dbAdapter.getNFTById(nft.owner);

    const oldOwnerChildIndex =
      oldOwner &&
      oldOwner.children.findIndex((child) => child.id === buyEntity.id);

    if (
      oldOwner &&
      typeof oldOwnerChildIndex !== "undefined" &&
      oldOwnerChildIndex > -1
    ) {
      oldOwner.children.splice(oldOwnerChildIndex, 1);
    }
  }

  const extraTransfers = getExtraBalanceTransfers(remark, nft, ss58Format);

  nft.addChange({
    field: "owner",
    old: nft.owner,
    new: buyEntity.recipient || remark.caller,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.BUY,
  } as Change);

  const newRootOwner =
    buyEntity.recipient && isValidAddressPolkadotAddress(buyEntity.recipient)
      ? buyEntity.recipient
      : remark.caller;

  nft.addChange({
    field: "rootowner",
    old: nft.rootowner,
    new: newRootOwner,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.BUY,
  } as Change);

  nft.owner = buyEntity.recipient || remark.caller;
  nft.rootowner = newRootOwner;

  nft.addChange({
    field: "forsale",
    old: nft.forsale,
    new: BigInt(0),
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.BUY,
    ...(extraTransfers ? { extraTransfers } : {}),
  } as Change);
  nft.forsale = BigInt(0);
};

const getExtraBalanceTransfers = (
  remark: Remark,
  nft: NFT,
  ss58Format?: number
): ChangeExtraBalanceTransfer[] | undefined => {
  const extraTransfers: ChangeExtraBalanceTransfer[] = [];

  remark.extra_ex?.forEach((el: BlockCall) => {
    if (el.call === "balances.transfer") {
      const [owner, forsale] = el.value.split(",");
      const ownerEncoded = ss58Format
        ? encodeAddress(owner, ss58Format)
        : owner;
      // Only record 'extra' transfers and not the main balance transfer
      const transferValue = [ownerEncoded, forsale].join(",");
      if (transferValue !== `${nft.rootowner},${nft.forsale}`) {
        extraTransfers.push({
          receiver: ownerEncoded,
          amount: forsale,
        });
      }
    }
  });

  return extraTransfers.length > 0 ? extraTransfers : undefined;
};

const isTransferValid = (remark: Remark, nft: NFT, ss58Format?: number) => {
  let transferValid = false;
  let transferValue = "";
  remark.extra_ex?.forEach((el: BlockCall) => {
    if (el.call === "balances.transfer") {
      const [owner, forsale] = el.value.split(",");
      const ownerEncoded = ss58Format
        ? encodeAddress(owner, ss58Format)
        : owner;
      transferValue = [ownerEncoded, forsale].join(",");
      if (transferValue === `${nft.rootowner},${nft.forsale}`) {
        transferValid = true;
      }
    }
  });
  return { transferValid, transferValue };
};

const validate = (
  remark: Remark,
  buyEntity: Buy,
  nft: NFT,
  ss58Format?: number
) => {
  const { transferValid, transferValue } = isTransferValid(
    remark,
    nft,
    ss58Format
  );

  switch (true) {
    case Boolean(nft.burned):
      throw new Error(
        `[${OP_TYPES.BUY}] Attempting to buy burned NFT ${buyEntity.id}`
      );
    case nft.forsale <= BigInt(0):
      throw new Error(
        `[${OP_TYPES.BUY}] Attempting to buy not-for-sale NFT ${buyEntity.id}`
      );
    case nft.transferable === 0 || ((nft.transferable > remark.block) && (nft.transferable > 0)) || (((nft.block - nft.transferable) < remark.block) && (nft.transferable < 0)):
      throw new Error(
        `[${OP_TYPES.BUY}] Attempting to buy non-transferable NFT ${buyEntity.id}.`
      );
    case remark.extra_ex?.length === 0:
      throw new Error(
        `[${OP_TYPES.BUY}] No accompanying transfer found for purchase of NFT with ID ${buyEntity.id}.`
      );
    case !transferValid:
      throw new Error(
        `[${OP_TYPES.BUY}] Transfer for the purchase of NFT ID ${buyEntity.id} not valid. Recipient, amount should be ${nft.rootowner},${nft.forsale}, is ${transferValue}.`
      );
  }
};
