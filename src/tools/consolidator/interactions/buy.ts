import { Buy } from "../../../rmrk1.0.0/classes/buy";
import { OP_TYPES } from "../../constants";
import { BlockCall } from "../../types";
import { Change } from "../../../rmrk1.0.0/changelog";
import { Remark } from "../remark";
import { NFT as N100 } from "../../..";

export const interactionBuy = (
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

const validate = (
  remark: Remark, // Current remark
  buyEntity: Buy,
  nft: N100 // NFT in current state
) => {
  if (nft.burned != "") {
    throw new Error(
      `[${OP_TYPES.BUY}] Attempting to buy burned NFT ${buyEntity.id}`
    );
  }
  if (nft.forsale <= BigInt(0)) {
    throw new Error(
      `[${OP_TYPES.BUY}] Attempting to buy not-for-sale NFT ${buyEntity.id}`
    );
  }
  if (nft.transferable === 0 || nft.transferable >= remark.block) {
    throw new Error(
      `[${OP_TYPES.BUY}] Attempting to buy non-transferable NFT ${buyEntity.id}.`
    );
  }
  // Check if we have extra calls in the batch
  if (remark.extra_ex?.length === 0) {
    throw new Error(
      `[${OP_TYPES.BUY}] No accompanying transfer found for purchase of NFT with ID ${buyEntity.id}.`
    );
  }
  // Check if the transfer is valid, i.e. matches target recipient and value.
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
  if (!transferValid) {
    throw new Error(
      `[${OP_TYPES.BUY}] Transfer for the purchase of NFT ID ${buyEntity.id} not valid. Recipient, amount should be ${nft.owner},${nft.forsale}, is ${transferValue}.`
    );
  }
};
