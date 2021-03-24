import { Buy } from "../../../rmrk1.0.0/classes/buy";
import { OP_TYPES } from "../../constants";
import { BlockCall } from "../../types";
import { Change } from "../../../rmrk1.0.0/changelog";
import { Remark } from "../remark";
import { NFT as N100 } from "../../..";

export const buyInteraction = (
  remark: Remark, // Current remark
  buyEntity: Buy,
  nft?: N100 // NFT in current state
): void => {
  // An NFT was bought after having been LISTed for sale
  console.log("Instantiating buy");
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.BUY}] Attempting to buy non-existant NFT ${buyEntity.id}`
    );
  }

  validate(remark, buyEntity, nft);

  nft.addChange({
    field: "owner",
    old: nft.owner,
    new: remark.caller,
    caller: remark.caller,
    block: remark.block,
  } as Change);
  nft.owner = remark.caller;

  nft.addChange({
    field: "forsale",
    old: nft.forsale,
    new: BigInt(0),
    caller: remark.caller,
    block: remark.block,
  } as Change);
  nft.forsale = BigInt(0);
};

const isTransferValid = (remark: Remark, nft: N100) => {
  let transferValid = false;
  let transferValue = "";
  remark.extra_ex?.forEach((el: BlockCall) => {
    if (el.call === "balances.transfer") {
      transferValue = el.value;
      if (el.value === `${nft.owner},${nft.forsale}`) {
        transferValid = true;
      }
    }
  });
  return { transferValid, transferValue };
};

const validate = (remark: Remark, buyEntity: Buy, nft: N100) => {
  const { transferValid, transferValue } = isTransferValid(remark, nft);

  switch (true) {
    case nft.burned != "":
      throw new Error(
        `[${OP_TYPES.BUY}] Attempting to buy burned NFT ${buyEntity.id}`
      );
    case nft.forsale <= BigInt(0):
      throw new Error(
        `[${OP_TYPES.BUY}] Attempting to buy not-for-sale NFT ${buyEntity.id}`
      );
    case nft.transferable === 0 || nft.transferable >= remark.block:
      throw new Error(
        `[${OP_TYPES.BUY}] Attempting to buy non-transferable NFT ${buyEntity.id}.`
      );
    case remark.extra_ex?.length === 0:
      throw new Error(
        `[${OP_TYPES.BUY}] No accompanying transfer found for purchase of NFT with ID ${buyEntity.id}.`
      );
    case !transferValid:
      throw new Error(
        `[${OP_TYPES.BUY}] Transfer for the purchase of NFT ID ${buyEntity.id} not valid. Recipient, amount should be ${nft.owner},${nft.forsale}, is ${transferValue}.`
      );
  }
};
